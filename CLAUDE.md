# CLAUDE.md — Polashi / Avalon Game Project

> This file is the single source of truth for all project context.
> Read this at the start of every session before doing anything.

---

## What This Project Is

A **real-time multiplayer social deduction web game** that is a dual-theme implementation of The Resistance: Avalon.

| Theme   | Name       | Setting                   |
| ------- | ---------- | ------------------------- |
| Bengali | Polashi 🇧🇩 | Battle of Plassey, 1757   |
| English | Avalon ⚔️  | Arthurian Legend, Camelot |

Both modes are **mechanically 100% identical**. Only character names, language, and visual theme differ. Players switch between modes at room creation.

Players join via a shared link/room code — **no accounts, no login, no app install**. Designed to be played over Discord voice chat with friends.

---

## Project Status

**Phase: MVP + extensive UX/realism polish. Fully playable end-to-end. Ready for deployment.**

- [x] Game rules documented and understood
- [x] Tech stack decisions confirmed
- [x] Frontend scaffolded (React + Vite in `Polashi/`)
- [x] Backend scaffolded (Node.js + Express + Socket.io in `Polashi - Backend/`)
- [x] Room / lobby system (6-char code, host settings, player list)
- [x] Night phase (step-by-step, role-gated reveals, host advances)
- [x] Mission gameplay loop (team proposal → voting → mission cards → result)
- [x] End game / final guess phase (Assassin guesses Merlin)
- [x] Lady of the Lake mechanic (Avalon mode, toggleable)
- [x] Both themes working (Avalon steel/blue, Polashi warm earthy + Bengali names)
- [x] README.md with step-by-step deployment instructions
- [x] **Official Avalon role composition wired as defaults per player count**
- [x] **Lobby UX cleaned up — auto-swap enforces traitor slot rules**

---

## Session History — Role Composition + Lobby UX

### 1. Official defaults wired in (`constants.js` + `Lobby.jsx`)

`BASE_ROLE_SETS` and `BASE_ROLES_BY_COUNT` updated to match the official Avalon role table:

| Players | Good Side                                           | Evil Side                          |
| ------- | --------------------------------------------------- | ---------------------------------- |
| 5       | Merlin, Percival, Arthur                            | Assassin, Minion                   |
| 6       | Merlin, Percival, Arthur, Loyal_1                   | Assassin, Morgana                  |
| 7       | Merlin, Percival, Arthur, Loyal_1                   | Assassin, Morgana, Oberon          |
| 8       | Merlin, Percival, Arthur, Loyal_1, Loyal_2          | Assassin, Morgana, Mordred         |
| 9       | Merlin, Percival, Arthur, Loyal_1, Loyal_2, Loyal_3 | Assassin, Morgana, Mordred         |
| 10      | Merlin, Percival, Arthur, Loyal_1, Loyal_2, Loyal_3 | Assassin, Morgana, Mordred, Oberon |

Key rule corrections:

- **Arthur is always one of the loyal servants** at every player count (was missing for 7p–10p before)
- **9p is 6 loyal / 3 traitor** (corrected from earlier 5/4 — no Oberon at 9p by default)
- `TEAM_COUNTS[9]` updated to `{ loyal: 6, traitor: 3 }`

### 2. `buildRolePool` swap semantics

`optionalRoles` shifted from "add these on top" to "override against the defaults":

- key absent → use BASE_ROLE_SETS default
- `true` → force include (swap in by replacing a generic `LOYAL_N` / `MINION_N` slot)
- `false` → force exclude (swap out, replace with a generic of the same team)
- The pool size always stays correct; ARTHUR / MERLIN / ASSASSIN are never swapped

### 3. Lobby UX cleanup

