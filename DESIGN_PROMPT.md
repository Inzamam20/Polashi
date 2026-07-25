# UI Redesign Brief — "Polashi / Avalon" (paste this into Claude Design)

> **How to use this:** Paste this entire file into Claude Design. **Also paste the current
> `Polashi/src/index.css`** alongside it (it is the authoritative list of class names and
> the existing theme tokens — the redesign must reuse those class names, not rename them).
> Everything below tells you what the app is, the hard constraints, the look I want, every
> screen + state, and — most importantly — **the exact output format** so I can drop the
> result straight into a live React + Vite app.

---

## 1. What this app is

A **real-time multiplayer social-deduction web game** — a dual-theme clone of *The Resistance:
Avalon*. Friends join a room via a shared link (no accounts, no install) and play over Discord
voice chat, mostly **on their phones**.

Two visual/language themes, **mechanically identical**, switched at room creation and toggled
in the app via a `data-mode` attribute on a top-level `<div>`:

| Mode | `data-mode` | Setting | Language | Current palette |
|------|-------------|---------|----------|-----------------|
| **Avalon** ⚔️ | `avalon` (default) | Arthurian Camelot | English (Inter) | Cool steel / blue, dark |
| **Polashi** 🗡️ | `polashi` | Battle of Plassey, 1757 | Bengali (Tiro Bangla) | Warm earthy brass / amber, dark |

Both themes are **dark by default**. Text is bilingual: Bengali names/labels render in a
self-hosted Bengali font (Tiro Bangla, scoped via `unicode-range`); Latin text uses Inter.

**Tech:** React 19 + Vite. Styling is a single global `index.css` using **CSS custom properties**
(design tokens) + utility/component classes, plus a little per-component inline styling. Theme
switching is done purely by overriding CSS variables under `[data-mode="polashi"]`. There is
**no CSS framework** (no Tailwind) and **no build-time CSS tooling** beyond plain CSS.

---

## 2. Art direction I want: **Dramatic & moody**

Lean into tension and atmosphere — this is a game about *who do you trust*. High contrast,
cinematic dark backdrops, strong directional "candlelight/torch" accent lighting, confident
bold display type for headlines, restrained body type. The circular table should feel like a
lit table in a dark room — everything else falls into shadow.

Per theme, keep the two moods distinct:

- **Avalon** — cold moonlit steel & deep blue, silver/steel highlights, a faint arcane blue
  glow against near-black. Think a war council by candlelight in a stone hall.
- **Polashi** — warm brass, amber lamplight, deep earthy browns and dark reds, a smoky
  gold glow. Think a conspiratorial court lit by oil lamps on the eve of a betrayal.

**Loyal = green, Traitor = red** must stay unmistakable in both themes (color-blind-safe:
pair color with icon/shape, never rely on hue alone).

### Artwork approach: **CSS/SVG-drawn only — no image files**

- **Do NOT introduce any external image assets, icon fonts, CDNs, or web fonts.** The app is
  deployed with a strict self-contained budget. Everything must be pure CSS and/or **inline SVG**.
- The app currently uses **emoji** as iconography (👑 leader, 🗡️ assassin, 🌊 Lady of the Lake,
  🌟 Merlin, 🛡️ Percival, 🎭 Morgana, 👻 Mordred, 🌑 Oberon, 🔴 minion, 👁 eyes, 👍 thumb, ✅/💀
  mission cards, etc.). You may **keep emoji where it reads well**, but I'd prefer you **upgrade
  the important recurring marks to crisp inline-SVG or CSS-drawn icons/crests** (crown, crossed
  swords team-marker, candle/flame, water ripple, eye open/closed, thumb, success/fail cards,
  loyal/traitor sigils). Draw them so they inherit color via `currentColor` / CSS variables so
  they retint per theme automatically.
- Textures (wood grain, parchment, brushed metal, vignette, glow) must be done with CSS
  gradients / box-shadows / SVG filters — no raster images.

---

## 3. Hard constraints (do not break these)

