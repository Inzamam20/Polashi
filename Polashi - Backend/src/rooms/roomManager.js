const { GAME_PHASES } = require('../game/constants');
const {
  initGame,
  getPublicState,
  getPrivateState,
  proposeTeam,
  submitVote,
  completeVoteResolution,
  submitMissionCard,
  advanceFromMissionResult,
  submitFinalGuess,
  useLadyOfLake,
} = require('../game/gameLogic');

// In-memory store: roomCode -> Room
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom(hostSocketId, hostClientId, hostName, gameMode) {
  const code = generateRoomCode();
  const host = {
    id: hostSocketId,
    clientId: hostClientId,
    name: hostName,
    disconnected: false,
  };

  rooms.set(code, {
    code,
    hostId: hostSocketId,
    hostClientId,    // pinned so the host's seat survives reconnect
    gameMode: gameMode || 'avalon',
    optionalRoles: {},  // empty = use BASE_ROLE_SETS defaults for the final player count
    ladyOfLakeEnabled: false,
    players: [host],
    game: null,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),  // bumped on every state broadcast; drives cleanup
  });

  return { code, room: rooms.get(code) };
}

function joinRoom(code, socketId, clientId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };

  // RECONNECT — same clientId already in this room: refresh their socketId
  // instead of treating them as a brand-new joiner.
  if (clientId) {
    const existing = room.players.find(p => p.clientId === clientId);
    if (existing) {
      // Only flag this as an actual reconnect if state truly changed
      // (different socket OR they were previously marked disconnected).
      // Re-joining with the same already-attached socket should be a no-op.
      const wasActualReconnect = existing.id !== socketId || existing.disconnected;
      existing.id = socketId;
      existing.disconnected = false;
      if (existing.clientId === room.hostClientId) room.hostId = socketId;
      if (room.game) {
        const gp = room.game.players.find(p => p.clientId === clientId);
        if (gp) {
          gp.id = socketId;
          gp.disconnected = false;
        }
      }
      return { ok: true, room, reconnected: wasActualReconnect };
    }
  }

  if (room.game && room.game.phase !== GAME_PHASES.LOBBY) return { error: 'Game already started' };
  if (room.players.length >= 10) return { error: 'Room is full' };
  if (room.players.some(p => p.id === socketId)) return { error: 'Already in room' };

  room.players.push({ id: socketId, clientId, name: playerName, disconnected: false });
  return { ok: true, room };
}

// Called from the disconnect handler when a player drops mid-game. Doesn't
// remove them — just marks them disconnected so their seat is held until
// they reconnect (or the game ends).
function markDisconnected(socketId) {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.id === socketId);
    if (!player) continue;
    player.disconnected = true;
    if (room.game) {
      const gp = room.game.players.find(p => p.id === socketId);
      if (gp) gp.disconnected = true;
    }
    return room;
  }
  return null;
}

// Restore a clientId's seat when they reconnect via room:get_state (the
// invite-link flow). Mirrors joinRoom's reconnect path but doesn't need
// the user to type their name again.
//
// Returns:
//   null                              — no matching player for this clientId
//   { room, didReattach: false }      — already attached (no state changed,
//                                       no notification should fire)
//   { room, didReattach: true }       — actually reattached (socketId changed
//                                       or they were disconnected)
function reattachByClientId(code, socketId, clientId) {
  if (!clientId) return null;
  const room = rooms.get(code);
  if (!room) return null;
  const existing = room.players.find(p => p.clientId === clientId);
  if (!existing) return null;

  // No-op: same socket, not flagged disconnected. Don't broadcast — the user
  // is just re-querying state (e.g. StrictMode useEffect re-run).
  if (existing.id === socketId && !existing.disconnected) {
    return { room, didReattach: false };
  }

  existing.id = socketId;
  existing.disconnected = false;
  if (existing.clientId === room.hostClientId) room.hostId = socketId;
  if (room.game) {
    const gp = room.game.players.find(p => p.clientId === clientId);
    if (gp) {
      gp.id = socketId;
      gp.disconnected = false;
    }
  }
  return { room, didReattach: true };
}

// Move the host role to another player. Prefers a currently-connected player
// so the new host can actually act; falls back to the first remaining player.
// Updates BOTH hostId and hostClientId — the clientId is what reconnection
// matches on, so without updating it a promoted host would silently lose their
// powers (and nobody could start/advance) after their next refresh.
function reassignHost(room) {
  const next = room.players.find(p => !p.disconnected) || room.players[0];
  if (!next) return null;
  room.hostId = next.id;
  room.hostClientId = next.clientId;
  return next;
}

function leaveRoom(socketId) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.id === socketId);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(code);
      return { code, disbanded: true };
    }

    // Transfer host if needed
    if (room.hostId === socketId) {
      reassignHost(room);
    }

    return { code, room, disbanded: false };
  }
  return null;
}

