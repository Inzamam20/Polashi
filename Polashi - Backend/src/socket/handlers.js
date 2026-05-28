const {
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
} = require('../rooms/roomManager');
const { GAME_PHASES } = require('../game/constants');
const { scheduleAfkCheck, clearAfkTimer } = require('./afkHandler');

// Delay (ms) between revealing the vote result and transitioning to the next
// phase. Gives players time to actually SEE the reveal.
const VOTE_REVEAL_DELAY_MS = 4500;

/**
 * Broadcast updated public room state to everyone in the room,
 * then send each player their private state.
 * Also (re)schedules the AFK timer based on the new state — if a
 * disconnected player is blocking the game, a 60s auto-action timer starts.
 */
function syncRoom(io, code) {
  const pub = getPublicRoomState(code);
  if (!pub) return;

  io.to(code).emit('room:state', pub);

  // Send private state to each connected player
  if (pub.gameState) {
    pub.players.forEach(player => {
      const priv = getPrivatePlayerState(code, player.id);
      if (priv) {
        io.to(player.id).emit('player:private', priv);
      }
    });
  }

  scheduleAfkCheck(io, code);
}

function registerHandlers(io, socket) {
  // Per-tab identity from the client. Allows the same human to reconnect
  // after a refresh / brief drop and resume their seat.
  const clientId = socket.handshake?.auth?.clientId || null;

  // ─── Room management ────────────────────────────────────────────────────

  socket.on('room:create', ({ playerName, gameMode }, cb) => {
    if (!playerName?.trim()) return cb?.({ error: 'Name required' });

    const { code } = createRoom(socket.id, clientId, playerName.trim(), gameMode);
    socket.join(code);
    syncRoom(io, code);
    cb?.({ ok: true, code });
  });

  socket.on('room:join', ({ code, playerName }, cb) => {
    if (!code || !playerName?.trim()) return cb?.({ error: 'Code and name required' });

    const upper = code.toUpperCase();
    const result = joinRoom(upper, socket.id, clientId, playerName.trim());
    if (result.error) return cb?.({ error: result.error });

    socket.join(upper);

    // Notify the room
    if (result.reconnected) {
      io.to(upper).emit('player:reconnected', { playerName: playerName.trim() });
    } else {
      io.to(upper).emit('player:joined', { playerName: playerName.trim() });
    }

    syncRoom(io, upper);
    cb?.({ ok: true, reconnected: !!result.reconnected });
  });

  socket.on('room:update_settings', ({ code, settings }, cb) => {
    const result = updateRoomSettings(code, socket.id, settings);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  socket.on('room:get_state', ({ code }, cb) => {
    const upper = code?.toUpperCase();
    if (!upper) return cb?.({ error: 'Room not found' });

    // RECONNECT: if this client's clientId matches an existing player in the
    // room (after refresh or drop), silently update their socketId to the new
    // socket. They get their seat back without the name prompt.
    const reattach = reattachByClientId(upper, socket.id, clientId);
    const didReattach = !!reattach?.didReattach;

    const pub = getPublicRoomState(upper);
    if (!pub) return cb?.({ error: 'Room not found' });

    cb?.({ ok: true, state: pub, reconnected: didReattach });
    socket.emit('room:state', pub);
    socket.join(upper);

    // Only broadcast "back online" + re-sync when an actual reattach happened.
    // A no-op re-query (same socketId, already connected) skips this so we
    // don't fire duplicate "reconnected" toasts to the room.
    if (didReattach) {
      const me = reattach.room.players.find(p => p.id === socket.id);
      if (me) io.to(upper).emit('player:reconnected', { playerName: me.name });
      syncRoom(io, upper);
    }

    // Send private state if they're a player in an active game
    const priv = getPrivatePlayerState(upper, socket.id);
    if (priv) socket.emit('player:private', priv);
  });

  // ─── Game lifecycle ──────────────────────────────────────────────────────

  socket.on('game:start', ({ code }, cb) => {
    const result = startGame(code, socket.id);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  socket.on('game:advance_night', ({ code }, cb) => {
    const result = roomAdvanceFromNight(code, socket.id);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  // Host relays night phase step to all players — steps are cosmetic/UX only
  socket.on('game:night_step', ({ code, step }) => {
    const room = getRoomByCode(code);
    if (!room || room.hostId !== socket.id) return;
    io.to(code).emit('night:step', { step });
  });

  socket.on('game:advance_mission_result', ({ code }, cb) => {
    const result = roomAdvanceFromMissionResult(code, socket.id);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  // Leader broadcasts their team selection in progress (no game-state change).
  // Lets other players see the team marker appear/disappear LIVE before the
  // leader confirms. Only the current leader may emit this.
  socket.on('game:team_preview', ({ code, proposedTeam }) => {
    const room = getRoomByCode(code);
    if (!room?.game) return;
    if (room.game.phase !== GAME_PHASES.TEAM_PROPOSAL) return;
    const leader = room.game.players[room.game.leaderIndex];
    if (!leader || leader.id !== socket.id) return;

    // Validate ids belong to the room — drop anything else
    const validIds = new Set(room.game.players.map(p => p.id));
    const filtered = (Array.isArray(proposedTeam) ? proposedTeam : [])
      .filter(id => validIds.has(id));
    io.to(code).emit('team:preview', { proposedTeam: filtered });
  });

  // ─── Gameplay ────────────────────────────────────────────────────────────

  socket.on('game:propose_team', ({ code, proposedTeam }, cb) => {
    const result = roomProposeTeam(code, socket.id, proposedTeam);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  socket.on('game:vote', ({ code, approve }, cb) => {
    const result = roomSubmitVote(code, socket.id, approve);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: result.ok });

    // When the last vote comes in, the proposal is marked `revealed: true`
    // but the phase stays VOTING so everyone sees the result. After a delay,
    // transition to MISSION (approved) or next TEAM_PROPOSAL (rejected).
    if (result.allVoted) {
      setTimeout(() => {
        const r = roomCompleteVoteResolution(code);
        if (!r.error) syncRoom(io, code);
      }, VOTE_REVEAL_DELAY_MS);
    }
  });

  socket.on('game:mission_card', ({ code, card }, cb) => {
    const result = roomSubmitMissionCard(code, socket.id, card);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  socket.on('game:final_guess', ({ code, guessedPlayerId }, cb) => {
    const result = roomSubmitFinalGuess(code, socket.id, guessedPlayerId);
    if (result.error) return cb?.({ error: result.error });
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  socket.on('game:lady_of_lake', ({ code, targetId }, cb) => {
    const result = roomUseLadyOfLake(code, socket.id, targetId);
    if (result.error) return cb?.({ error: result.error });

    // Send secret privately to the token holder only
    if (result.ok) {
      socket.emit('lady_of_lake:result', { targetId, targetTeam: result.targetTeam });
    }
    syncRoom(io, code);
    cb?.({ ok: true });
  });

  // ─── Disconnect ──────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const departingPlayer = room.players.find(p => p.id === socket.id);
    const playerName = departingPlayer?.name;

    const inLobby = !room.game || room.game.phase === GAME_PHASES.LOBBY;
    if (inLobby) {
      // Lobby: actually remove them from the room
      const result = leaveRoom(socket.id);
      if (result && !result.disbanded) {
        if (playerName) io.to(result.code).emit('player:left', { playerName });
        syncRoom(io, result.code);
      } else if (result?.disbanded) {
        clearAfkTimer(result.code);
      }
      return;
    }

    // Game in progress: hold their seat. They can reconnect via their stored
    // clientId (refresh or rejoining the room link). Other players see them
    // as "(disconnected)" until they come back.
    const updated = markDisconnected(socket.id);
    if (updated) {
      if (playerName) io.to(updated.code).emit('player:disconnected', { playerName });
      syncRoom(io, updated.code);  // also schedules AFK timer if they're blocking
    }
  });
}

module.exports = { registerHandlers };
