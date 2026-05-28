# Polashi 🗡️ / Avalon ⚔️

> **A real-time multiplayer social deduction game for 5–10 players.**
> One engine, two themes. Play in any browser, no account, no install.

A faithful digital implementation of *The Resistance: Avalon*, reskinnable on the fly to **Polashi** — set in 1757 during the Battle of Plassey, with characters drawn from the era of Nawab Siraj-ud-Daulah and Mir Jafar's betrayal.

| Mode | Theme | Era |
|---|---|---|
| **Polashi 🗡️** | Bengali | Battle of Plassey, 1757 |
| **Avalon ⚔️** | English / Arthurian | Camelot |

The two modes share **exactly the same rules** — only character names, art, language, and tagline change. Pick your theme at room creation; switch any time before the game starts.

---

## Table of Contents

- [What is this?](#what-is-this)
- [How to Play](#how-to-play)
- [📜 Full Game Rules](#-full-game-rules)
  - [The Two Teams](#the-two-teams)
  - [Team Composition by Player Count](#team-composition-by-player-count)
  - [Win Conditions](#win-conditions)
  - [🌙 The Night Phase](#-the-night-phase-setup)
  - [📖 The 5 Missions](#-the-5-missions-day-phase)
  - [🏁 The Final Assassination](#-the-final-assassination)
  - [🌊 Lady of the Lake (optional)](#-lady-of-the-lake-optional)
- [🃏 Characters](#-characters)
- [📋 Mission Size Table](#-mission-size-table)
- [💡 Quick Rules Summary](#-quick-rules-summary)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [🚀 Deployment](#-deployment-100-free)
- [Security Notes](#security-notes)

---

## What is this?

A **social deduction game** where 5–10 players are secretly split into two teams: a **loyal majority** who don't know who they can trust, and a **hidden traitor minority** who know each other and work to sabotage from within. Over **5 missions**, players debate, vote on teams, and try to either complete missions (loyal) or sabotage them (traitor) — all while figuring out who's actually on which side.

Designed to be played **over Discord voice chat with friends**. No accounts, no logins, no installs — just open a link, enter a name, and play.

---

## How to Play

1. **Open the link** — the host creates a room and copies the invite link
2. **Share with friends** — paste the link in Discord; everyone joins via browser
3. **Host configures** — pick game mode (Polashi or Avalon), special roles, optional Lady of the Lake
4. **Start the game** — once 5–10 players are in the lobby
5. **Night phase** — secret roles are revealed privately on each player's screen
6. **5 missions** — propose teams, vote, and play mission cards
7. **First side to win 3 missions** wins (subject to the Final Assassination twist)

---

## 📜 Full Game Rules

### The Two Teams

**🟢 The Loyal Side** — work together to complete 3 of 5 missions. Most members have no special knowledge and must rely on observation, deduction, and trust.

**🔴 The Traitor Side** — hidden among the group. Traitors secretly know each other (with **one exception**) and try to sabotage 3 missions OR identify the loyal side's secret informant at the very end.

> The loyal side **doesn't know** who the traitors are. Traitors secretly know each other — **except Oberon**, who is isolated from everyone.

---

### Team Composition by Player Count

| Players | 🟢 Loyal | 🔴 Traitor |
|---------|----------|-----------|
| 5  | 3 | 2 |
| 6  | 4 | 2 |
| 7  | 4 | 3 |
| 8  | 5 | 3 |
| 9  | 6 | 3 |
| 10 | 6 | 4 |

---

### Win Conditions

| Outcome | Result |
|---|---|
| 🔴 Traitors sabotage **3 missions** | 🔴 **Traitors win** immediately |
| 🔴 Traitors get **5 team proposals rejected in a row** in one mission | 🔴 **Traitors automatically win that mission** |
| 🟢 Loyal completes **3 missions** | Game continues — proceed to **Final Assassination** |
| 🟢 Loyal completes 3, then Assassin guesses Merlin **wrong** | 🟢 **Loyal wins** |
| 🟢 Loyal completes 3, then Assassin guesses Merlin **correctly** | 🔴 **Traitors steal the win** by assassination |

---

### 🌙 The Night Phase (Setup)

Before the game begins, the app guides every player through a sequence of moments. The night phase faithfully follows the canonical moderator script, including the **thumb mechanic** so a role being "seen" never accidentally identifies the seer.

1. **Your role is dealt** — each player privately sees their character card. (15 s)
2. **Everyone closes their eyes** and extends fists. (5 s)
3. **Traitors (except Oberon)** raise their thumbs and open their eyes — silently identify each other. (15 s)
4. Traitors thumbs down, close their eyes. (4 s)
5. **Traitors (except Mordred)** raise their thumbs, eyes stay closed. (4.5 s)
6. **Merlin opens eyes** — sees the raised thumbs (the agents of evil, minus Mordred). (15 s)
7. Traitors thumbs down. Merlin closes eyes. (4.5 s)
8. **Merlin and Morgana** raise their thumbs, eyes stay closed. (4.5 s)
9. **Percival opens eyes** — sees Merlin AND Morgana with thumbs raised, but cannot tell which is which. (15 s)
10. Merlin and Morgana thumbs down. Percival closes eyes. (4.5 s)

The day phase then begins automatically. **Total ~85 seconds** — calibrated for memorization with no risk of info leak.

---

### 📖 The 5 Missions (Day Phase)

The game is played over **5 missions** ("Quests" in Avalon mode, "Chapters" in Polashi mode). First side to 3 wins.

#### Step 1 — Leader proposes a team

- One player is the **Leader** each round (rotates clockwise after each mission).
- Leader picks the required number of players for this mission (see [Mission Size Table](#-mission-size-table) below).
- Leader **may or may not** include themselves.
- The proposed team is marked with the **🗡️ team marker** so everyone sees who's been picked. In this app, you also see the leader picking **live** — markers pop on/off seats in real time as the leader taps.

#### Step 2 — Everyone votes

- All players simultaneously submit **👍 Approve** or **👎 Reject** — votes are secret until reveal.
- After everyone votes, the result is announced: only the **aggregate tally** is shown (e.g. `👍 4 · 👎 3`). Individual votes stay hidden (configurable in `gameConfig.js`).

**Vote result:**
- ✅ **Majority approves** → the team goes on the mission. Proceed to Step 3.
- ❌ **Majority rejects** → leader token passes to the next player. A NEW team is proposed for the **same mission**.

> ⚠️ **If 5 proposals in a row are rejected in the same mission, the Traitors automatically win that mission.** The app shows a prominent counter with warning and danger states as you approach this limit.

#### Step 3 — The mission happens

- Each approved team member secretly plays a **Success** or **Fail** card.
- Cards are shuffled server-side, then revealed.

**Mission rules:**
- 🟢 **Loyal players MUST play Success.** The app prevents this — if a loyal player taps Betrayal, a "🛡️ Honor stays your hand" modal blocks the action.
- 🔴 **Traitor players choose freely** — play Fail to sabotage, or Success to stay hidden.

**Mission result:**
- ✅ **All Success cards** → 🟢 Loyal side completes this mission.
- ❌ **One or more Fail cards** → 🔴 Traitor side sabotages it.

> 📌 **Special rule for 7+ players, Mission 4 only:** Sabotage requires **2 Fail cards** — a single Fail is not enough.

After each completed mission, click the dot in the **mission tracker** at the top of the screen to see a detailed "chapter history": leader, team, vote tally, and outcome.

---

### 🏁 The Final Assassination

If the **🟢 Loyal side wins 3 missions**, the game is **not yet over**. The traitors get **one final guess** to identify **Merlin** (মীর মদন in Polashi mode).

- All traitors may discuss quietly. The traitors' UI highlights known fellow traitors.
- The **Assassin (মীর জাফর / The Assassin)** then taps one player on the table — their guess.
- ✅ **Correct guess** → 🔴 **Traitors win** by assassination.
- ❌ **Wrong guess** → 🟢 **Loyal side wins** — Merlin survived.

---

### 🌊 Lady of the Lake (Optional)

Available as a **host toggle in Avalon mode** (off by default in Polashi mode).

- One player starts with the **Lady of the Lake token** — assigned to the player to the right of the first Leader.
- After **Mission 2 completes**, the token activates.
- The token holder **secretly learns the team alignment** (Loyal or Traitor — but not the specific role) of one other player.
- After using it, the token **passes to the investigated player** for next mission.
- A player who has already held the token **cannot be investigated again**.
- Both the holder and the investigated player **may lie or tell the truth** about what was revealed.

---

## 🃏 Characters

All characters have **exact equivalents in both modes**. Same powers, different names and theme.

### 🟢 Loyal Side

| Power / Role | Polashi 🇧🇩 | Avalon ⚔️ |
|---|---|---|
| **Leader figure, no power** | নবাব সিরাজউদ্দৌলা | Arthur |
| **🌟 Knows all traitors except Mordred** | মীর মদন | Merlin |
| **🛡️ Knows Merlin (confused by Morgana)** | মোহন লাল | Percival |
| **🤍 Generic loyal, no power** ① | লুৎফুন্নিসা বেগম | Loyal Servant I |
| **🤍 Generic loyal, no power** ② | সেন্ট ফ্রে | Loyal Servant II |
| **🤍 Generic loyal, no power** ③ | ডেবুসি | Loyal Servant III |
| **🤍 Generic loyal, no power** ④ | বিশ্বস্ত সৈনিক | Loyal Servant IV |

### 🔴 Traitor Side

| Power / Role | Polashi 🇧🇩 | Avalon ⚔️ |
|---|---|---|
| **🗡️ Makes the final assassination guess** | মীর জাফর | The Assassin |
| **👻 Hidden from Merlin** | রায় দুর্লভ | Mordred |
| **🎭 Appears as Merlin to Percival** | ঘষেটি বেগম | Morgana |
| **🌑 Unknown even to other traitors** | উমিচাঁদ | Oberon |
| **🔴 Generic traitor, no power** ① | ইস্ট ইন্ডিয়া চর I | Minion of Mordred I |
| **🔴 Generic traitor, no power** ② | ইস্ট ইন্ডিয়া চর II | Minion of Mordred II |
| **🔴 Generic traitor, no power** ③ | ইস্ট ইন্ডিয়া চর III | Minion of Mordred III |

### Always in every game (cannot be turned off)
- Merlin / মীর মদন (loyal)
- Arthur / নবাব সিরাজউদ্দৌলা (loyal)
- The Assassin / মীর জাফর (traitor)

### Optional via host toggle in the lobby
- Percival / মোহন লাল
- Morgana / ঘষেটি বেগম
- Mordred / রায় দুর্লভ
- Oberon / উমিচাঁদ

If a special is turned off, its slot is filled by a generic role of the same team.

---

## 📋 Mission Size Table

Number of players required for each mission:

| Players | Mission 1 | Mission 2 | Mission 3 | Mission 4 * | Mission 5 |
|---------|-----------|-----------|-----------|-------------|-----------|
| 5       | 2         | 3         | 2         | 3           | 3         |
| 6       | 2         | 3         | 4         | 3           | 4         |
| 7       | 2         | 3         | 3         | 4           | 4         |
| 8       | 3         | 4         | 4         | 5           | 5         |
| 9       | 3         | 4         | 4         | 5           | 5         |
| 10      | 3         | 4         | 4         | 5           | 5         |

\* **Mission 4 with 7+ players** requires at least **2 Fail cards** to sabotage.

---

## 💡 Quick Rules Summary

- 🔴 Traitors know each other — **except Oberon**, who is isolated from everyone.
- 🟢 Merlin knows all traitors — **but cannot see Mordred**.
- 🟢 Percival knows Merlin — **but Morgana creates a decoy** (Percival sees both with raised thumbs and can't tell which is real).
- Voting is **simultaneous** — only the aggregate yes/no count is shown after reveal.
- **5 consecutive rejections** in one mission = automatic traitor win for that mission.
- In **7+ player games, Mission 4 needs 2 Fail cards** to be sabotaged.
- If loyal wins 3 missions, the **Assassin gets one final guess** at Merlin — a correct guess wins for traitors.
- 🟢 Loyal members **must always** play Success. 🔴 Traitors **choose**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Real-time transport | Socket.io 4 |
| Backend | Node.js + Express 5 + Socket.io 4 |
| State | In-memory (no database — rooms live in RAM) |
| Bengali typography | Self-hosted Tiro Bangla (Bengali subset, `unicode-range`-scoped) |
| Frontend hosting | Vercel (free) |
| Backend hosting | Render.com (free) |

### Project structure

```
Fun Task Avalon/
├── Polashi/                  ← Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         POV table, lobby, phases, modals
│   │   ├── pages/              HomePage, RoomPage
│   │   ├── context/            GameContext — single store for all socket state
│   │   ├── data/               characters.js — all role info bilingual
│   │   ├── gameRules.js        Single client-side source of rule constants
│   │   ├── gameConfig.js       Feature flags (e.g. REVEAL_INDIVIDUAL_VOTES)
│   │   └── socket/             Socket.io client config + per-tab clientId
│   ├── public/                 team-marker.png, fonts/, favicon
│   └── scripts/                bots.mjs — local dev testing helper
├── Polashi - Backend/        ← Backend (Node.js + Express + Socket.io)
│   ├── src/
│   │   ├── game/               constants, gameLogic, roleAssignment (authoritative)
│   │   ├── rooms/              roomManager — in-memory rooms + reconnect
│   │   └── socket/             handlers, afkHandler (60s auto-action timer)
│   └── .env.example
├── CLAUDE.md                 ← Full session-by-session history for Claude Code
├── polashi_avalon_unified_rules.md
└── README.md                 ← This file
```

---

## Local Development

### Prerequisites
- Node.js 18+ and npm

### 1. Start the backend

```bash
cd "Polashi - Backend"
cp .env.example .env
npm install
npm run dev
```

Backend runs at **http://localhost:3001**

### 2. Start the frontend

```bash
cd Polashi
cp .env.example .env
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

Open http://localhost:5173 in your browser. Create a room and share the link with friends on the same network (or use one of the deployment options below for the real internet).

### 3. (Optional) Test alone with bots

```bash
# In the frontend folder
node scripts/bots.mjs <ROOM_CODE> [bot_count]
```

Bots auto-vote, auto-play mission cards, propose random teams when they're leader, and even simulate the Assassin's final guess. You drive the night phase and any actions for the seat you're sitting in.

---

## 🚀 Deployment (100% Free)

Two free services, no credit card required:

| Service | What | Notes |
|---|---|---|
| **Vercel** | Frontend | 100GB bandwidth/month |
| **Render.com** | Backend | 750 hrs/month; spins down after 15 min idle (~30–50s cold start) |

### Step 1 — Push to GitHub

From the repo root (`Fun Task Avalon/`):

```bash
git init -b main
git add .
git commit -m "Initial commit"

# Create empty repo at github.com/new (no README, no .gitignore, no license)
git remote add origin https://github.com/YOUR_USERNAME/polashi-avalon.git
git push -u origin main
```

### Step 2 — Deploy backend on Render

1. Sign up at **https://render.com** with GitHub
2. **New → Web Service** → connect your repo
3. Configure:

| Field | Value |
|---|---|
| **Name** | `polashi-backend` |
| **Root Directory** | `Polashi - Backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

4. **Environment** → add:

| Key | Value |
|---|---|
| `PORT` | `3001` |
| `CLIENT_URL` | `https://placeholder.vercel.app` *(update after Step 3)* |

5. Click **Create Web Service**. Wait ~2 minutes. Copy your backend URL (e.g. `https://polashi-backend.onrender.com`).

### Step 3 — Deploy frontend on Vercel

1. Sign up at **https://vercel.com** with GitHub
2. **Add New → Project** → import your repo
3. Configure:

| Field | Value |
|---|---|
| **Root Directory** | `Polashi` |
| **Framework Preset** | `Vite` (auto-detected) |

4. **Environment Variables** → add:

| Key | Value |
|---|---|
| `VITE_SOCKET_URL` | `https://polashi-backend.onrender.com` *(your Render URL from Step 2)* |

5. Click **Deploy**. Wait ~1 minute. Copy your frontend URL (e.g. `https://polashi-avalon.vercel.app`).

### Step 4 — Connect them

Go back to **Render → polashi-backend → Environment** and update `CLIENT_URL` to your actual Vercel URL. Save — Render auto-redeploys.

### Step 5 — Verify

1. Open your Vercel URL
2. "Connecting to server…" banner clears after a few seconds (first load may take 30–50s on Render's cold start)
3. Create a room, share the link, play with friends over Discord voice

### Pushing updates

```bash
git add .
git commit -m "Describe your change"
git push
```

Both Vercel and Render **auto-deploy on push to `main`** within ~1 minute.

---

## Security Notes

- **Role assignment is server-side only** — clients never receive other players' roles
- **Mission cards are shuffled server-side** before being revealed
- **Private state** (role, knowledge, vote) is sent only to the specific player's socket; never broadcast
- **Public state** (mission scores, vote counts, team proposals) is broadcast to everyone in the room
- **No login, no accounts** — players join with a name + 6-character room code
- **Per-tab clientId** in `sessionStorage` enables refresh-tolerant reconnection without exposing identity (the clientId is stripped from any public state broadcast)

---

## Environment Variables Reference

### Backend — `Polashi - Backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the server listens on |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL (for CORS pinning) |

### Frontend — `Polashi/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_SOCKET_URL` | `http://localhost:3001` | Backend WebSocket URL |

---

## Credits

- **Rule basis:** [The Resistance: Avalon](https://en.wikipedia.org/wiki/The_Resistance_(game)#The_Resistance:_Avalon) by Indie Boards & Cards
- **Polashi theme:** Original adaptation set in 1757 around the Battle of Plassey, featuring Nawab Siraj-ud-Daulah, Mir Jafar's betrayal, and the East India Company
- **Fonts:** [Tiro Bangla](https://fonts.google.com/specimen/Tiro+Bangla) (self-hosted), [Inter](https://rsms.me/inter/) (via Google Fonts)

---

*Built for friend-group game nights over Discord voice. Open source, free to host, no ads, no accounts.*
