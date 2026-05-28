// ── Client-side game rule constants ──────────────────────────────────────────
// Single source of truth for rule numbers used by the UI. These MIRROR the
// backend's authoritative values in `Polashi - Backend/src/game/constants.js`.
//
// Drift risk is known — flagged in CLAUDE.md. If you change role composition
// rules, update BOTH this file and the backend constants.

// Game phases — must match the GAME_PHASES enum in the backend constants.
// Use these instead of bare strings so typos surface as runtime errors at
// the symbol level, not silently wrong comparisons.
export const PHASES = {
  LOBBY:           'LOBBY',
  NIGHT:           'NIGHT',
  TEAM_PROPOSAL:   'TEAM_PROPOSAL',
  VOTING:          'VOTING',
  MISSION:         'MISSION',
  MISSION_RESULT:  'MISSION_RESULT',
  LADY_OF_LAKE:    'LADY_OF_LAKE',
  FINAL_GUESS:     'FINAL_GUESS',
  GAME_OVER:       'GAME_OVER',
}

// Mission team size by player count: [M1, M2, M3, M4, M5]
export const MISSION_SIZES = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}

// Mission 4 (index 3) with 7+ players requires 2 fail cards to sabotage
export const DOUBLE_FAIL_MISSION_INDEX = 3
export const DOUBLE_FAIL_MIN_PLAYERS = 7

// Official Avalon role table — what's included by default for each count.
// `optionalRoles` overrides flip individual specials on/off.
export const BASE_ROLES_BY_COUNT = {
  5:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR'],                                              traitor: ['ASSASSIN', 'MINION_1'] },
  6:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1'],                                   traitor: ['ASSASSIN', 'MORGANA'] },
  7:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1'],                                   traitor: ['ASSASSIN', 'MORGANA', 'OBERON'] },
  8:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1', 'LOYAL_2'],                        traitor: ['ASSASSIN', 'MORGANA', 'MORDRED'] },
  9:  { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1', 'LOYAL_2', 'LOYAL_3'],             traitor: ['ASSASSIN', 'MORGANA', 'MORDRED'] },
  10: { loyal: ['MERLIN', 'PERCIVAL', 'ARTHUR', 'LOYAL_1', 'LOYAL_2', 'LOYAL_3'],             traitor: ['ASSASSIN', 'MORGANA', 'MORDRED', 'OBERON'] },
}

// Max number of optional traitor specials (Morgana/Mordred/Oberon) that fit
// for a player count. Equals: total traitors − 1 (Assassin always occupies one
// slot). Used by the lobby's slot-aware toggle.
export const MAX_TRAITOR_SPECIALS = { 5: 1, 6: 1, 7: 2, 8: 2, 9: 2, 10: 3 }

// Role groupings for night-phase visibility logic
export const TRAITORS_NON_OBERON = [
  'ASSASSIN', 'MORDRED', 'MORGANA', 'MINION_1', 'MINION_2', 'MINION_3',
]
export const MINIONS_NON_MORDRED = [
  'ASSASSIN', 'MORGANA', 'OBERON', 'MINION_1', 'MINION_2', 'MINION_3',
]
export const MERLIN_OR_MORGANA = ['MERLIN', 'MORGANA']

// ── Night phase step → role state mapping ────────────────────────────────────
// One source of truth used by BOTH the table visualization (eye/thumb badges)
// and the phase-level UI hints (drift text under the table).
//
// Step numbers match the STEPS array in NightPhase.jsx (0–9).

export function viewerEyesOpenAt(step, role) {
  if (step === 2 && TRAITORS_NON_OBERON.includes(role)) return true
  if (step === 5 && role === 'MERLIN') return true
  if (step === 8 && role === 'PERCIVAL') return true
  return false
}

export function viewerThumbUpAt(step, role) {
  if (step === 2 && TRAITORS_NON_OBERON.includes(role)) return true
  if ((step === 4 || step === 5) && MINIONS_NON_MORDRED.includes(role)) return true
  if ((step === 7 || step === 8) && MERLIN_OR_MORGANA.includes(role)) return true
  return false
}