1. **Keep the circular "table" view.** This is the signature of the app and the thing I love.
   Every in-game phase renders the room as players seated around a round table: the viewer is
   always at the 6 o'clock seat, others fan clockwise. It is a shared, reusable component pair
   (`PlayerTable` + `Seat`) driven by these classes: `.night-table-wrap`, `.night-table`,
   `.night-table-center`, `.night-table-instruction`, `.night-table-step`, `.seat`,
   `.seat-avatar`, `.seat-initials`, `.seat-name`, plus per-state seat classes (below). **You
   may restyle the table lavishly, but keep the geometry, the center slot, and all these class
   names + the seat state-class contract intact.** The seats are positioned by inline
   `left%/top%` — your CSS must not fight absolute positioning on `.seat`.
2. **Mobile-first & responsive.** Primary target is phones, down to **320px** wide, including
   **landscape** phones with very short height. Also look good on tablet and desktop (the layout
   is a centered column, `max-width` ~480→560px). The table is sized by `min(100%, 90vh, …)` so
   it fits short viewports — preserve that height-awareness. Touch targets ≥ 44px.
   Respect iOS safe areas (`env(safe-area-inset-*)` — already used on `.page`, `.conn-banner`,
   the floating role pill, modals).
3. **Two themes via CSS variables only.** Deliver the full token set for **both** `:root`
   (Avalon) and `[data-mode="polashi"]`. Components must never hard-code a hex that should be
   themed — go through variables. The home screen currently shows Bengali text even while the
   color theme is still Avalon (a known bug on my side); design the tokens so both themes look
   intentional regardless.
4. **Preserve information hiding.** This is a hidden-role game. Some screens deliberately show
   different things to different players and hide others (see per-screen notes). **Never add any
   visual that would leak a player's secret role/team to someone glancing at their phone.**
   In particular the Mission screen must NOT preface the Success/Betrayal buttons with any
   team-revealing text. Keep private info behind the "My Role" modal only.
5. **Bilingual-safe.** Bengali strings are longer and taller than English. Don't rely on fixed
   heights for text; allow wrapping; keep name labels ellipsised (`.seat-name`). Test both
   languages in your preview.
6. **Reuse the existing class names.** Rewrite their *look*, don't rename them — renaming forces
   me to touch dozens of JSX files. If you must add a class, prefix it clearly and list it in the
   "New classes" section of your output so I can wire it up.
7. **No new runtime dependencies.** Pure CSS + inline SVG. Animations via CSS keyframes only.
   Respect `prefers-reduced-motion` (tone down the pulses/glows/flicker for users who set it).

---

## 4. Current design tokens (baseline — improve these)

```css
:root {                      /* Avalon (default) */
  --bg: #0d1117;  --bg-surface: #161b22;  --bg-elevated: #21262d;  --border: #30363d;
  --primary: #5b8dd9;  --primary-dim: #2d4a7a;
  --text: #e2e8f0;  --text-muted: #8b949e;
  --loyal: #3fb950;  --loyal-dim: #1a4027;
  --traitor: #f85149;  --traitor-dim: #4a1515;
  --gold: #e3b341;
  --radius: 12px;  --radius-sm: 8px;  --shadow: 0 4px 24px rgba(0,0,0,.4);
}
[data-mode="polashi"] {      /* warm overrides */
  --bg: #110c04;  --bg-surface: #1e1408;  --bg-elevated: #2a1e0e;  --border: #3d2e14;
  --primary: #c4963a;  --primary-dim: #5a3d10;  --text: #f5e6c8;  --text-muted: #9c8060;
}
```

You may add tokens (e.g. accent-glow color, table-felt gradient stops, elevation shadows,
success/fail card faces) — just define them for **both** themes and document new ones.

---

## 5. Every screen & state to design

Design **all** of these. For each, respect the info-hiding notes. States in *italics*.

### A. Home (`/`)
Landing screen. Contains: a mode tagline + big title + subtitle (switches Avalon/Polashi text &
icon); a **Game Mode** toggle (Avalon / Polashi); a **Create / Join** tab toggle; a name input;
*(join only)* a monospace room-code input; inline error text; primary CTA button; a footer note
("5–10 players · No account required · Play over Discord voice chat"). *States:* create vs join,
loading ("Connecting…"), disabled-until-connected, error.

### B. Room entry (`/room/:code`) — three pre-lobby states
1. *Room not found* — small centered error card (🚪), heading, message, "Back to home".
2. *Loading / joining* — centered spinner (⏳) + "Joining room CODE…" + a "go back home" link.
3. *Invite join prompt* — a card showing an "INVITE" label, the room code, a status line, and a
   name input + "Join Room" CTA. *Variants:* joinable (N players inside), **game already in
   progress** (no input, "Back to home"), **room full** (no input).

