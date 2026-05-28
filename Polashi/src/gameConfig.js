// ── Game configuration toggles ───────────────────────────────────────────────
// Central place for feature flags and house-rule toggles. Flip a value here to
// change behavior across the whole app.
//
// Note: this file is .js (not .jsx) because it only exports constants — no JSX.

/**
 * Controls whether INDIVIDUAL player votes are revealed after the voting phase.
 *
 *   true  → each player's seat shows their own vote (👍 green / 👎 red).
 *           Everyone sees who voted approve and who voted reject.
 *   false → only the aggregate tally is revealed (e.g. "👍 4 · 👎 3").
 *           Individual votes stay secret — encourages more deception, less
 *           public accountability.
 *
 * Default: false. The official Avalon rulebook publishes individual votes, but
 * this game starts with secret votes for a more cagey early-round experience.
 */
export const REVEAL_INDIVIDUAL_VOTES = false
