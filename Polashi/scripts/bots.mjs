// ╭──────────────────────────────────────────────────────────────────────────╮
// │  Dev helper — adds bot players to a room YOU host.                       │
// │  Useful for solo testing of the full game flow with 7–10 players.        │
// ╰──────────────────────────────────────────────────────────────────────────╯
//
// USAGE:
//   1. Start backend (port 3001) and frontend (port 5173) as normal.
//   2. Open http://localhost:5173, click "Create Room", join with your name.
//      Copy the room code shown at the top of the lobby (e.g. K9CWCC).
//   3. From the Polashi/ folder run:
//        node scripts/bots.mjs <ROOM_CODE> [bot_count]
//
//      Examples:
//        node scripts/bots.mjs K9CWCC          # 6 bots → 7-player game (default)
//        node scripts/bots.mjs K9CWCC 4        # 4 bots → 5-player game
//        node scripts/bots.mjs K9CWCC 9        # 9 bots → 10-player game (max)
//
//   4. Bots join automatically. Once the lobby is full, click "Start Game"
//      in the host UI. Then drive the night phase yourself ("Next Step →").
//
//   5. After night phase, bots take care of all bot-side actions:
//        - Auto-vote (always approve)
//        - Auto-play mission card (loyal: success; traitor: 60% fail)
//        - Auto-propose random team when a bot is the current leader
//        - Auto-use Lady of the Lake when a bot holds the token
//        - Auto-final guess (assassin bot picks a non-known-traitor)
//        - Auto-advance from mission result after a delay
//
//   Stop the script with Ctrl+C to disconnect all bots.

import { io } from "socket.io-client";
// Pull MISSION_SIZES from the same single source the UI uses.
import { MISSION_SIZES } from "../src/gameRules.js";

const URL = process.env.SOCKET_URL || "http://localhost:3001";
const ROOM_CODE = process.argv[2]?.toUpperCase();
const BOT_COUNT = parseInt(process.argv[3] || "6", 10);

if (!ROOM_CODE) {
  console.error("");
  console.error("Usage: node scripts/bots.mjs <ROOM_CODE> [bot_count=6]");
  console.error("");
  console.error("Example: node scripts/bots.mjs K9CWCC 6");
  console.error("");
  process.exit(1);
}
if (BOT_COUNT < 1 || BOT_COUNT > 9) {
  console.error(`Bot count must be 1–9 (got ${BOT_COUNT})`);
  process.exit(1);
}

const BOT_NAMES = [
  "Shiper",
  "Dipto",
  "Ifti",
  "Rafin",
  "Adnan",
  "Tanbir",
  "Sium",
  "Abdullah",
  "Niloy",
];
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const bots = [];

async function connect(name) {
  const s = io(URL);
  await new Promise((r) => s.once("connect", r));
  return { name, socket: s, id: s.id, role: null, team: null };
}