### C. Lobby
The pre-game room. Contains: big **room code** display + "Copy invite link" ghost button; a
**Players** card (chips with initials-avatar, name, 👑 Host tag, "(you)", "📡 offline" for
disconnected, a "N/10" count badge); *waiting-for-more-players* hint. **Host-only** settings:
Game Mode toggle; **Special Roles** list (each row: role name + one-line description + a
tick `✓`/plus `+` state; active rows tinted green=loyal / red=traitor — Percival, Morgana,
Mordred, Oberon); **Lady of the Lake** toggle (Avalon only); Start button (enabled at 5–10
players, else "Need N more players"). Non-host sees a "Waiting for host…" card. Roles shown here
are just game options — **no player's assigned role exists yet**, so nothing secret here.

### D. In-game chrome (`GameLayout`, wraps most game screens)
A persistent frame: top bar with room code (small), a screen **title**, and a mode badge
(⚔️/🗡️). Below it a card containing the **Mission Tracker** (5 dots showing quest sizes /
✓ success / ✗ fail / current; completed dots are tappable → open a **chapter-detail modal**),
a **loyal–traitor score**, and a footnote about the Mission-4 double-fail rule. When in
proposal/voting, a prominent **Rejections: N / 5** panel with pip bars (neutral 0–2, gold warn
≥3, red pulsing danger ≥4, "⚠️ Next rejection = traitors win"). Plus a **floating "🎭 My Role"
pill** (top-right, safe-area-aware) that opens the role modal. Optional subtitle line under the
tracker.

