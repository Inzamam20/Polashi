// ── AFK auto-action handler ──────────────────────────────────────────────────
// When a player is disconnected AND the game is waiting on their action,
// schedule a 60s timer. If they don't reconnect in time, take a random
// (rule-respecting) action on their behalf and notify the room.
//
// Rules from the user:
//   • Voting       : 50/50 approve/reject
//   • Mission card : loyal → success ; traitor → 50/50 fail/success
//   • Team proposal: uniformly random team (equal probability per player)
//   • Lady of Lake : random eligible target
//   • Final guess  : random non-known-traitor

const { GAME_PHASES, MISSION_SIZES } = require('../game/constants');
const { getRoomByCode, getPublicRoomState, getPrivatePlayerState } = require('../rooms/roomManager');
const {
  submitVote,
  completeVoteResolution,
  submitMissionCard,
  proposeTeam,
  submitFinalGuess,
  useLadyOfLake,
} = require('../game/gameLogic');

const AFK_TIMEOUT_MS = 60 * 1000;
const VOTE_REVEAL_DELAY_MS = 4500;  // must match handlers.js

// One pending AFK timer per room
const afkTimers = new Map(); // code -> { handle, deadline, blockedNames }

// ── Local syncRoom helper (avoids circular import with handlers.js) ────────
function syncRoom(io, code) {
  const pub = getPublicRoomState(code);
  if (!pub) return;
  io.to(code).emit('room:state', pub);
  if (pub.gameState) {
    pub.players.forEach(player => {
      const priv = getPrivatePlayerState(code, player.id);
      if (priv) io.to(player.id).emit('player:private', priv);
    });
  }
}

// ── Phase → "who's blocking the game right now?" ───────────────────────────
function waitingPlayerIds(game) {
  switch (game.phase) {
    case GAME_PHASES.VOTING:
      if (!game.currentProposal || game.currentProposal.revealed) return [];
      return game.players
        .filter(p => game.currentProposal.votes[p.id] === undefined)
        .map(p => p.id);
    case GAME_PHASES.MISSION:
      if (!game.currentMission) return [];
      return game.currentMission.team.filter(id =>
        game.currentMission.cards[id] === undefined
      );
    case GAME_PHASES.TEAM_PROPOSAL:
      return [game.players[game.leaderIndex]?.id].filter(Boolean);
    case GAME_PHASES.LADY_OF_LAKE:
      return game.ladyOfLakeHolder ? [game.ladyOfLakeHolder] : [];
    case GAME_PHASES.FINAL_GUESS: {
      const assassin = game.players.find(p => p.roleId === 'ASSASSIN');
      return assassin ? [assassin.id] : [];
    }
    default:
      return [];
  }
}

function clearAfkTimer(code) {
  const t = afkTimers.get(code);
  if (t) {
    clearTimeout(t.handle);
    afkTimers.delete(code);
  }
}

// Call after EVERY syncRoom that might change the "waiting on" set.
function scheduleAfkCheck(io, code) {
  clearAfkTimer(code);
  const room = getRoomByCode(code);
  if (!room?.game || room.game.winner) return;

  const game = room.game;
  const waiting = waitingPlayerIds(game);
  const blockers = waiting
    .map(id => game.players.find(p => p.id === id))
    .filter(p => p?.disconnected);

  if (blockers.length === 0) return;

  const deadline = Date.now() + AFK_TIMEOUT_MS;
  const blockedNames = blockers.map(p => p.name);
  const handle = setTimeout(() => {
    afkTimers.delete(code);
    autoActAfkPlayers(io, code);
  }, AFK_TIMEOUT_MS);
  afkTimers.set(code, { handle, deadline, blockedNames });

  // Tell the room that an AFK countdown is running
  io.to(code).emit('afk:timer_started', {
    blockedNames,
    deadline,
    phase: game.phase,
  });
}

function autoActAfkPlayers(io, code) {
  const room = getRoomByCode(code);
  if (!room?.game || room.game.winner) return;
  const game = room.game;

  const waiting = waitingPlayerIds(game);
  const targets = waiting
    .map(id => game.players.find(p => p.id === id))
    .filter(p => p?.disconnected);

  if (targets.length === 0) {
    syncRoom(io, code);
    scheduleAfkCheck(io, code);
    return;
  }

  let voteResolutionPending = false;

  for (const player of targets) {
    const playerId = player.id;
    let actionLabel = '';

    switch (game.phase) {
      case GAME_PHASES.VOTING: {
        const approve = Math.random() < 0.5;
        const result = submitVote(game, playerId, approve);
        actionLabel = approve ? 'voted 👍 approve' : 'voted 👎 reject';
        if (result?.allVoted) voteResolutionPending = true;
        break;
      }
      case GAME_PHASES.MISSION: {
        // Loyal MUST play success; traitor 50/50 fail/success
        const card = player.team === 'loyal'
          ? 'success'
          : (Math.random() < 0.5 ? 'fail' : 'success');
        submitMissionCard(game, playerId, card);
        actionLabel = 'played their mission card';
        break;
      }
      case GAME_PHASES.TEAM_PROPOSAL: {
        const size = MISSION_SIZES[game.playerCount][game.currentMissionIndex];
        // Uniformly random team — every player equally likely to be picked
        const shuffled = [...game.players];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const team = shuffled.slice(0, size).map(p => p.id);
        proposeTeam(game, playerId, team);
        actionLabel = 'proposed a random team';
        break;
      }
      case GAME_PHASES.LADY_OF_LAKE: {
        const candidates = game.players.filter(p =>
          p.id !== playerId && !game.ladyOfLakeUsedBy.includes(p.id)
        );
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          useLadyOfLake(game, playerId, target.id);
          actionLabel = `investigated ${target.name}`;
        }
        break;
      }
      case GAME_PHASES.FINAL_GUESS: {
        // Random pick from non-known-traitors (excluding assassin themself)
        const knownTraitorIds = new Set(
          game.players.filter(p => p.team === 'traitor').map(p => p.id)
        );
        const candidates = game.players.filter(p =>
          !knownTraitorIds.has(p.id) && p.id !== playerId
        );
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          submitFinalGuess(game, playerId, target.id);
          actionLabel = `guessed ${target.name}`;
        }
        break;
      }
    }

    if (actionLabel) {
      io.to(code).emit('afk:auto_action', {
        playerName: player.name,
        action: actionLabel,
        phase: game.phase,
      });
    }
  }

  syncRoom(io, code);

  // VOTING reveals after a delay (matches the human-flow in handlers.js)
  if (voteResolutionPending) {
    setTimeout(() => {
      const r = completeVoteResolution(game);
      if (!r.error) syncRoom(io, code);
      scheduleAfkCheck(io, code);
    }, VOTE_REVEAL_DELAY_MS);
  } else {
    // Check if more players are still blocking after this round of auto-acts
    scheduleAfkCheck(io, code);
  }
}

module.exports = {
  scheduleAfkCheck,
  clearAfkTimer,
  AFK_TIMEOUT_MS,
};
