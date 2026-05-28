const {
  ROLES,
  BASE_ROLE_SETS,
  MERLIN_SEES_TRAITORS,
  PERCIVAL_SEES_AS_MERLIN,
  TRAITORS_WHO_SEE_EACH_OTHER,
} = require('./constants');

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the role pool starting from BASE_ROLE_SETS (which already include the
 * official default special roles), then apply any host overrides.
 *
 * optionalRoles: { percival?, mordred?, morgana?, oberon? }
 *   true  → force-include (add if not already in base, replacing a generic slot)
 *   false → force-exclude (remove if present in base, replacing with a generic slot)
 *   key absent → use whatever is in BASE_ROLE_SETS for this player count
 */
function buildRolePool(playerCount, optionalRoles = {}) {
  const base = BASE_ROLE_SETS[playerCount];
  if (!base) throw new Error(`Unsupported player count: ${playerCount}`);

  const loyalPool   = [...base.loyal];
  const traitorPool = [...base.traitor];

  const applyOverride = (pool, roleId, include, genericPrefix) => {
    const inPool = pool.includes(roleId);
    if (include && !inPool) {
      // Force add: swap first available generic slot
      const idx = pool.findIndex(r => r.startsWith(genericPrefix));
      if (idx !== -1) pool[idx] = roleId;
    } else if (!include && inPool) {
      // Force remove: replace with a fresh generic id
      const idx = pool.indexOf(roleId);
      const usedNums = new Set(
        pool.filter(r => r.startsWith(genericPrefix)).map(r => parseInt(r.split('_')[1]))
      );
      const nextNum = [1, 2, 3, 4, 5].find(n => !usedNums.has(n)) ?? 1;
      pool[idx] = `${genericPrefix}${nextNum}`;
    }
  };

  if (optionalRoles.percival !== undefined) applyOverride(loyalPool,   'PERCIVAL', optionalRoles.percival, 'LOYAL_');
  if (optionalRoles.mordred  !== undefined) applyOverride(traitorPool, 'MORDRED',  optionalRoles.mordred,  'MINION_');
  if (optionalRoles.morgana  !== undefined) applyOverride(traitorPool, 'MORGANA',  optionalRoles.morgana,  'MINION_');
  if (optionalRoles.oberon   !== undefined) applyOverride(traitorPool, 'OBERON',   optionalRoles.oberon,   'MINION_');

  return shuffle([...loyalPool, ...traitorPool]);
}

/**
 * Assign roles to players and compute each player's private knowledge.
 * Returns an array of player objects with their role and what they know.
 */
function assignRoles(players, playerCount, optionalRoles) {
  const rolePool = buildRolePool(playerCount, optionalRoles);

  // Map playerId -> role
  const assignments = {};
  players.forEach((player, i) => {
    assignments[player.id] = rolePool[i];
  });

  // Build per-player private knowledge
  const playerRoles = players.map(player => {
    const roleId = assignments[player.id];
    const role = ROLES[roleId];
    const knowledge = buildKnowledge(player.id, roleId, assignments, players);

    return {
      id: player.id,
      clientId: player.clientId,   // preserve for reconnection lookup
      name: player.name,
      roleId,
      team: role.team,
      knowledge,
      disconnected: false,
    };
  });

  return playerRoles;
}

/**
 * Compute what a player knows during the night phase.
 * Returns arrays of player IDs they can identify.
 */
function buildKnowledge(playerId, roleId, assignments, players) {
  const knowledge = {
    knownTraitors: [],       // Players I know are traitors (by ID)
    knownAsMerlin: [],       // Players I see as "Merlin" (Percival only)
    fellowTraitors: [],      // Other traitors who know me (mutual knowledge)
  };

  const getRole = (pid) => assignments[pid];

  if (roleId === 'MERLIN') {
    // Merlin sees all traitors EXCEPT Mordred
    knowledge.knownTraitors = players
      .filter(p => p.id !== playerId && MERLIN_SEES_TRAITORS.includes(getRole(p.id)))
      .map(p => p.id);
  }

  if (roleId === 'PERCIVAL') {
    // Percival sees Merlin and Morgana (if present) — shuffled so order doesn't reveal
    const candidates = players.filter(p => PERCIVAL_SEES_AS_MERLIN.includes(getRole(p.id)));
    knowledge.knownAsMerlin = shuffle(candidates).map(p => p.id);
  }

  if (TRAITORS_WHO_SEE_EACH_OTHER.includes(roleId)) {
    // This traitor sees fellow traitors (excluding Oberon and self)
    knowledge.fellowTraitors = players
      .filter(p => p.id !== playerId && TRAITORS_WHO_SEE_EACH_OTHER.includes(getRole(p.id)))
      .map(p => p.id);
  }

  return knowledge;
}

/**
 * Shuffle an array of mission cards server-side before revealing.
 */
function shuffleMissionCards(cards) {
  return shuffle(cards);
}

module.exports = { assignRoles, shuffleMissionCards };
