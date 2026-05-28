const {
  MISSION_SIZES,
  DOUBLE_FAIL_REQUIRED_MISSION_INDEX,
  DOUBLE_FAIL_MIN_PLAYERS,
  MAX_CONSECUTIVE_REJECTIONS,
  GAME_PHASES,
  TEAM_COUNTS,
} = require('./constants');
const { assignRoles, shuffleMissionCards } = require('./roleAssignment');

function getMissionSize(playerCount, missionIndex) {
  return MISSION_SIZES[playerCount][missionIndex];
}

function requiresDoubleFailToSabotage(playerCount, missionIndex) {
  return (
    playerCount >= DOUBLE_FAIL_MIN_PLAYERS &&
    missionIndex === DOUBLE_FAIL_REQUIRED_MISSION_INDEX
  );
}

function isMissionSabotaged(failCards, playerCount, missionIndex) {
  const threshold = requiresDoubleFailToSabotage(playerCount, missionIndex) ? 2 : 1;
  return failCards >= threshold;
}

/**
 * Initialize a fresh game state from a lobby.
 * players: [{ id, name }]
 */
function initGame(players, gameMode, optionalRoles, ladyOfLakeEnabled) {
  const playerCount = players.length;
  if (playerCount < 5 || playerCount > 10) {
    throw new Error('Player count must be between 5 and 10');
  }

  const playerRoles = assignRoles(players, playerCount, optionalRoles);

  // Lady of the Lake token starts with the player to the right of the first leader
  // Leader is index 0; right means index (playerCount - 1) in clockwise rotation
  const ladyOfLakeHolder = ladyOfLakeEnabled ? players[playerCount - 1].id : null;
  const ladyOfLakeUsedBy = [];

  return {
    phase: GAME_PHASES.NIGHT,
    playerCount,
    gameMode,
    optionalRoles,
    ladyOfLakeEnabled,
    ladyOfLakeHolder,
    ladyOfLakeUsedBy,

    players: playerRoles,  // [{ id, name, roleId, team, knowledge }]

    currentMissionIndex: 0,  // 0–4
    missions: [],             // completed mission results
    consecutiveRejections: 0,
    leaderIndex: 0,           // index into players array

    currentProposal: null,    // { proposedTeam: [ids], votes: {id: bool}, leaderIndex }
    currentMission: null,     // { team: [ids], cards: {id: 'success'|'fail'} }

    loyalWins: 0,
    traitorWins: 0,

    finalGuess: null,         // playerId guessed as Merlin
    winner: null,             // 'loyal' | 'traitor'
    winReason: null,
  };
}

/**
 * Build the public game state safe to broadcast to all players.
 * Strips all private role/knowledge data.
 */
function getPublicState(game) {
  return {
    phase: game.phase,
    playerCount: game.playerCount,
    gameMode: game.gameMode,
    optionalRoles: game.optionalRoles,
    ladyOfLakeEnabled: game.ladyOfLakeEnabled,
    ladyOfLakeHolder: game.ladyOfLakeHolder,
    ladyOfLakeUsedBy: game.ladyOfLakeUsedBy,

    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      disconnected: p.disconnected || false,
    })),

    currentMissionIndex: game.currentMissionIndex,
    missions: game.missions,
    consecutiveRejections: game.consecutiveRejections,
    leaderIndex: game.leaderIndex,
    leaderId: game.players[game.leaderIndex]?.id,

    currentProposal: game.currentProposal
      ? {
          proposedTeam: game.currentProposal.proposedTeam,
          // Only send vote count after everyone has voted, not individual votes
          votes: game.currentProposal.revealed ? game.currentProposal.votes : null,
          votedPlayerIds: Object.keys(game.currentProposal.votes || {}),
          leaderIndex: game.currentProposal.leaderIndex,
        }
      : null,

    currentMission: game.currentMission
      ? {
          team: game.currentMission.team,
          submittedCount: Object.keys(game.currentMission.cards || {}).length,
          // Per-player submission status — lets UI show who's still pending
          // (Card VALUES stay hidden until the reveal step; only IDs leaked.)
          submittedPlayerIds: Object.keys(game.currentMission.cards || {}),
        }
      : null,

    loyalWins: game.loyalWins,
    traitorWins: game.traitorWins,

    finalGuess: game.finalGuess,
    winner: game.winner,
    winReason: game.winReason,

    // Role reveals only on game over
    roleReveal: game.phase === GAME_PHASES.GAME_OVER
      ? game.players.map(p => ({ id: p.id, name: p.name, roleId: p.roleId, team: p.team }))
      : null,
  };
}

