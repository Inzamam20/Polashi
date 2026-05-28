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
      room.hostId = room.players[0].id;
    }

    return { code, room, disbanded: false };
  }
  return null;
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