// ─── Stale-room cleanup ──────────────────────────────────────────────────────
// Rooms live only in this in-memory Map, and nothing removed them once a game
// finished or was abandoned mid-play — so they'd accumulate until the process
// restarted (a slow memory leak). This reaps rooms that are safe to drop.
const ABANDONED_ROOM_MS = 15 * 60 * 1000;  // nobody connected for 15 min
const FINISHED_ROOM_MS  = 30 * 60 * 1000;  // game over + idle for 30 min

// Returns the codes of the rooms that were deleted, so the caller can clear any
// associated timers (e.g. AFK). Never deletes a room that still has a connected
// player and isn't finished — so a quiet lobby of waiting friends is safe.
function sweepStaleRooms(now = Date.now()) {
  const removed = [];
  for (const [code, room] of rooms.entries()) {
    const idleMs = now - (room.lastActivityAt || room.createdAt || now);
    const anyConnected = room.players.some(p => !p.disconnected);
    const isFinished = room.game && room.game.phase === GAME_PHASES.GAME_OVER;

    const abandoned = !anyConnected && idleMs > ABANDONED_ROOM_MS;
    const finishedAndIdle = isFinished && idleMs > FINISHED_ROOM_MS;

    if (abandoned || finishedAndIdle) {
      rooms.delete(code);
      removed.push(code);
    }
  }
  return removed;
}

function getRoomByCode(code) {
  return rooms.get(code) || null;
}

function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === socketId)) return room;
  }
  return null;
}

function updateRoomSettings(code, hostId, settings) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.hostId !== hostId) return { error: 'Not the host' };
  if (room.game) return { error: 'Game already started' };

  if (settings.gameMode) room.gameMode = settings.gameMode;
  if (settings.optionalRoles) room.optionalRoles = { ...room.optionalRoles, ...settings.optionalRoles };
  if (typeof settings.ladyOfLakeEnabled === 'boolean') room.ladyOfLakeEnabled = settings.ladyOfLakeEnabled;

  return { ok: true, room };
}

function startGame(code, hostId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.hostId !== hostId) return { error: 'Not the host' };
  if (room.players.length < 5) return { error: 'Need at least 5 players' };
  if (room.players.length > 10) return { error: 'Maximum 10 players' };
  if (room.game && room.game.phase !== GAME_PHASES.LOBBY) return { error: 'Game already started' };

  room.game = initGame(
    room.players,
    room.gameMode,
    room.optionalRoles,
    room.ladyOfLakeEnabled,
  );

  return { ok: true };
}

// ─── Game action proxies ─────────────────────────────────────────────────────

function roomProposeTeam(code, leaderId, proposedTeam) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  return proposeTeam(room.game, leaderId, proposedTeam);
}

function roomSubmitVote(code, playerId, approve) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  return submitVote(room.game, playerId, approve);
}

function roomCompleteVoteResolution(code) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  return completeVoteResolution(room.game);
}

function roomSubmitMissionCard(code, playerId, card) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  return submitMissionCard(room.game, playerId, card);
}

function roomAdvanceFromMissionResult(code, hostId) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  // Any player can advance (host confirmation)
  return advanceFromMissionResult(room.game);
}

function roomSubmitFinalGuess(code, assassinId, guessedPlayerId) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  return submitFinalGuess(room.game, assassinId, guessedPlayerId);
}

function roomUseLadyOfLake(code, holderId, targetId) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  return useLadyOfLake(room.game, holderId, targetId);
}

function roomAdvanceFromNight(code, hostId) {
  const room = rooms.get(code);
  if (!room?.game) return { error: 'No active game' };
  if (room.game.phase !== GAME_PHASES.NIGHT) return { error: 'Not in night phase' };
  if (room.hostId !== hostId) return { error: 'Not the host' };
  room.game.phase = GAME_PHASES.TEAM_PROPOSAL;
  return { ok: true };
}

function getPublicRoomState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  // Every state broadcast and every state query flows through here, so this is
  // the single reliable place to record "this room is still alive" for the
  // stale-room sweep (see sweepStaleRooms). An abandoned/finished game stops
  // producing broadcasts, so its timestamp stops advancing and it gets reaped.
  room.lastActivityAt = Date.now();
  return {
    code: room.code,
    hostId: room.hostId,
    gameMode: room.gameMode,
    optionalRoles: room.optionalRoles,
    ladyOfLakeEnabled: room.ladyOfLakeEnabled,
    // Strip clientId — that's an internal reconnect token, not for broadcast
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      disconnected: !!p.disconnected,
    })),
    gameState: room.game ? getPublicState(room.game) : null,
  };
}

function getPrivatePlayerState(code, playerId) {
  const room = rooms.get(code);
  if (!room?.game) return null;
  return getPrivateState(room.game, playerId);
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  reassignHost,
  sweepStaleRooms,
  markDisconnected,
  reattachByClientId,
  getRoomByCode,
  getRoomBySocketId,
  updateRoomSettings,
  startGame,
  roomProposeTeam,
  roomSubmitVote,
  roomCompleteVoteResolution,
  roomSubmitMissionCard,
  roomAdvanceFromMissionResult,
  roomSubmitFinalGuess,
  roomUseLadyOfLake,
  roomAdvanceFromNight,
  getPublicRoomState,
  getPrivatePlayerState,
};