/**
 * Build the private state for a specific player.
 */
function getPrivateState(game, playerId) {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return null;

  const isOnProposedTeam = game.currentProposal?.proposedTeam?.includes(playerId) ?? false;
  const isOnMissionTeam = game.currentMission?.team?.includes(playerId) ?? false;
  const myMissionCardSubmitted = game.currentMission?.cards?.[playerId] != null;

  // Build fellow traitor names for display
  const fellowTraitorDetails = (player.knowledge.fellowTraitors || []).map(id => {
    const p = game.players.find(x => x.id === id);
    return { id, name: p?.name };
  });

  const knownTraitorDetails = (player.knowledge.knownTraitors || []).map(id => {
    const p = game.players.find(x => x.id === id);
    return { id, name: p?.name };
  });

  const knownAsMerlinDetails = (player.knowledge.knownAsMerlin || []).map(id => {
    const p = game.players.find(x => x.id === id);
    return { id, name: p?.name };
  });

  // Traitors can see each other's IDs during final guess phase
  const isTraitor = player.team === 'traitor';
  const fellowTraitorsForFinalGuess = (game.phase === GAME_PHASES.FINAL_GUESS && isTraitor)
    ? game.players
        .filter(p => p.team === 'traitor')
        .map(p => ({ id: p.id, name: p.name, roleId: p.roleId }))
    : null;

  return {
    playerId,
    roleId: player.roleId,
    team: player.team,
    knowledge: {
      knownTraitors: knownTraitorDetails,
      knownAsMerlin: knownAsMerlinDetails,
      fellowTraitors: fellowTraitorDetails,
    },
    isOnProposedTeam,
    isOnMissionTeam,
    myMissionCardSubmitted,
    fellowTraitorsForFinalGuess,
    myVote: game.currentProposal?.votes?.[playerId] ?? null,
  };
}

// ─── Game action handlers ────────────────────────────────────────────────────

function proposeTeam(game, leaderId, proposedTeam) {
  if (game.phase !== GAME_PHASES.TEAM_PROPOSAL) return { error: 'Wrong phase' };
  if (game.players[game.leaderIndex].id !== leaderId) return { error: 'Not the leader' };

  const requiredSize = getMissionSize(game.playerCount, game.currentMissionIndex);
  if (proposedTeam.length !== requiredSize) {
    return { error: `Team must have exactly ${requiredSize} players` };
  }
  const validIds = new Set(game.players.map(p => p.id));
  if (!proposedTeam.every(id => validIds.has(id))) return { error: 'Invalid player IDs' };

  game.currentProposal = {
    proposedTeam,
    votes: {},
    revealed: false,
    leaderIndex: game.leaderIndex,
  };
  game.phase = GAME_PHASES.VOTING;
  return { ok: true };
}

function submitVote(game, playerId, approve) {
  if (game.phase !== GAME_PHASES.VOTING) return { error: 'Wrong phase' };
  if (game.currentProposal.votes[playerId] !== undefined) return { error: 'Already voted' };

  game.currentProposal.votes[playerId] = approve;

  // When everyone has voted: REVEAL the result but DON'T transition phase yet.
  // The socket handler will schedule completeVoteResolution() after a delay so
  // players actually see the reveal before the next phase replaces the screen.
  if (Object.keys(game.currentProposal.votes).length === game.playerCount) {
    game.currentProposal.revealed = true;
    return { ok: true, allVoted: true };
  }
  return { ok: true, waiting: true };
}