### E. Night phase
The atmospheric role-reveal sequence (10 steps, host-paced). Contains: a row of **step dots**
(progress 0–9); **step 0** = private role card reveal ("Memorize this silently. Do not show your
screen."); **steps 1–9** = the **circular table** with a flickering **candle** in the center +
the current moderator instruction, and per-seat state: eyes **open 👁 / closed 😴**, **thumb 👍**
raised, and **reveal glows** — red aura on confirmed traitors, purple-gold "?" on Percival's
Merlin/Morgana candidates, gold on all-eyes-open. A drifting italic status line tells the viewer
their own state. Host has a "Next Step → / ▶ Begin Game" button; others see "Waiting for host…".
**Info hiding is the whole point here:** a seat's eye/thumb/reveal state is only shown to a
viewer when *that viewer's own eyes are open* — you just style whatever classes are present;
don't add anything that reveals more.

### F. Team Proposal
`GameLayout` + the table. The **leader** taps seats to build a team of the required size (crown
👑 on the leader; a **crossed-swords team marker** appears on selected seats; selection
broadcasts live so everyone watches markers pop on/off). Confirm button shows "(selected/required)".
Non-leaders see a read-only table + "Leader is choosing…". *States:* leader vs non-leader,
error (wrong count), proposing.

### G. Voting
`GameLayout` + the table. Center shows a live "voted / N" counter that becomes a ✅/❌ banner with
a "👍X · 👎Y" tally after reveal. Seats show crown, team markers, and a per-seat "voted / waiting"
indicator (a neutral gold "voted" badge — **individual vote direction is secret by default**, so
do **not** color seats green/red on reveal unless a flag flips it on; aggregate tally is always
shown). Below: big **👍 Approve / 👎 Reject** buttons → after voting, a "Vote submitted — waiting"
card. *States:* voting, voted-waiting, revealed (pass/fail), 5-reject auto-loss banner.

### H. Mission
`GameLayout`. A **team card** listing each team member with a per-player "✓ Card played / ⏳
Choosing…" status + a progress bar. Team members get two big buttons: **✅ Success** and
**💀 Betrayal** (both shown to everyone — **no preface text**). *A loyal player who taps Betrayal*
gets an **"🛡️ Honor stays your hand" modal** explaining they must play Success (their tap is
never sent). Non-team members see "Waiting for the team… (cards are shuffled before reveal)".
*States:* on-team choosing, on-team submitted, spectating, honor-warning modal.

### I. Mission Result
`GameLayout`. Big result emoji (🎉 success / 💥 sabotage / auto-fail), a bold colored headline,
a **row of revealed cards** (✅ / 💀 faces — fail cards shown but *not* attributed to anyone),
a "N Fail cards played" line, and a **Loyal — Traitor score** panel. Host "Continue →" button;
others "Waiting for host…".

### J. Lady of the Lake (Avalon optional)
Table view. *Picking:* the token holder (🌊 marker) taps a target (green glow on selected);
already-investigated players are dimmed with a ✓; others can't be picked. "🌊 Investigate" button.
*Result (holder only):* a reveal card — "The lake reveals a secret… You investigated NAME →
🟢 Loyal / 🔴 Traitor", with a note that they may lie and the token now passes. Non-holders see
"NAME is investigating…". **The result is private to the holder.**

### K. Final Guess (assassination)
A headline banner ("The loyal side won 3 missions! But the Assassin gets one final chance to
identify Merlin"). Then the table: the **Assassin** taps a target (🎯 marker) to guess Merlin.
**Traitors see each other** (red glow + 🔴 badge) during this phase so they can confer — loyal
viewers do **not** see that. Big "🗡️ NAME is Merlin!" confirm button for the assassin; others see
a "deliberating…" line (traitors get a "discuss quietly" variant).

### L. Game Over
Full-screen result. A win/lose banner (🏆 / 💀) tinted by winner, "You Win/Lose!" + which side
won + the win reason (3 missions / 5 rejections / assassination / Merlin survived). If it ended
on the assassination, a card showing who the assassin guessed and whether it was right. A
**full role reveal** list (every player → their character icon + name, "(you)"). A "🔄 Play Again"
button. *Everything is public now — this is the reveal.*

### M. Global overlays
- **Connecting banner** — fixed top strip "Connecting to server…" (red, pulsing) when the socket
  is down.
- **Toast notifications** — top-center stack, 3 kinds: **info** (neutral: joined/left),
  **good** (green: reconnected), **warn** (amber: went offline / "auto-action in 60s" /
  "🤖 NAME voted approve (auto)"). Non-blocking (`pointer-events:none`), slide-in.
- **My Role modal** — the floating pill opens a centered modal showing the full role card
  (icon, name, title, description, night info, loyal/traitor badge). Closes on backdrop/ESC/✕.
- **Chapter-detail modal** (from the mission tracker) — per-quest recap: outcome, leader, team,
  vote tally, fail-card count / auto-fail explanation.

---

## 6. Class-name inventory to preserve (restyle, don't rename)

Reuse these (full definitions are in the `index.css` I'm pasting alongside). Grouped:

- **Layout:** `.page` `.container` `.card` `.card-elevated` `.divider` `.scroll-y`
- **Buttons:** `.btn` `.btn-primary` `.btn-outline` `.btn-loyal` `.btn-traitor` `.btn-ghost`
  `.btn-full` `.btn-lg`  (`:active`/`:disabled` states)
- **Inputs / toggles:** `.input` · `.toggle-group` `.toggle-option`(`.active`)
- **Badges:** `.badge` `.badge-loyal` `.badge-traitor` `.badge-neutral`
- **Player chips:** `.player-chip`(`.selected` `.is-leader` `.is-me` `.traitor` `.loyal`
  `.clickable` `.is-disconnected`) · `.player-avatar`
- **Mission tracker:** `.mission-track` `.mission-dot`(`.current` `.loyal` `.traitor` `.clickable`)
- **Rejections:** `.rejection-panel`(`.warn` `.danger`) `.rejection-track` `.rejection-pip`(`.filled`)
- **Role card:** `.role-card`(`.team-loyal` `.team-traitor`) `.role-icon` `.role-name`
  `.role-title` `.role-desc`
- **Table (KEEP GEOMETRY):** `.night-table-wrap` `.night-table` `.night-table-center`
  `.night-table-instruction` `.night-table-step`
- **Seat + states:** `.seat` `.seat-avatar` `.seat-initials` `.seat-eye` `.seat-name` ·
  states: `.seat-me` `.seat-open` `.seat-closed` `.seat-disconnected` `.seat-clickable`
  `.seat-reveal`(+ `.seat-traitor` `.seat-loyal` `.seat-neutral` `.seat-candidate`) ·
  `.seat-crown` `.seat-thumb` `.seat-team-marker` · voting: `.seat-voted-pending`
  `.seat-not-voted` `.seat-vote-approve` `.seat-vote-reject` `.seat-voted-secret` ·
  *(note: `.seat-team` is referenced by the Lady-of-the-Lake holder halo — please define it too)*
- **Special:** `.room-code` `.conn-banner` `.vote-bar` `.vote-bar-fill`
- **Modals:** `.modal-backdrop` `.modal-content` · legacy `.dark-overlay`
- **Animations (keep the class hooks):** `.animate-in`(`fadeIn`) `.pulse` `.flicker` `.drift`
  `.toast-in` · keyframes `popIn`, `seat-glow`
- **Utilities (leave working):** the `text-*`, `flex`, `flex-col`, `flex-center`, `gap-*`,
  `mt-*`, `mb-*`, `items-center`, `justify-between`, `font-bold`, `font-semi`, etc. You may
  restyle color utilities (`.text-loyal` `.text-traitor` `.text-gold` `.text-primary`) via tokens.

---

## 7. OUTPUT FORMAT — deliver exactly this (so I can integrate fast)

My stack is React + Vite with one global `index.css`. To integrate with minimal churn, give me:

### Deliverable 1 — a drop-in `index.css` (the main thing)
A **complete, ready-to-paste replacement** for `Polashi/src/index.css`. Requirements:
- Reuse **all** existing class names (Section 6); rewrite their styling.
- Full token sets for **both** `:root` and `[data-mode="polashi"]`.
- Keep the `@font-face` Tiro Bangla block and the body font stack exactly as-is (I'll paste
  it to you — don't drop it).
- Keep all responsive breakpoints working (≤320, ≤380, default, ≥640, landscape `max-height:500`).
- Include a `@media (prefers-reduced-motion: reduce)` block.
- Pure CSS, no imports, no external URLs.
- Comment each major section so I can diff against the current file.

### Deliverable 2 — a single self-contained `design-preview.html`
One standalone HTML file I can open in a browser to see **every screen and state** from Section 5
rendered with the real class names. Requirements:
- Inline the Deliverable-1 CSS in a `<style>` tag (so the preview *is* the source of truth).
- Show **both themes** — e.g. duplicate key screens, or a `data-mode` toggle at the top that
  flips a `data-mode` attribute on a wrapper. Include at least the table-based screens
  (Night / Voting / Team Proposal / Lady / Final Guess) and Home, Lobby, Mission, Mission Result,
  Game Over in both Avalon and Polashi.
- Include realistic bilingual sample content (5–7 seated players with initials, a candle center,
  crowns, team markers, eye/thumb states, reveal glows, a revealed vote tally, etc.).
- Label each block with the screen name + state so I know what I'm looking at.
- Fully static — no JS required beyond an optional theme-toggle snippet.

### Deliverable 3 — the reusable inline-SVG / CSS icon set
A short section giving me each **CSS/SVG-drawn mark** as a copy-pasteable snippet, colored via
`currentColor` / CSS vars: crown, crossed-swords team marker, candle+flame, water ripple, eye
(open/closed), thumb, success card face, fail card face, loyal sigil, traitor sigil, and any
crest/texture you introduce. Note which class/screen each is meant to sit in.

### Deliverable 4 — an integration note
A brief list of: (a) any **new class names or tokens** you added and where they're used;
(b) any place I'll need to touch JSX (ideally none — but flag it if a screen needs a wrapper
element or an extra span); (c) anything you intentionally changed structurally.

**Do NOT** deliver a React/Tailwind/styled-components rewrite, a Figma link, or external assets.
Plain CSS + inline SVG + one preview HTML. Keep it self-contained and paste-ready.

---

## 8. Quick don't-forget checklist
- [ ] Both themes fully tokenized; nothing secretly hard-coded.
- [ ] Circular table geometry + all `.seat*` state classes intact.
- [ ] Loyal=green / Traitor=red distinguishable by shape+icon, not hue alone.
- [ ] 320px, landscape, tablet, desktop all sane; touch targets ≥44px; safe areas respected.
- [ ] Bengali (tall/long) and English both fit; name labels ellipsise.
- [ ] No image files, no CDNs, no web fonts beyond the existing self-hosted ones.
- [ ] `prefers-reduced-motion` honored.
- [ ] Nothing on the Mission screen (or anywhere) leaks a player's hidden team.