- Removed dev-only "custom" badge (users didn't understand it)
- Removed "Defaults will be set once player count is known" message
- Tick marks (`✓` / `+`) alone now convey current inclusion state
- Active roles get colored chips: green = loyal, red = traitor

### 4. Slot-aware toggle (the real fix)

The backend's `applyOverride` silently no-ops when no generic slot exists — UI used to lie by showing ✓ for ignored toggles. The frontend now enforces traitor slot limits proactively.

`MAX_TRAITOR_SPECIALS = { 5:1, 6:1, 7:2, 8:2, 9:2, 10:3 }` (= total traitors − 1 for Assassin).

When the host ticks a traitor special at the limit, `toggleRole` auto-unticks the first currently-active traitor special — a swap, not an addition. Pool size stays at the rule-mandated count. Percival (the only loyal special) needs no constraint.

Verified end-to-end: at 8p with all 3 traitor specials available, clicking Oberon while Morgana + Mordred are on auto-removes Morgana to keep the total at 2.

---

## Session History — Realism Pass (Night Table, Voting Table, Tiro Bangla, Deployment Prep)

This session was a deep UX pass to make the digital experience feel like a real board game around a table.

### 1. Backend — vote reveal staging (`gameLogic.js` + `handlers.js`)

Previously, the last vote synchronously flipped the phase to MISSION, so clients never saw "Team Approved! 👍4 · 👎3" — the reveal was skipped.

Split `submitVote` so that the all-voted moment marks the proposal `revealed: true` but **keeps the phase at VOTING**. A new `completeVoteResolution(game)` does the actual phase transition. The socket handler schedules it via `setTimeout(..., VOTE_REVEAL_DELAY_MS)` (4.5s) — clients see the reveal banner + tally during that window, then transition.

### 2. Backend — mission card progress (`gameLogic.js`)

Added `submittedPlayerIds` to `currentMission` public state. The UI uses this to show **per-player** card-submitted indicators (✓ / ⏳) without ever leaking the card values.

### 3. Frontend — `NightTable` (new component) + 10-step night phase

Replaced the old "dark overlay + role card highlights" with a **circular POV table**:

- Every player sees themselves at the bottom (6 o'clock). Others fan around clockwise in their join order. POVs are mutually consistent — if X sits to your left, you sit to X's right.
- Each seat shows: initials avatar, name (no role), and a state badge for eyes (😴 / 👁) and thumb (👍).
- Eye/thumb state for OTHER players is shown only when the viewer's own eyes are open — strict no-info-leak.
- Center of table: 🕯️ flickering candle + current step instruction.

The phase now follows the **canonical Avalon moderator script** with thumb mechanic (10 steps, 0–9): 0. Role distribution (15s) — private RoleCard reveal, like dealing cards

1. "Everyone close eyes and extend fists" (5s)
2. "Minions (except Oberon), thumbs up & open eyes — recognize fellow traitors" (15s)
3. "Minions, thumbs down & close eyes" (4s)
4. "Minions (except Mordred), thumbs up — eyes closed" (4.5s)
5. "Merlin, open eyes — behold the agents of evil" (15s)
6. "Minions, thumbs down. Merlin, close eyes" (4.5s)
7. "Merlin and Morgana, thumbs up — eyes closed" (4.5s)
8. "Percival, open eyes — behold Merlin and Morgana (cannot tell which is which)" (15s)
9. "Merlin and Morgana, thumbs down. Percival, close eyes" (4.5s)

The thumb mechanic prevents the seen role from accidentally seeing the seer — Merlin & Morgana raise thumbs with eyes still closed, so Morgana never identifies Merlin.

`GameContext.NIGHT_STEP_COUNT` bumped from 5 → 10. Host's "Next Step → / Begin Game" button now derives from `STEPS.length` so it scales automatically.

### 4. Reveal coloring (corrected)

- 🔴 Red glow → confirmed traitors (Merlin's view of traitors; traitor's view of fellow traitors)
- 🟣🟡 Purple-gold + `?` badge → Percival's Merlin candidates (could be Merlin OR Morgana — deliberately ambiguous)
- 🟡 Gold → step 4 "all eyes open" (no team coloring)
- Earlier mistake — colored Percival's candidates green (which would falsely imply both loyal). Fixed.

### 5. Frontend — `VotingTable` (new component)

Same circular POV geometry as `NightTable`, but per-seat state shows:

- 👑 crown above leader's avatar
- 🗡️ Crossed-swords team marker (PNG badge, top-right of avatar) for players on the proposed team — survives even when vote-result colors take over
- Live vote status during pending (✓ voted / ⋯ waiting)
- Revealed vote outcome (gated by `REVEAL_INDIVIDUAL_VOTES` — see below)
- Center: 🗳️ live counter `voted / N` → ✅/❌ banner + aggregate `👍X · 👎Y` after reveal

### 6. `gameConfig.js` (new file, `Polashi/src/gameConfig.js`)

Central feature flags. Current contents:

```js
export const REVEAL_INDIVIDUAL_VOTES = false;
```

- `false` (current): only the aggregate tally is shown after reveal — individual votes secret (more deception)
- `true`: each seat colored 👍 green / 👎 red after reveal (canonical Avalon)
  Aggregate is always shown either way.

### 7. Team marker badge (replaces gold halo)

- Source: `Polashi/public/team-marker.png` (128×128, ~29 KB; transparent background)
- Created from a 1254×1254 source PNG by:
  - `Polashi/scripts/strip-white-bg.mjs` — pure-JS pngjs script, sets alpha to 0 for near-white pixels (`unicode-range`-style cleanup)
  - `Polashi/scripts/downscale-png.mjs` — box-filter downscale to 128×128
- Floats top-right of the avatar with drop-shadow

### 8. `RoleReveal` component — privacy by default

Role is no longer displayed openly. A floating "🎭 My Role" pill button sits at top-right of every in-game screen (via `GameLayout`); tapping opens a centered modal with the full role card (closes on backdrop click / ESC).

- `inline` variant used inside the night dark overlay
- Removed the "Your role: ARTHUR" leak from `TeamProposal.jsx`

### 9. Mission card UI — "Honor stays your hand"

- Both Success and Betrayal buttons are now shown to EVERY team member regardless of side
- Loyal players who tap Betrayal get a flavor modal (🛡️ "Honor stays your hand" / "বিশ্বাসঘাতকতা সম্ভব নয়") with rule explanation; the request is never sent
- Per-player submission indicators on the team list (✓ Card played / ⏳ Choosing…)

### 10. HomePage redesign — symmetric mode headers

- Small uppercase tagline ON TOP: "Arthurian Legend" / "১৭৫৭ • পলাশীর প্রান্তর"
- Icon and name INLINE: ⚔️ Avalon · 🗡️ পলাশী (dagger instead of generic 🇧🇩 flag — fits Mir Jafar's betrayal theme)
- Tagline below: "A game of wit and deception" / "বুদ্ধি ও প্রতারণার খেলা"

### 11. Tiro Bangla font (self-hosted, Bengali-only)

- Installed `@fontsource/tiro-bangla` as a tracked dependency
- Bengali woff2 + woff copied into `Polashi/public/fonts/` (76 KB + 62 KB)
- `@font-face` in `index.css` uses `unicode-range: U+0980-09FF, U+200C-200D, U+25CC` so Tiro Bangla renders ONLY Bengali glyphs
- Body font stack: `'Tiro Bangla', 'Inter', 'Noto Sans Bengali', system-ui, sans-serif`
- Per-glyph fallback: English letters continue to use Inter

### 12. Bot test infrastructure (committed)

`Polashi/scripts/bots.mjs` — dev-only helper that joins N bots into a room **you host**:

```
node scripts/bots.mjs <ROOM_CODE> [bot_count=6]
```

Bots auto-vote, auto-play mission cards (loyal: success; traitor: 60% fail), auto-propose random teams when they're leader, auto-use Lady of the Lake, and auto-final-guess as Assassin. The HOST (you) drives night phase pacing via the existing "Next Step →" button. Designed for solo end-to-end testing of every game state.

### 13. Bug fixes / rule corrections (clarifications)

- **Mordred is hidden from Merlin** (not Oberon). User initially proposed flipping this — I cited the project's own rules doc to confirm canonical behavior. Merlin sees Assassin, Morgana, Oberon, generic Minions — NOT Mordred.
- **Oberon stays closed during the traitor reveal step** (his power isolates him from his own team). The traitor-step instruction now explicitly says "Oberon, keep your eyes closed".
- Percival call-out improved: names both Merlin AND Morgana directly but stresses "cannot be told apart" — and uses the thumb mechanic so Morgana never sees Merlin.

### 14. Tooling / dependency adds

- `@fontsource/tiro-bangla` (frontend) — self-hosted Bengali font
- `pngjs` (frontend, dev-time) — used by the two image-processing scripts under `Polashi/scripts/`

### 15. Live team-proposal preview (`game:team_preview` relay)

- New backend event in `handlers.js`: `game:team_preview` validates leader + phase, then broadcasts `team:preview` to the room. No game-state change — pure UX relay (same pattern as `game:night_step`).
- New context state `previewedTeam` in `GameContext.jsx`; resets when a new TEAM_PROPOSAL begins (currentProposal null).
- New action `previewTeamSelection(code, ids)` — leader emits on every selection change.
- New component `TeamProposalTable.jsx` — same circular POV as night/voting, with 👑 on the leader and crossed-swords team marker on selected seats. Clickable seats for the leader; read-only for everyone else.
- `TeamProposal.jsx` rewritten to use the table instead of `PlayerList`. Leader's local `selected` state drives instant feedback for themselves AND is broadcast as preview to everyone else, so the markers pop on/off seats live.
- Bots in `scripts/bots.mjs` also emit progressive previews when a bot is leader — human players see the bot's team markers appear one-by-one over ~3-5s instead of all-at-once.

### 16. Architecture cleanup — shared table base + single rule source

After three POV tables (`NightTable`, `VotingTable`, `TeamProposalTable`) all reimplemented the same geometry, extracted them onto a shared base so visual / layout changes apply to every phase from one place:

- **`PlayerTable.jsx`** (new) — owns the circular geometry (seatDelta → polar coords), the wooden-table container, and the center slot. Calls `renderSeat(player, ctx)` for each player.
- **`Seat.jsx`** (new) — owns the avatar, initials, name label, "(you)" suffix, keyboard accessibility. Phase-specific badges (crown, eye, thumb, team marker, vote outcome) come in as `children`.
- Each phase's table component is now ~80 lines instead of ~140 — pure phase-specific logic (eye/thumb state, vote outcome, click handling) composed onto the shared base.

**`Polashi/src/gameRules.js`** (new) — single source of client-side game rule constants:

- `MISSION_SIZES`, `DOUBLE_FAIL_MISSION_INDEX`, `DOUBLE_FAIL_MIN_PLAYERS`
- `BASE_ROLES_BY_COUNT`, `MAX_TRAITOR_SPECIALS`
- Role groupings: `TRAITORS_NON_OBERON`, `MINIONS_NON_MORDRED`, `MERLIN_OR_MORGANA`

Consumers updated to import from there instead of reimplementing inline:

- `Lobby.jsx`, `MissionTracker.jsx`, `TeamProposal.jsx`, `NightTable.jsx`, `scripts/bots.mjs`

Backend `constants.js` still holds the **authoritative** copy — drift remains a known risk (logged in this file's Best-Practices Review) but at least the client is now consolidated to one file.

### 17. Minor — `LadyOfLake.jsx` setState-during-render bug

Replaced `if (ladyResult && amHolder && !revealed) setRevealed(ladyResult)` (executed during render) with a `useEffect` that latches the result when it arrives. React strict mode no longer warns.

### 18. Consistency / loose-coupling pass (every phase uses shared building blocks)

Final pass to make sure changing one thing in one place propagates everywhere it should:

- **Night step → role state mapping**: moved `viewerEyesOpenAt(step, role)` and `viewerThumbUpAt(step, role)` from `NightTable.jsx` into `gameRules.js`. Both `NightTable` (seat badges) AND `NightPhase` (drift text) now consume the same helpers — used to duplicate the role groupings inline.
- **`LadyOfLake` → POV table**: was using `PlayerList` (list view). Now composes `PlayerTable + Seat` like every other phase. The token holder seat gets a 🌊 marker, the chosen target gets a green glow, already-investigated players are dimmed with a ✓ badge.
- **`FinalGuess` → POV table**: was using a click-list of `player-chip`s. Now composes `PlayerTable + Seat`. Known traitors (visible to traitors only) get red glow + 🔴 badge; the assassin's target gets a 🎯 marker. Loyal-side viewers see the table but no clickable targets.
- **`PlayerList.jsx` deleted** — no remaining consumers after the two refactors above.
- **`PHASES` enum** added to `gameRules.js`. `RoomPage.jsx` now uses a `PHASE_COMPONENTS` map keyed by these constants (adding a new phase = one entry); `GameContext.jsx` uses `PHASES.NIGHT` / `PHASES.TEAM_PROPOSAL` instead of bare strings.
- **NightPhase.jsx STEPS.forRoles** now imports `TRAITORS_NON_OBERON` from `gameRules.js` instead of repeating the array literal.

After this pass, **every phase that shows the room as a table uses the same `PlayerTable + Seat` pair**. Restyle the table once → applies to Night, Voting, Team Proposal, Lady of the Lake, AND Final Guess automatically.

### 19. Player reconnection (refresh / brief drop)

Previously a refresh or wifi blip cost a player their seat — disconnect handler immediately removed them, and the new socket was treated as a fresh joiner. Added a per-tab persistent client identity:

- **Frontend** `socket/socket.js` — generates a UUID once, stores in `sessionStorage` as `polashiClientId`, attaches via `io(URL, { auth: { clientId } })`. Reused on every reconnect within the same tab.
- **Backend** `handlers.js` — reads `socket.handshake.auth.clientId`, threads it through to `createRoom` / `joinRoom` / `room:get_state`. The clientId is stored on `room.players[i]` and `room.game.players[i]`.
- **`joinRoom`** now treats a matching clientId as a RECONNECT — updates the player's socketId in both `room.players` and `room.game.players` instead of adding a new entry.
- **`room:get_state`** auto-restores too: if the requesting socket's clientId matches an existing player in the room, their socketId is silently refreshed. The invite-link / refresh flow skips the name prompt and lands the player back in their game.
- **`disconnect`** holds the seat: in lobby it still removes them (clean cleanup); during an active game it just sets `disconnected: true` and re-syncs the room. Other players see "(📡 offline)" until they reconnect.
- `clientId` is **stripped from public state** in `getPublicRoomState` — it's an internal reconnect token, not broadcast.
- `Seat.jsx` shows a 📡 marker + faded/grayscaled avatar for disconnected players. Lobby chips also show "📡 offline".
- sessionStorage (not localStorage) so two tabs don't accidentally share the same seat.

What still stalls: if a player disconnects in the MIDDLE of voting / mission card submission, the round waits for their vote/card. No timeout to auto-skip yet. Acceptable for friend-group play, worth adding for public deployment.

### 20. Cross-device responsive pass

Targeted phones (incl. tiny 320-360px), tablets, laptops, desktops, and landscape phones. Changes are CSS-only except for `index.html` viewport tag.

- **`index.html` viewport**: `width=device-width, initial-scale=1, viewport-fit=cover` — removed `maximum-scale=1.0, user-scalable=no` so accessibility pinch-zoom works. Added `viewport-fit=cover` for iOS notch handling.
- **`.page` safe-area padding**: uses `max(16px, env(safe-area-inset-*))` so the iOS home indicator and Android nav bar never overlap critical UI.
- **`.container` breakpoints**: 480px (mobile) → 520px (≥ 640px tablet) → 560px (≥ 1024px desktop). Stays centered, never gets too wide.
- **`.night-table` sizing**: `width: min(100%, 90vh, 460px)` — the circle is bounded by **viewport height** as well as width, so phones in landscape never have the table overflow vertically. Tablet bumps to 520px, desktop 540px.
- **Seat tiers**: tiny ≤320px (36px avatar), small ≤380px (40px), default (48px), tablet+ ≥640px (56px). Crown / thumb / team-marker badges scale with each tier.
- **Landscape mode**: `@media (max-height: 500px) and (orientation: landscape)` compresses padding so the table + action button fit one screen.
- **Touch targets**: every `.btn` has `min-height: 44px` (Apple HIG). `touch-action: manipulation` on `body` removes the 300ms double-tap-to-zoom delay on mobile.
- **`-webkit-tap-highlight-color: transparent`** on all interactive elements (buttons, chips, seats, dots, toggles).
- **Modals**: extracted shared `.modal-backdrop` + `.modal-content` classes with safe-area padding, `max-height: 100%` and `overflow-y: auto` so tall content scrolls inside the overlay instead of overflowing. Used by RoleReveal, Mission Honor warning, and chapter-history modal.
- **`.room-code`**: `font-size: clamp(1.4rem, 6vw, 2.2rem)` — readable on a 320px phone, nicely large on tablet.
- **Floating "🎭 My Role"** button: now `top/right: max(12px, env(safe-area-inset-*))` so it never hides behind the iOS notch.
- **`.conn-banner`**: safe-area top padding so the "Connecting…" banner doesn't disappear under the notch.

### 21. Removed team-revealing text above mission card buttons

The Mission screen used to show "You are a traitor. Sabotage the mission…" or "Choose your card carefully" / "Loyal members must always play Success" above the ✅ Success / 💀 Betrayal buttons. Anyone glancing at a player's phone could instantly read their team. **Removed entirely** — both buttons are now shown with no preface text. If a loyal player taps Betrayal, the existing "🛡️ Honor stays your hand" modal handles the rule explanation privately. Also removed the now-unused `amTraitor` local in `Mission.jsx`.

### 22. Chapter / Quest history modal (clickable mission tracker)

Backend `recordMissionResult` now captures per-mission details:

- `leaderId` + `leaderName` (who proposed the approved team)
- `teamIds` + `teamNames` (the team that played, or the 5th-rejected team for auto-fails)
- `approveCount` + `rejectCount` (the vote tally)

Frontend `MissionTracker` dots are clickable on completed missions (✓ or ✗). Click → modal pops up showing the full chapter story:

- Mission number + outcome banner (succeeded / sabotaged / auto-failed)
- Leader, team members, vote tally (👍 X · 👎 Y)
- Card outcome (X / Y fail cards)
- For auto-fails: explicit "5 team proposals were rejected in a row" with last-leader / last-team
  Closes on backdrop tap, ESC, or the ✕ button.

### 23. Rejection counter prominence

The 5-rejection auto-loss rule was enforced server-side from day 1 but the UI counter was tiny + hidden when count was 0. Reworked into a proper panel in `GameLayout`:

- Always visible during `TEAM_PROPOSAL` / `VOTING` phases
- Wide pip bars instead of tiny dots, with explicit text "Rejections: N / 5"
- State coloring: neutral 0-2, gold warn ≥ 3, red+pulse danger ≥ 4
- Danger panel shows "⚠️ Next rejection = traitors win"

### 24. Reveal-glow fix (avatar dimming bug during night-phase reveals)

Players with eyes closed but thumb raised (e.g. Minions during Merlin's call-out) were getting BOTH `seat-closed` (which dims to 55% opacity + grayscales) AND `seat-reveal seat-traitor` (red glow). The dimming overrode the glow — a faint pink smudge on a murky disc, easy to miss.

Fix in `index.css`:

- Added `.seat-reveal .seat-avatar { opacity: 1; filter: none }` to reset the dimming when revealing
- Beefed up the box-shadow to a 3-layer aura (45% inner + 70% mid + 35% outer)
- Added `seat-glow` keyframes — revealed seats scale 1.0× ↔ 1.08× over 2s so the eye picks them out
- Thumb badge size bumped from 1.15rem to 1.45rem with stronger gold drop-shadow on revealed seats

Affects every reveal context — Night call-outs, Final Guess (assassin sees fellow traitors).

### 25. Bilingual role descriptions (Polashi mode) + lobby English-only reverts

Lobby's `SPECIAL_ROLES` constant now has `descAvalon` + `descPolashi` per role. Polashi descriptions use the user's specific phrasings tied to the dual character names (মীর মদন, ঘষেটি বেগম, রায় দুর্লভ, উমিচাঁদ):

- **মোহন লাল**: মীর মদন ও ঘষেটি বেগমকে দেখে কিন্তু কে কোনটা জানে না
- **ঘষেটি বেগম**: মীর মদন সেজে মোহন লালকে বিভ্রান্ত করে
- **রায় দুর্লভ**: উমিচাঁদ ছাড়া লাল দলের সবাইকে চেনে, কিন্তু মীর মদন রায় দুর্লভকে চেনে না
- **উমিচাঁদ**: উমিচাঁদ লাল দলের হয়েও নিজ দলের কাউকে চেনে না, কিন্তু মীর মদন জানে সে লাল দলে

All OTHER lobby strings (Room Code, Players, Game Mode, Special Roles header, Host, "(you)", "📡 offline", Waiting for X more players, Start Game, etc.) revert to English-only across both modes — user preferred consistency on UI chrome, with Polashi flavor reserved for the actual character names + role descriptions.

### 26. AFK auto-action + connection notifications

Single disconnected player can no longer freeze the game. Backend now schedules a 60s auto-action timer whenever the game is waiting on a disconnected player.

- New file: `Polashi - Backend/src/socket/afkHandler.js` exports `scheduleAfkCheck(io, code)` + `clearAfkTimer(code)`. Tracks one pending timer per room in `afkTimers` Map.
- `waitingPlayerIds(game)` derives blockers per phase: VOTING (un-voted), MISSION (un-submitted team members), TEAM_PROPOSAL (leader), LADY_OF_LAKE (holder), FINAL_GUESS (assassin).
- `handlers.js syncRoom` calls `scheduleAfkCheck` after every state broadcast — if any blocker is disconnected, the 60s countdown starts and `afk:timer_started` is broadcast to the room.
- When the timer fires, `autoActAfkPlayers` takes random rule-respecting actions:
  - **Voting**: 50/50 approve/reject
  - **Mission card**: loyal → success ; traitor → 50/50 fail/success
  - **Team proposal**: uniformly random team (Fisher-Yates over all players)
  - **Lady of Lake**: random eligible non-investigated target
  - **Final guess**: random non-known-traitor pick
- Each auto-action broadcasts `afk:auto_action` with `{ playerName, action }` so the room sees a toast like "🤖 Inzamam voted approve (auto)".
- Vote-resolution still respects the 4.5s reveal delay even when auto-played.
- Timer auto-clears when the player reconnects (next syncRoom drops them from `blockers`).

Frontend additions:

- `GameContext.jsx` listens for `player:joined`, `player:left`, `player:disconnected`, `player:reconnected`, `afk:timer_started`, `afk:auto_action`. Each appends to a `notifications` array with auto-cleanup timer.
- New `Notifications.jsx` component (mounted in `App.jsx`) — fixed-position toast stack at top-center, 3 visual kinds (info, good, warn), backdrop blur, `pointer-events: none` so they never block gameplay clicks, `aria-live="polite"` for screen readers.
- Slide-in animation `toastIn` + safe-area-aware positioning.

### 27. `.gitignore` files in place

- Root `.gitignore` — OS/editor/caches
- `Polashi/.gitignore` — adds explicit `.env`, `.vite`
- `Polashi - Backend/.gitignore` — created from scratch (was missing — flagged as High-priority risk in the previous review)

---

## Best-Practices Review

### ✅ What's already good

**Architecture**

- Server-authoritative game state, never trusts the client (security ✓)
- Private state (role / knowledge) sent only to that player's socket, never broadcast
- Clean module boundaries on the backend: `game/` (rules) ↔ `rooms/` (room store) ↔ `socket/` (transport)
- Frontend: single `GameContext` owns all socket actions + state, no prop-drilling
- All socket emit actions wrapped in `useCallback`
- `BrowserRouter` + `Routes` + `Navigate` fallback handle unknown URLs
- React `StrictMode` on
- Env vars (`VITE_SOCKET_URL`, `CLIENT_URL`, `PORT`) with `.env.example` files

**Stack hygiene**

- Modern deps (React 19, Vite 8, Socket.io 4)
- ESLint configured on the frontend
- Health check endpoint at `/health` keeps Render warm
- CORS pinned to `CLIENT_URL` (not `*`)
- Connection-state recovery enabled on Socket.io (30s reconnection window)

**Game logic**

- Rules centralized in `constants.js` and consumed everywhere
- Mission size + traitor count + Mission-4-double-fail rules all data-driven
- Role assignment + card shuffling are server-side only (cheat-proof)

### ⚠️ Issues to address before / soon after deployment

| Priority         | Issue                                                                                               | Where                        | Status                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ~~High~~         | ~~Backend has no `.gitignore`~~                                                                     | `Polashi - Backend/`         | ✅ **Fixed this session** — full `.gitignore` added                                                             |
| **High**         | Default role table is duplicated between frontend & backend — drift risk (we already hit this once) | `constants.js` ↔ `Lobby.jsx` | Still open. Fix: fetch from server, or extract to a shared JSON copied at build time                            |
| **High**         | No input validation on socket payloads (player name length, proposed-team shape, room code format)  | `socket/handlers.js`         | Still open. Add lightweight validators; reject malformed payloads with a clear error                            |
| **Med**          | No reconnection-to-room flow — if a player's socket drops, they lose their seat                     | `GameContext.jsx` + backend  | Still open. On reconnect, re-emit `room:get_state` using a code persisted in `sessionStorage`                   |
| **Med**          | No tests anywhere — game logic is the riskiest code and has no coverage                             | `Polashi - Backend/`         | Still open. At minimum, unit-test `buildRolePool`, `submitMissionCard`, `submitVote` + `completeVoteResolution` |
| **Med**          | `MAX_TRAITOR_SPECIALS` hardcoded in `Lobby.jsx` instead of derived from `TEAM_COUNTS`               | `Lobby.jsx`                  | Still open. Either ship `TEAM_COUNTS` to the client or compute via room state                                   |
| **Low**          | No rate limiting on socket events (e.g. `room:update_settings` spam)                                | `socket/handlers.js`         | Still open                                                                                                      |
| **Low**          | Backend uses CommonJS while frontend uses ESM — mild inconsistency                                  | `package.json`               | Optional                                                                                                        |
| **Low**          | No backend `README.md`                                                                              | `Polashi - Backend/`         | Optional — repo-root README already covers backend deploy                                                       |
| **Low**          | `night_step` relay accepts any integer — should clamp to `0..9` (was `0..4` before this session)    | `handlers.js:98`             | Still open                                                                                                      |
| **Low**          | Inline styles scattered in components                                                               | `components/*.jsx`           | Optional cleanup once layout stabilizes                                                                         |
| **Nice-to-have** | No JSDoc / TypeScript on shared shapes                                                              | repo-wide                    | Optional                                                                                                        |
| **Nice-to-have** | No CI / GitHub Actions for lint + tests                                                             | repo root                    | Optional                                                                                                        |

### Verdict

Structure is **clean and idiomatic** for a Socket.io + React app of this size. The biggest remaining correctness risk is the duplicated role table between frontend (`Lobby.jsx`) and backend (`constants.js`) — we already saw it drift once and a similar drift could break the lobby silently. Worth flagging if you change default role sets again.

---

## Confirmed Tech Stack

| Layer         | Technology                    | Notes                                         |
| ------------- | ----------------------------- | --------------------------------------------- |
| Frontend      | React + Vite                  | Project name: **Polashi**                     |
| Real-time     | Socket.io                     | Client (frontend) + Server (backend)          |
| Backend       | Node.js + Express + Socket.io | Project name: **Polashi - Backend**           |
| Database      | None — in-memory `Map`        | Game state lives in RAM on the server         |
| Frontend Host | Vercel (free)                 | Free tier, no credit card                     |
| Backend Host  | Render.com (free)             | Free tier, spins down after 15 min inactivity |

---

## Repository / Folder Structure (Planned)

```
Fun Task Avalon/               ← working directory
├── CLAUDE.md                  ← this file
├── polashi_avalon_unified_rules.md
├── Polashi/                   ← FRONTEND (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── socket/
│   │   ├── data/              ← character data, role configs, mission tables
│   │   ├── styles/
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── Polashi - Backend/         ← BACKEND (Node.js + Express + Socket.io)
    ├── src/
    │   ├── game/              ← game logic (role assignment, mission rules, etc.)
    │   ├── rooms/             ← room/lobby management
    │   ├── socket/            ← socket event handlers
    │   └── index.js           ← entry point
    ├── .env.example
    └── package.json
```

---

## Architecture

- Frontend (Vercel) connects to Backend (Render) via Socket.io WebSocket
- All game state is managed **server-side only** — clients never hold authoritative state
- Private info (roles, night phase reveals) is sent **only to the relevant player's socket**
- Room codes are 6-character alphanumeric (e.g. `MIRJF3`), generated server-side
- Shareable link format: `https://polashi-game.vercel.app/join/MIRJF3`
- Host identity stored in browser `sessionStorage` for reconnection

---

## Game Rules Summary (Quick Reference)

### Player Counts

| Players | 🟢 Loyal | 🔴 Traitor |
| ------- | -------- | ---------- |
| 5       | 3        | 2          |
| 6       | 4        | 2          |
| 7       | 4        | 3          |
| 8       | 5        | 3          |
| 9       | 6        | 3          |
| 10      | 6        | 4          |

### Mission Sizes

| Players | M1  | M2  | M3  | M4\* | M5  |
| ------- | --- | --- | --- | ---- | --- |
| 5       | 2   | 3   | 2   | 3    | 3   |
| 6       | 2   | 3   | 4   | 3    | 4   |
| 7       | 2   | 3   | 3   | 4    | 4   |
| 8       | 3   | 4   | 4   | 5    | 5   |
| 9       | 3   | 4   | 4   | 5    | 5   |
| 10      | 3   | 4   | 4   | 5    | 5   |

_Mission 4 with 7+ players needs **2 Fail cards** to be sabotaged._

### Win Conditions

- 🔴 Traitors win 3 missions → immediate win
- 🟢 Loyal win 3 missions → Final Guess Phase (Assassin guesses Merlin; correct = traitors win)
- 5 consecutive rejected proposals in one mission → traitors win that mission automatically

---

## All Characters

| Role                               | Polashi 🇧🇩        | Avalon ⚔️       | Team       | Power                  |
| ---------------------------------- | ----------------- | --------------- | ---------- | ---------------------- |
| Leader figure                      | নবাব সিরাজউদ্দৌলা | Arthur          | 🟢 Loyal   | No power               |
| Sees all traitors (except Mordred) | মীর মদন           | Merlin          | 🟢 Loyal   | Knows traitors         |
| Knows Merlin (confused by Morgana) | মোহন লাল          | Percival        | 🟢 Loyal   | Knows Merlin           |
| Standard loyal ①                   | লুৎফুন্নিসা বেগম  | Loyal Servant ① | 🟢 Loyal   | No power               |
| Standard loyal ②                   | সেন্ট ফ্রে        | Loyal Servant ② | 🟢 Loyal   | No power               |
| Standard loyal ③                   | ডেবুসি            | Loyal Servant ③ | 🟢 Loyal   | No power               |
| Final guess (Assassin)             | মীর জাফর          | The Assassin    | 🔴 Traitor | Assassination guess    |
| Hidden from Merlin                 | রায় দুর্লভ       | Mordred         | 🔴 Traitor | Invisible to Merlin    |
| Appears as Merlin to Percival      | ঘষেটি বেগম        | Morgana         | 🔴 Traitor | Decoy Merlin           |
| Unknown to all                     | উমিচাঁদ           | Oberon          | 🔴 Traitor | Isolated from everyone |

---

## Optional Mechanics

### Lady of the Lake (Avalon mode only, toggleable)

- Token starts with player to the right of first Leader
- Activates after Mission 2 completes
- Token holder secretly learns team alignment (Loyal/Traitor) of one other player
- Token passes to the investigated player after use
- Already-investigated players cannot be targeted again
- Both players may lie about what was revealed
- **Off by default in Polashi mode. Optional in Avalon mode.**

---

## Night Phase Order (Step-by-Step)

1. All eyes closed — screen goes dark
2. Traitors open eyes — see each other (Oberon keeps eyes closed)
3. মীর মদন / Merlin opens eyes — sees traitors highlighted (NOT Mordred)
4. মোহন লাল / Percival opens eyes — sees Merlin AND Morgana (if in play), doesn't know which is which
5. All eyes open — game begins

---

## UI / UX Requirements

- **Mobile-first, responsive** — players will be on phones
- **Dark theme** by default
- Polashi mode: warm earthy tones, Bengali script for names
- Avalon mode: cool steel/blue tones, English names
- Clear visual separation of public info vs. private info
- Private info must NOT be accessible via browser DevTools or network inspection

---

## Security Requirements

- Role assignment → server-side only
- Mission card shuffling → server-side only
- Private state (role, night reveals) → sent only to the correct socket, never broadcast
- Reconnection → server restores private game state to rejoining player

---

## Key Design Decisions Made

1. **No database** — all state in memory. Server restart ends active rooms. Acceptable for casual use.
2. **No login** — players join with name + room code only
3. **No built-in voice** — Discord handles communication
4. **Serverless NOT used** — WebSockets require a persistent Node.js server
5. **Socket.io chosen over raw WebSockets** — for built-in rooms, broadcasting, reconnection

---

## Deployment Targets

| Service    | What                        | URL pattern                    |
| ---------- | --------------------------- | ------------------------------ |
| Vercel     | Frontend (Polashi)          | `polashi-game.vercel.app`      |
| Render.com | Backend (Polashi - Backend) | `polashi-backend.onrender.com` |

Both are free tier, no credit card required.
Render free tier spins down after 15 min inactivity — cold start ~30–50s.

---

## Files in This Directory

- `CLAUDE.md` — this file
- `polashi_avalon_unified_rules.md` — full game rules reference
- `Polashi.pdf` — original reference PDF
- `Polashi/` — frontend React app (to be created)
- `Polashi - Backend/` — backend Node.js server (to be created)