/**
 * Second half of vote resolution — apply the actual phase transition.
 * Must be called after submitVote returns { allVoted: true }, ideally after
 * a UI delay so clients can see the reveal.
 */
function completeVoteResolution(game) {
  if (!game.currentProposal?.revealed) return { error: 'Vote not revealed' };
  if (game.phase !== GAME_PHASES.VOTING) return { error: 'Already transitioned' };

  const votes = game.currentProposal.votes;
  const approveCount = Object.values(votes).filter(Boolean).length;
  const rejectCount = game.playerCount - approveCount;

  if (approveCount > rejectCount) {
    // Proceed to mission
    game.currentMission = { team: game.currentProposal.proposedTeam, cards: {} };
    game.consecutiveRejections = 0;
    game.phase = GAME_PHASES.MISSION;
    return { ok: true, approved: true, approveCount, rejectCount };
  } else {
    // Rejected
    game.consecutiveRejections += 1;

    if (game.consecutiveRejections >= MAX_CONSECUTIVE_REJECTIONS) {
      // 5 consecutive rejections — traitors win this mission
      return recordMissionResult(game, false, 0, game.playerCount, true);
    }

    // Advance leader, return to proposal
    game.leaderIndex = (game.leaderIndex + 1) % game.playerCount;
    game.currentProposal = null;
    game.phase = GAME_PHASES.TEAM_PROPOSAL;
    return { ok: true, approved: false, approveCount, rejectCount };
  }
}

function submitMissionCard(game, playerId, card) {
  if (game.phase !== GAME_PHASES.MISSION) return { error: 'Wrong phase' };
  if (!game.currentMission.team.includes(playerId)) return { error: 'Not on mission team' };
  if (game.currentMission.cards[playerId] !== undefined) return { error: 'Already submitted' };

  // Enforce: loyal players MUST play success
  const player = game.players.find(p => p.id === playerId);
  if (player.team === 'loyal' && card === 'fail') return { error: 'Loyal players must play success' };

  game.currentMission.cards[playerId] = card;

  const teamSize = game.currentMission.team.length;
  if (Object.keys(game.currentMission.cards).length === teamSize) {
    return resolveMission(game);
  }
  return { ok: true, waiting: true };
}

function resolveMission(game) {
  const cards = Object.values(game.currentMission.cards);
  const shuffledCards = shuffleMissionCards(cards);
  const failCount = shuffledCards.filter(c => c === 'fail').length;
  const sabotaged = isMissionSabotaged(failCount, game.playerCount, game.currentMissionIndex);

  return recordMissionResult(game, !sabotaged, failCount, cards.length, false);
}

function recordMissionResult(game, loyalWon, failCount, cardCount, autoRejected) {
  // Capture the chapter "story" from current state before it's cleared.
  // - For approved missions: leader who proposed the approved team, the team
  //   that played, and the approve/reject tally that approved them.
  // - For auto-rejected missions: the LAST (5th rejected) leader + team for
  //   reference.
  const proposal = game.currentProposal;
  const leader = proposal ? game.players[proposal.leaderIndex] : null;
  const teamIds = autoRejected
    ? (proposal?.proposedTeam || [])
    : (game.currentMission?.team || []);
  const teamNames = teamIds
    .map(id => game.players.find(p => p.id === id)?.name)
    .filter(Boolean);
  const approveCount = proposal
    ? Object.values(proposal.votes).filter(Boolean).length
    : 0;
  const rejectCount = proposal ? game.playerCount - approveCount : 0;

  const result = {
    missionIndex: game.currentMissionIndex,
    loyalWon,
    failCount,
    cardCount,
    autoRejected,
    // Chapter detail — exposed via public state for the chapter-history modal
    leaderId:    leader?.id    || null,
    leaderName:  leader?.name  || null,
    teamIds,
    teamNames,
    approveCount,
    rejectCount,
  };
  game.missions.push(result);

  if (loyalWon) game.loyalWins += 1;
  else game.traitorWins += 1;

  game.currentMission = null;
  game.currentProposal = null;
  game.consecutiveRejections = 0;
  game.currentMissionIndex += 1;
  game.phase = GAME_PHASES.MISSION_RESULT;

  // Check win conditions
  if (game.traitorWins >= 3) {
    game.winner = 'traitor';
    game.winReason = autoRejected ? 'five_rejections' : 'three_missions';
    game.phase = GAME_PHASES.GAME_OVER;
  } else if (game.loyalWins >= 3) {
    // Loyal won 3 missions — enter final guess phase
    game.phase = GAME_PHASES.FINAL_GUESS;
  }

  return { ok: true, result };
}