async function main() {
  console.log("");
  console.log(
    `Bringing ${BOT_COUNT} bot${BOT_COUNT > 1 ? "s" : ""} into room ${ROOM_CODE}…`,
  );
  console.log("");

  for (let i = 0; i < BOT_COUNT; i++) {
    const name = BOT_NAMES[i] || `Bot${i + 1}`;
    const b = await connect(name);
    const res = await new Promise((r) =>
      b.socket.emit("room:join", { code: ROOM_CODE, playerName: name }, r),
    );
    if (res?.error) {
      console.error(`✗ ${name}: ${res.error}`);
      b.socket.disconnect();
      continue;
    }
    bots.push(b);
    console.log(`✓ ${name} joined`);
  }

  if (bots.length === 0) {
    console.error(
      "\nNo bots joined. Is the backend running and the room code correct?",
    );
    process.exit(1);
  }

  console.log("");
  console.log(
    `${bots.length} bot${bots.length > 1 ? "s" : ""} in the lobby. Click "Start Game" in your host UI.`,
  );
  console.log("");

  // Each bot tracks its private state
  for (const bot of bots) {
    bot.socket.on("player:private", (priv) => {
      bot.role = priv.roleId;
      bot.team = priv.team;
    });
  }

  // One bot acts as the "driver" — listens to global state and dispatches
  // actions to whichever bot needs to act.
  const driver = bots[0];
  let lastPhase = null;
  let lastLeaderIdx = -1;
  let lastProposalSig = null;
  let lastMissionSig = null;
  let lastLadyHolder = null;
  let lastMissionIdx = -1;
  let finalGuessHandled = false;

  driver.socket.on("room:state", async (state) => {
    const gs = state.gameState;
    if (!gs) return;

    // Phase change announcer
    if (gs.phase !== lastPhase) {
      console.log(`▶ Phase: ${gs.phase}`);
      lastPhase = gs.phase;

      if (gs.phase === "NIGHT") {
        console.log("  Bot roles (host advances night steps in the UI):");
        for (const b of bots) {
          console.log(`    ${b.name.padEnd(10)} → ${b.role} (${b.team})`);
        }
      }
    }

    // Team proposal — bot leader picks a random team
    if (gs.phase === "TEAM_PROPOSAL" && gs.leaderIndex !== lastLeaderIdx) {
      lastLeaderIdx = gs.leaderIndex;
      const leader = gs.players[gs.leaderIndex];
      const leaderBot = bots.find((b) => b.id === leader.id);
      if (leaderBot) {
        const size = MISSION_SIZES[gs.playerCount][gs.currentMissionIndex];
        const ids = gs.players.map((p) => p.id);
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        const team = ids.slice(0, size);
        const teamNames = team
          .map((id) => gs.players.find((p) => p.id === id)?.name)
          .join(", ");
        console.log(
          `  ${leaderBot.name} proposes mission ${gs.currentMissionIndex + 1}: ${teamNames}`,
        );

        // Live "selection in progress" — emit a preview for each pick so
        // human players see the team markers pop onto seats one-by-one.
        const partial = [];
        for (const id of team) {
          partial.push(id);
          leaderBot.socket.emit("game:team_preview", {
            code: ROOM_CODE,
            proposedTeam: [...partial],
          });
          await delay(700 + Math.random() * 500);
        }
        await delay(800);
        leaderBot.socket.emit("game:propose_team", {
          code: ROOM_CODE,
          proposedTeam: team,
        });
      } else {
        console.log(`  You're the leader — make your team proposal in the UI.`);
      }
    }

    // Voting — all bots approve any unseen proposal
    if (gs.phase === "VOTING" && gs.currentProposal) {
      const sig = `${gs.currentMissionIndex}:${gs.consecutiveRejections}:${gs.currentProposal.proposedTeam.join(",")}`;
      if (sig !== lastProposalSig) {
        lastProposalSig = sig;
        const voted = gs.currentProposal.votedPlayerIds || [];
        for (const bot of bots) {
          if (!voted.includes(bot.id)) {
            await delay(1200 + Math.random() * 1800);
            bot.socket.emit("game:vote", { code: ROOM_CODE, approve: true });
          }
        }
      }
    }

    // Mission cards — bots on the team submit
    if (gs.phase === "MISSION" && gs.currentMission) {
      const sig = `${gs.currentMissionIndex}:${gs.currentMission.team.join(",")}`;
      if (sig !== lastMissionSig) {
        lastMissionSig = sig;
        const teamIds = gs.currentMission.team;
        for (const bot of bots) {
          if (teamIds.includes(bot.id)) {
            // Loyal always success; traitor fails 60% of the time
            const card =
              bot.team === "loyal"
                ? "success"
                : Math.random() < 0.6
                  ? "fail"
                  : "success";
            await delay(1500 + Math.random() * 2000);
            bot.socket.emit("game:mission_card", { code: ROOM_CODE, card });
          }
        }
      }
    }

    // Mission result — bots auto-advance after a delay
    if (
      gs.phase === "MISSION_RESULT" &&
      gs.currentMissionIndex !== lastMissionIdx
    ) {
      lastMissionIdx = gs.currentMissionIndex;
      await delay(6000);
      driver.socket.emit("game:advance_mission_result", { code: ROOM_CODE });
    }

    // Lady of Lake — if a bot holds, investigate the first available target
    if (gs.phase === "LADY_OF_LAKE" && gs.ladyOfLakeHolder !== lastLadyHolder) {
      lastLadyHolder = gs.ladyOfLakeHolder;
      const holder = bots.find((b) => b.id === gs.ladyOfLakeHolder);
      if (holder) {
        const candidates = gs.players.filter(
          (p) => p.id !== holder.id && !gs.ladyOfLakeUsedBy.includes(p.id),
        );
        const target = candidates[0];
        if (target) {
          console.log(`  ${holder.name} investigates ${target.name}`);
          await delay(4000);
          holder.socket.emit("game:lady_of_lake", {
            code: ROOM_CODE,
            targetId: target.id,
          });
        }
      } else {
        console.log("  You hold Lady of the Lake — pick a target in the UI.");
      }
    }

    // Final guess — assassin bot picks a random "loyal-looking" player
    if (gs.phase === "FINAL_GUESS" && !finalGuessHandled) {
      const assassin = bots.find((b) => b.role === "ASSASSIN");
      if (assassin) {
        finalGuessHandled = true;
        const knownTraitorIds = new Set(
          bots
            .filter((b) => b.team === "traitor" && b.role !== "OBERON")
            .map((b) => b.id),
        );
        const candidates = gs.players.filter(
          (p) => !knownTraitorIds.has(p.id) && p.id !== assassin.id,
        );
        const target =
          candidates[Math.floor(Math.random() * candidates.length)];
        console.log(
          `  ${assassin.name} (Assassin) guesses ${target.name} as Merlin…`,
        );
        await delay(5000);
        assassin.socket.emit("game:final_guess", {
          code: ROOM_CODE,
          guessedPlayerId: target.id,
        });
      } else {
        console.log("  You are the Assassin — make your guess in the UI.");
      }
    }

    if (gs.phase === "GAME_OVER" && lastPhase !== "GAME_OVER_DONE") {
      console.log(`\n🏆 Winner: ${gs.winner?.toUpperCase()} (${gs.winReason})`);
      console.log(
        'Bots stay connected. Run "Play Again" in the UI or Ctrl+C to disconnect.\n',
      );
      lastPhase = "GAME_OVER_DONE";
    }
  });
}

process.on("SIGINT", () => {
  console.log("\nDisconnecting bots…");
  bots.forEach((b) => b.socket.disconnect());
  process.exit(0);
});

main().catch((err) => {
  console.error("Bot script error:", err);
  process.exit(1);
});
