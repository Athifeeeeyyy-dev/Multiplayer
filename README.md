# ☠ Ghost Hunt — Multiplayer Horror Game

A real-time multiplayer raycasting horror game using Node.js + WebSockets.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Open the game
Visit `http://localhost:3000` in **multiple browser tabs** (or different devices on same network).

---

## How to Play

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Arrow Keys | Turn (or mouse after clicking canvas) |
| F | Toggle flashlight |
| Click canvas | Enable mouse-look |
| ESC | Release mouse |

### Objectives
1. Find the **yellow KEY** in the center of the maze
2. Bring it to the **green EXIT** in the top-right corner
3. Don't get caught by the ghost!

### Chat Commands
- `/start` — Start the game (from lobby)
- `/reset` — Reset the game

### Lobby
- Type your name, enter server URL, click **CONNECT**
- Click **START GAME** when ready (can play solo or with friends)

---

## Multiplayer on LAN

On your machine, find your local IP:
```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

Other players on the same network connect to:
```
ws://YOUR_IP:3000
```
Example: `ws://192.168.1.5:3000`

## Architecture

```
ghost-hunt/
├── server/
│   └── index.js      ← Node.js + WebSocket server (game logic, ghost AI, 20Hz tick)
├── client/
│   └── index.html    ← Full game client (raycaster, rendering, input)
├── package.json
└── README.md
```

### Server responsibilities
- Authoritative game state
- Ghost AI movement + fear calculation
- Player collision and key/exit detection
- 20Hz broadcast loop
- Chat relay

### Client responsibilities
- Raycasting renderer (DOOM-style)
- Client-side movement prediction
- Sprite rendering (ghost, players, key, exit)
- Minimap
- HUD (battery, fear meter)

## Deploying Online

To host publicly (e.g. on a VPS):

```bash
# Install Node.js, then:
npm install
PORT=3000 node server/index.js
```

Update the client default server URL in `client/index.html`:
```js
const serverUrl = 'ws://YOUR_DOMAIN_OR_IP:3000';
```

For HTTPS/WSS, put behind nginx with SSL.