function advanceFromMissionResult(game) {
  if (game.phase !== GAME_PHASES.MISSION_RESULT) return { error: 'Wrong phase' };
  if (game.winner) return { error: 'Game already over' };

  // Check if Lady of the Lake should activate (after mission 2, i.e. after index 1)
  // currentMissionIndex was already incremented in recordMissionResult
  const justCompletedIndex = game.currentMissionIndex - 1;
  if (
    game.ladyOfLakeEnabled &&
    justCompletedIndex >= 1 &&
    game.ladyOfLakeHolder
  ) {
    game.phase = GAME_PHASES.LADY_OF_LAKE;
    return { ok: true, phase: 'LADY_OF_LAKE' };
  }

  game.leaderIndex = (game.leaderIndex + 1) % game.playerCount;
  game.phase = GAME_PHASES.TEAM_PROPOSAL;
  return { ok: true };
}

function submitFinalGuess(game, assassinId, guessedPlayerId) {
  if (game.phase !== GAME_PHASES.FINAL_GUESS) return { error: 'Wrong phase' };

  const assassin = game.players.find(p => p.id === assassinId);
  if (!assassin || assassin.roleId !== 'ASSASSIN') return { error: 'Only the Assassin can guess' };

  const merlin = game.players.find(p => p.roleId === 'MERLIN');
  const correct = merlin?.id === guessedPlayerId;

  game.finalGuess = guessedPlayerId;

  if (correct) {
    game.winner = 'traitor';
    game.winReason = 'assassination';
  } else {
    game.winner = 'loyal';
    game.winReason = 'merlin_survived';
  }

  game.phase = GAME_PHASES.GAME_OVER;
  return { ok: true, correct };
}

function useLadyOfLake(game, holderId, targetId) {
  if (game.phase !== GAME_PHASES.LADY_OF_LAKE) return { error: 'Wrong phase' };
  if (game.ladyOfLakeHolder !== holderId) return { error: 'You do not hold the token' };
  if (game.ladyOfLakeUsedBy.includes(targetId)) return { error: 'That player already held the token' };
  if (holderId === targetId) return { error: 'Cannot investigate yourself' };

  const target = game.players.find(p => p.id === targetId);
  if (!target) return { error: 'Invalid player' };

  // Pass token
  game.ladyOfLakeUsedBy.push(holderId);
  game.ladyOfLakeHolder = targetId;

  // Advance to next proposal
  game.leaderIndex = (game.leaderIndex + 1) % game.playerCount;
  game.phase = GAME_PHASES.TEAM_PROPOSAL;

  // Return the secret — only sent privately to the holder
  return { ok: true, targetTeam: target.team };
}

module.exports = {
  initGame,
  getPublicState,
  getPrivateState,
  getMissionSize,
  proposeTeam,
  submitVote,
  completeVoteResolution,
  submitMissionCard,
  advanceFromMissionResult,
  submitFinalGuess,
  useLadyOfLake,
};
