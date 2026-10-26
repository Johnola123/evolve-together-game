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

## Flow

1. **Lobby (25 seconds):** starts automatically if at least two players joined; otherwise resets a 10-second waiting window.
2. **Design (150 seconds):** touch and mouse support; species name, color, body upgrades, five trait sliders; one shared 16-point budget; remove/rebuild/save as often as desired.
3. **Lock + survival (100 seconds):** server checks drafts, creates fallback species where needed, and simulates all species centrally each second. Events rotate through clear skies, drought, predators, rain and cold.
4. **Rankings (16 seconds):** calculates 35% survival, 25% growth, 20% adaptation, 10% resource efficiency, 10% ecology. Runs three rounds automatically; cumulative scores decide ranking.
5. **Match complete:** displays cumulative leaderboard. No human controls, no separate host account.

Players who reconnect using the same browser keep a session identifier and can rejoin a room. Players who arrive after the lobby closes must join another room.

## Fast demo mode

```bash
GAME_LOBBY=10 GAME_BUILD=35 GAME_SIMULATION=30 GAME_RESULTS=8 GAME_ROUNDS=2 npm start
```

Open two browser windows and join the same room. On shared machines, use one normal and one private browser profile to simulate two distinct players. Production default values are specified in `server.js` and can be overridden by environment variables (see `.env.example`). Environment variables are **not** loaded from `.env` automatically: provide them through your hosting provider or run using a tool such as `dotenv-cli`.

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


## Updated player experience (v1.1)

- Landing page now uses **Play now** rather than **Create automatic game**. A digital host still creates and manages the room without a human host.
- **Normal refresh reconnects the same nickname/player to the same room** to avoid losing progress on accidental refresh; browsers may show a generic leave-page confirmation during an active match.
- **Start Fresh** in the header requests confirmation, then resets **only that player's browser identity and room participation**. The shared world, timers, and other players continue.
- During the lobby, Start Fresh removes that player from the roster. During an active match, it marks them disconnected while preserving their species in the current match so scoring remains stable.
- To intentionally leave and rejoin an in-progress room, use refresh (same identity); Start Fresh creates a fresh anonymous identity, which cannot join a match already underway.
- Browsers control the wording of refresh warnings; the custom confirmation is specifically for the Start Fresh button.
