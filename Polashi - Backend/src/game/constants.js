// Team composition by player count
const TEAM_COUNTS = {
  5:  { loyal: 3, traitor: 2 },
  6:  { loyal: 4, traitor: 2 },
  7:  { loyal: 4, traitor: 3 },
  8:  { loyal: 5, traitor: 3 },
  9:  { loyal: 6, traitor: 3 },
  10: { loyal: 6, traitor: 4 },
};

// Mission team sizes by player count [M1, M2, M3, M4, M5]
const MISSION_SIZES = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

// Mission 4 (index 3) with 7+ players requires 2 fail cards to sabotage
const DOUBLE_FAIL_REQUIRED_MISSION_INDEX = 3;
const DOUBLE_FAIL_MIN_PLAYERS = 7;

const MAX_CONSECUTIVE_REJECTIONS = 5;

const ROLES = {
  // Loyal side
  ARTHUR:         { id: 'ARTHUR',         team: 'loyal',   hasPower: false },
  MERLIN:         { id: 'MERLIN',         team: 'loyal',   hasPower: true  },
  PERCIVAL:       { id: 'PERCIVAL',       team: 'loyal',   hasPower: true  },
  LOYAL_1:        { id: 'LOYAL_1',        team: 'loyal',   hasPower: false },
  LOYAL_2:        { id: 'LOYAL_2',        team: 'loyal',   hasPower: false },
  LOYAL_3:        { id: 'LOYAL_3',        team: 'loyal',   hasPower: false },
  LOYAL_4:        { id: 'LOYAL_4',        team: 'loyal',   hasPower: false },
  // Traitor side
  ASSASSIN:       { id: 'ASSASSIN',       team: 'traitor', hasPower: true  },
  MORDRED:        { id: 'MORDRED',        team: 'traitor', hasPower: true  },
  MORGANA:        { id: 'MORGANA',        team: 'traitor', hasPower: true  },
  OBERON:         { id: 'OBERON',         team: 'traitor', hasPower: true  },
  MINION_1:       { id: 'MINION_1',       team: 'traitor', hasPower: false },
  MINION_2:       { id: 'MINION_2',       team: 'traitor', hasPower: false },
  MINION_3:       { id: 'MINION_3',       team: 'traitor', hasPower: false },
};

// Which traitors are visible to Merlin (Mordred is hidden)
const MERLIN_SEES_TRAITORS = ['ASSASSIN', 'MORGANA', 'OBERON', 'MINION_1', 'MINION_2', 'MINION_3'];
// Which roles Percival sees as "Merlin" (Morgana is a decoy)
const PERCIVAL_SEES_AS_MERLIN = ['MERLIN', 'MORGANA'];
// Roles that open eyes with other traitors in night phase (Oberon keeps eyes closed)
const TRAITORS_WHO_SEE_EACH_OTHER = ['ASSASSIN', 'MORDRED', 'MORGANA', 'MINION_1', 'MINION_2', 'MINION_3'];

// Official default role sets per player count.
// buildRolePool() applies host overrides on top of these defaults.
const BASE_ROLE_SETS = {
  5:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR'],                                              traitor: ['ASSASSIN', 'MINION_1'] },
  6:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1'],                                   traitor: ['ASSASSIN', 'MORGANA'] },
  7:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1'],                                   traitor: ['ASSASSIN', 'MORGANA', 'OBERON'] },
  8:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1', 'LOYAL_2'],                        traitor: ['ASSASSIN', 'MORGANA', 'MORDRED'] },
  9:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1', 'LOYAL_2', 'LOYAL_3'],             traitor: ['ASSASSIN', 'MORGANA', 'MORDRED'] },
  10: { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1', 'LOYAL_2', 'LOYAL_3'],             traitor: ['ASSASSIN', 'MORGANA', 'MORDRED', 'OBERON'] },
};

const GAME_PHASES = {
  LOBBY:           'LOBBY',
  NIGHT:           'NIGHT',
  TEAM_PROPOSAL:   'TEAM_PROPOSAL',
  VOTING:          'VOTING',
  MISSION:         'MISSION',
  MISSION_RESULT:  'MISSION_RESULT',
  FINAL_GUESS:     'FINAL_GUESS',
  GAME_OVER:       'GAME_OVER',
  LADY_OF_LAKE:    'LADY_OF_LAKE',
};

module.exports = {
  TEAM_COUNTS,
  MISSION_SIZES,
  DOUBLE_FAIL_REQUIRED_MISSION_INDEX,
  DOUBLE_FAIL_MIN_PLAYERS,
  MAX_CONSECUTIVE_REJECTIONS,
  ROLES,
  MERLIN_SEES_TRAITORS,
  PERCIVAL_SEES_AS_MERLIN,
  TRAITORS_WHO_SEE_EACH_OTHER,
  BASE_ROLE_SETS,
  GAME_PHASES,
};
