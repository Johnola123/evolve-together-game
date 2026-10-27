# Evolve Together — Multiplayer Evolution Arena

A responsive, no-account multiplayer game. Every participant uses a separate phone, tablet, or computer. **The digital host operates automatically**: players join by short code, the lobby counts down, species editing locks when time expires, the common ecosystem simulates survival, and players are ranked after every round.

## How to run

Install Node.js 20+ and run:

```bash
npm install
npm start
```

Open **http://localhost:3000**. Choose **Create automatic game**, enter a nickname, then share the 6-character room code. Open the same URL on other browser tabs or devices and select **Join with a code**. Minimum two players. No player accounts or API keys.

For phones or tablets on the **same Wi-Fi**, use the host computer's local IP instead of `localhost`, such as `http://192.168.1.50:3000`. Firewall permissions may need adjustment. For players on different networks, deploy to any Node.js host supporting WebSockets and HTTPS; see below.

## Game flow (v1.3)

1. **One six-minute lobby (360 seconds)**. Players join using Play Now matchmaking or the room code. The digital host starts the workshop after the countdown when at least two players are connected. The countdown never resets, and a room with fewer than two players ends with a notice.
2. **Private workshop (600 seconds / ten minutes).** Each player builds their own creature, selecting upgrades and allocating 30 evolution points. Changes may be saved and revised until time runs out.
3. **Shared survival arena (30 seconds maximum).** All species enter the same server-simulated ecosystem and face food scarcity, environmental hazards, and reproduction. During this 30-second arena, every player sees a prominent analysis message; it switches to “Calculating final scores…” for the last five seconds, then the leaderboard appears automatically.
4. **Results and replay vote (45 seconds).** Survival rankings and scores display. Exactly one round is mandatory. Every connected player must vote Yes to begin another ten-minute workshop; a No vote or missing vote at deadline ends the match.
5. **Final champion celebration.** The cumulative winner receives a trophy/confetti celebration. If fewer than two players remain online for 15 seconds during an active match, it ends with a message for the remaining player.

The host is fully automatic, with no accounts required for players. A refresh reconnects using the browser's stored player identity.

## Local setup

```bash
npm install
npm start
```

Open http://localhost:3000 on the developer computer. Use the local network IP for other devices on the same Wi-Fi, or deploy to a public HTTPS URL for different networks. The six-minute and ten-minute phases are fixed as requested.

## Tests

```bash
npm test
```

Engine tests cover input validation, body-part deduplication, deterministic seeded survival runs, and scoring.

## Publish to a public URL

1. Push these source files to GitHub (do not commit `node_modules`).
2. Deploy as a **Node.js web service** on Render, Railway, Fly.io or similar provider with WebSocket support.
3. Build command: `npm install` or `npm ci` if a lockfile is generated; start command: `npm start`.
4. Set environment variable `PORT` only if required by the host. Use the HTTPS URL for your Handshake submission.
5. Test using multiple actual phones on different networks.

This prototype stores rooms **in memory** and runs on **one server instance**. Scaling beyond one instance requires shared room state (e.g., Redis), a Socket.IO adapter, load testing and improved persistence. Intended capacity is up to 30 participants per room, but **30-device reliability has not yet been load tested**. Refreshing the server clears matches.

## Project structure

- `server.js`: automated host, room codes, player sessions, synchronized phases and timers.
- `engine.js`: validated creature rules, seeded world simulation and ranking.
- `public/index.html`: responsive application shell.
- `public/style.css`: mobile-first visual design.
- `public/game.js`: playable join, creator, simulation, scoreboard and touch interactions.
- `tests/engine.test.js`: deterministic unit tests.

## Current prototype boundaries

- Dragging moves the preview creature; adding/removing parts happens through touch-friendly selection buttons, **not free-positioned anatomical assembly**.
- Species influence food collection, movement, protection and reproduction. Ecosystem competition is currently **resource and environmental**, not creature-on-creature combat or explicitly modeled symbiosis.
- AI-generated events are not integrated: survival is deterministic, local and does not depend on a paid model API.
- Automatic digital host, room-based multiplayer, builder, timing, ecosystem and ranking are implemented; this is a prototype, not a production-hardened or load-tested game.

## Handshake submission checklist

Project title: **Evolve Together: Build. Adapt. Survive.**

Provide a public HTTPS URL, project cover image, project description, and ensure the project is playable on multiple devices. Follow the competition's contest entry instructions and deadline separately; only the contestant needs a Handshake account, not game players.


## Version notes

- **v1.1:** Start Fresh requests confirmation and only leaves the local player's session; refresh reconnects.
- **v1.2:** Automatic matchmaking, shared live player lobby and private timed workshops.
- **v1.3:** 30 evolution points, one six-minute lobby countdown, ten-minute design period, at least one mandatory round with unanimous optional replay voting, automatic lone-player ending and winner confetti.

## Deploy latest updates to GitHub and Render

Replace the project source files with those in this archive, then from the repository folder run:

```bash
git add .
git commit -m "Add optional replay voting, fixed timers, expanded creature budget and champion animation"
git push origin main
```

If Render Auto-Deploy is enabled, the public URL updates automatically. Otherwise choose **Manual Deploy → Deploy latest commit** in Render. Make sure only one Render instance runs this in-memory-room prototype. Old game rooms are lost during redeployment.


## Version 1.4 — all-player ready-up lobby

- Lobby counter **3 minutes**, automatically restarting every 3 minutes; **timeout never forces a start or ends the lobby**.
- Each connected participant must choose **Start Game · I’m ready**. The server transitions to the 10-minute private creature builder only when at least two participants are connected **and all of them are ready**.
- With only one connected participant, Start Game is disabled and the screen explains that another player is required.
- Ready state is shown beside each nickname. Players can cancel readiness before everyone is ready; disconnecting cancels that player's ready state and excludes them from the online player total. Refresh/reconnect also clears ready state for safety.
- Once the builder begins, the existing survival simulation, results, optional continuation vote, and winner celebration are unchanged.
- **Environment**: `GAME_LOBBY` and `GAME_BUILD` are intentionally ignored to enforce 180 seconds and 600 seconds respectively.

**Note:** Deploying a new version restarts the in-memory Node.js server; existing rooms will be lost.

### v1.5 survival timer and waiting message
The shared survival phase is **30 seconds maximum** (server enforced even if `GAME_SIMULATION` is set higher). All devices see a prominent progress message while survival runs. During the final five seconds it changes to **“Calculating final scores…”** and the existing ranked results screen appears automatically at zero. The ready-up lobby, ten-minute workshop, voting, and winner celebration are unchanged.
