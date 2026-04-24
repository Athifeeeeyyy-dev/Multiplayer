# ☠ Ghost Hunt — Multiplayer Horror Game

> **GHOST HUNT** · MULTIPLAYER HORROR GAME  
> *Complete Setup Guide & Documentation*  
> Node.js · WebSockets · HTML5 Canvas Raycaster

---

## 1. Overview

Ghost Hunt is a real-time multiplayer horror game built with a DOOM-style raycasting 3D renderer, Node.js WebSocket server, and an AI-powered ghost. Up to 6 players explore a dark maze together — finding the key, evading the ghost, and racing to escape.

| Feature | Description |
|---|---|
| Renderer | DOOM/Wolfenstein-style raycaster — pure HTML5 Canvas, no WebGL |
| Multiplayer | Real-time WebSocket sync — up to 6 players simultaneously |
| Ghost AI | Server-authoritative; hunts the most-scared player |
| Horror mechanics | Flashlight battery drain, fear meter, vignette, jumpscare |
| Networking | 20 Hz server tick with client-side movement prediction |
| Chat | Built-in in-game chat with `/start` and `/reset` commands |

---

## 2. Prerequisites

Before running Ghost Hunt you need the following software installed on your machine.

### 2.1 Node.js

**Version required:** Node.js 16 or higher (Node 18 LTS recommended)

Check if Node.js is already installed:

```bash
node --version  # Expected output: v18.x.x or higher
npm --version   # Expected output: 9.x.x or higher
```

> **✓ TIP** If you don't have Node.js installed, download it from https://nodejs.org — choose the LTS version. The installer includes npm automatically.

| Operating System | Download URL |
|---|---|
| Windows (64-bit) | https://nodejs.org/en/download → Windows Installer (.msi) |
| macOS | https://nodejs.org/en/download → macOS Installer (.pkg) |
| Ubuntu / Debian | `sudo apt update && sudo apt install nodejs npm` |
| Fedora / RHEL | `sudo dnf install nodejs` |
| Arch Linux | `sudo pacman -S nodejs npm` |

### 2.2 A Modern Web Browser

Any of these browsers work. No plugins or extensions required:

- Google Chrome 90+ *(recommended for best Canvas performance)*
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 15+ (macOS / iOS)

> **⚠ WARNING** Pointer Lock (mouse-look) requires the page to be served over HTTP — it will **NOT** work if you open `index.html` directly as a `file://` URL. Always run the server first.

### 2.3 Network Ports

The server listens on port **3000** by default. Make sure this port is not blocked by a firewall.

| Port | Protocol | Purpose |
|---|---|---|
| 3000 | HTTP | Serves the game client (index.html) |
| 3000 | WebSocket (ws://) | Real-time game data between server and clients |

To use a different port, set the `PORT` environment variable before starting the server:

```bash
PORT=8080 node server/index.js
```

---

## 3. Installation

### 3.1 Extract the ZIP

Unzip the downloaded package to any folder on your machine:

```bash
# macOS / Linux
unzip ghost-hunt-multiplayer.zip
cd ghost-hunt

# Windows
# Right-click the ZIP → 'Extract All...' → open the ghost-hunt folder
```

After extraction the folder structure looks like this:

```
ghost-hunt/
├── server/
│   └── index.js        ← Node.js WebSocket server
├── client/
│   └── index.html      ← Complete game client (single file)
├── package.json        ← Node.js project config & dependencies
├── package-lock.json   ← Exact dependency versions (auto-generated)
└── README.md           ← This guide
```

### 3.2 Install Dependencies

Inside the `ghost-hunt` folder, run:

```bash
npm install

# You should see output similar to:
# added 15 packages in 2s
# found 0 vulnerabilities
```

This installs two packages:

| Package | Version | Purpose |
|---|---|---|
| express | ^4.18.2 | HTTP server — serves the client HTML file |
| ws | ^8.16.0 | WebSocket server — real-time multiplayer sync |

> **ℹ INFO** `npm install` only needs to run once. The `node_modules` folder it creates must stay in the `ghost-hunt` directory alongside `package.json`.

---

## 4. Running the Game

### 4.1 Start the Server

```bash
# From inside the ghost-hunt folder:
npm start

# Expected output:
# ☠  GHOST HUNT SERVER RUNNING
#    http://localhost:3000
#    WebSocket: ws://localhost:3000
#
#    Open the URL in multiple browser tabs to test multiplayer
```

> **⚠ WARNING** Keep this terminal window open while playing. Closing it stops the server and disconnects all players.

### 4.2 Open the Game

1. Open your browser
2. Navigate to `http://localhost:3000`
3. Type your player name in the **Name** field
4. Leave the **Server** field as `ws://localhost:3000` (default)
5. Click **CONNECT**
6. Once connected, click **START GAME** (or type `/start` in chat)

### 4.3 Testing Multiplayer Locally

Open the game URL in multiple browser tabs or windows simultaneously. Each tab acts as a separate player:

```
# Tab 1: http://localhost:3000  → connect as Player1
# Tab 2: http://localhost:3000  → connect as Player2
# Tab 3: http://localhost:3000  → connect as Player3
# ...(up to 6 players)
```

---

## 5. Game Controls

| Key / Input | Action |
|---|---|
| `W` or `↑` | Move forward |
| `S` or `↓` | Move backward |
| `A` | Strafe left |
| `D` | Strafe right |
| `← →` Arrow keys | Turn left / right (when mouse-look is off) |
| `F` | Toggle flashlight on / off |
| Click canvas | Enable mouse-look (pointer lock) |
| `ESC` | Release mouse / disable mouse-look |
| Enter (chat box) | Send chat message |

### 5.1 Chat Commands

| Command | Effect |
|---|---|
| `/start` | Start the game from the lobby |
| `/reset` | Force-reset the game and return to lobby |
| Any other text | Broadcasts message to all players |

---

## 6. How to Play

### 6.1 Objective

**Survive. Find the key. Escape.**

- Find the golden **KEY** — it glows yellow and appears in the centre of the maze
- Pick it up by walking over it
- Reach the green **EXIT** in the top-right corner of the map
- The first player to escape wins the round

> **☠ GHOST WINS** If all players are caught by the ghost before anyone escapes, the ghost wins and the round resets automatically.

### 6.2 Horror Mechanics

| Mechanic | Details |
|---|---|
| Flashlight | Battery drains over time. Toggle with `F`. No battery = near-total darkness. |
| Fear meter | Fills when the ghost is nearby. Reaches 100% = instant death. |
| Ghost visibility | The ghost only appears on the minimap when it is within 8 tiles AND your flashlight is on. |
| Ghost AI | Server hunts the player with the highest fear level. Teleports occasionally in late game. |
| Vignette | Red border darkens as fear increases — a visual danger warning. |
| Film grain | Random scanlines add atmosphere and visual noise. |

---

## 7. LAN Multiplayer (Same Network)

Players on the same Wi-Fi or wired network can connect to your machine.

### 7.1 Find Your Local IP Address

```bash
# macOS / Linux:
ifconfig | grep 'inet '
# Look for a line like: inet 192.168.1.XX

# Windows (Command Prompt):
ipconfig
# Look for: IPv4 Address . . . . : 192.168.1.XX
```

### 7.2 Share the Address

Tell other players to open their browser and go to:

```
http://YOUR_LOCAL_IP:3000
# Example: http://192.168.1.42:3000
```

In the **Server** field of the lobby they should enter:

```
ws://YOUR_LOCAL_IP:3000
# Example: ws://192.168.1.42:3000
```

> **⚠ FIREWALL** Make sure Windows Firewall / macOS Firewall / iptables allow incoming connections on port 3000. You may need to add an exception.

---

## 8. Hosting Online (Internet Play)

To let friends outside your network join, deploy the server to a cloud VPS or hosting platform.

### 8.1 Requirements

- A VPS with Node.js 16+ installed (e.g. DigitalOcean Droplet, AWS EC2, Linode)
- A public IP address or domain name
- Port 3000 (or your chosen port) open in the server's firewall / security group

### 8.2 Deploy Steps

```bash
# 1. Upload files to your server (example using scp)
scp -r ghost-hunt/ user@YOUR_SERVER_IP:~/ghost-hunt

# 2. SSH into your server
ssh user@YOUR_SERVER_IP

# 3. Install dependencies
cd ghost-hunt && npm install

# 4. Start with a process manager (keeps it running after logout)
npm install -g pm2
pm2 start server/index.js --name ghost-hunt
pm2 save

# 5. View logs
pm2 logs ghost-hunt
```

### 8.3 Update Client Server URL

Edit `client/index.html` and change the default server URL so players don't have to type it manually:

```js
// Find this line in client/index.html (~line 180):
const serverUrl = document.getElementById('server-input').value.trim() || 'ws://localhost:3000';

// Change the fallback to your public IP or domain:
const serverUrl = document.getElementById('server-input').value.trim() || 'ws://YOUR_IP_OR_DOMAIN:3000';
```

### 8.4 HTTPS / WSS (Secure WebSocket)

If your domain uses HTTPS, you must use WSS (secure WebSockets). Set up an nginx reverse proxy:

```nginx
# nginx config snippet (/etc/nginx/sites-available/ghost-hunt)
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

Then update the client to use `wss://` instead of `ws://`.

---

## 9. Architecture

### 9.1 File Structure

| File | Description |
|---|---|
| `server/index.js` | Node.js server — game authority, ghost AI, WebSocket handler, 20 Hz tick loop |
| `client/index.html` | Complete game client — raycaster, rendering, input, HUD, chat lobby |
| `package.json` | Project metadata and dependency list |

### 9.2 Server Responsibilities

- **Authoritative game state** — all positions, key/exit status, ghost location
- **Ghost AI** — moves ghost toward highest-fear player every 50 ms
- **Collision detection** — validates every player move before accepting it
- **Fear calculation** — updates per player based on distance to ghost
- **Chat relay** — broadcasts messages with player name and colour
- **Round management** — detects win/loss conditions, resets after 10 seconds
- **Client sync** — broadcasts full state to all players at 20 Hz

### 9.3 Client Responsibilities

- **Raycasting engine** — casts one ray per screen column, draws walls, floor, ceiling
- **Sprite rendering** — ghost, other players, key, exit rendered as billboarded ellipses
- **Client-side movement prediction** — instant response to WASD; server corrects drift
- **HUD** — battery bar, fear bar, objective text, AI status
- **Minimap** — overhead 20×20 grid with player, ghost, key, exit markers
- **Lobby UI** — name input, server URL, player list, start button
- **Chat overlay** — real-time broadcast with colour-coded player names

### 9.4 WebSocket Message Types

| Message type | Direction | Payload |
|---|---|---|
| `welcome` | Server → Client | Player ID, full map array |
| `state` | Server → Client | Full game state (all players, ghost, key, exit, phase) |
| `move` | Client → Server | x, y, angle, flashlight, battery |
| `setname` | Client → Server | Desired display name |
| `start` | Client → Server | Request to start game from lobby |
| `chat` | Both | name, msg, optional color |
| `player_caught` | Server → Client | Caught player's ID and name |
| `key_collected` | Server → Client | Name of player who grabbed the key |
| `ghost_event` | Server → Client | Event type (e.g. `'teleport'`) |

---

## 10. Troubleshooting

| Problem | Solution |
|---|---|
| `'Cannot find module ws'` | Run `npm install` inside the `ghost-hunt` folder |
| Port 3000 already in use | Kill the process using it, or run `PORT=3001 npm start` |
| Mouse-look doesn't work | Open the game via `http://localhost:3000` — not as a `file://` URL |
| Can't connect from another device | Check your firewall — allow inbound TCP on port 3000 |
| Ghost not moving | Wait 15 seconds — ghost is dormant at game start, then awakens |
| Players see each other in wrong positions | Network lag is normal. Movement uses client-side prediction. |
| White screen on load | Check browser console (F12) for errors. Usually a JS parse error. |
| `'EADDRINUSE'` error on start | Another server instance is running. Kill it: `pkill -f 'node server'` |

---

## 11. Customisation

### 11.1 Change the Map

Edit the `MAP` array in both `server/index.js` and `client/index.html`. `1` = wall, `0` = floor. The grid must stay 20×20.

### 11.2 Adjust Ghost Behaviour

In `server/index.js`, find the `updateGhost()` function. Key values to tweak:

```js
const speed = 0.018 * dt * 60;          // Ghost movement speed — increase for faster ghost
ghostThinkTimer > 3                      // Seconds between AI target decisions — lower = more reactive
elapsed > 15                             // Seconds before ghost awakens — increase for a grace period
elapsed > 60 && Math.random() < 0.001   // Teleport probability after 60s
```

### 11.3 Fear & Battery Settings

In `client/index.html`, find `updateMovement()`:

```js
lp.battery = Math.max(0, lp.battery - 1.8 * dt);  // Battery drain rate
```

In `server/index.js`, find the fear update in `updateGhost()`:

```js
if (d < 4)  p.fear = Math.min(100, p.fear + 30 * dt);   // Fast fear buildup when very close
else if (d < 7) p.fear = Math.min(100, p.fear + 10 * dt); // Slow buildup when nearby
else p.fear = Math.max(0, p.fear - 6 * dt);               // Fear slowly drains when ghost is far
```

### 11.4 Adding Claude AI to the Ghost

The original Claude-powered ghost from the in-browser demo can be integrated into the server. Add the following to `server/index.js`:

```js
const https = require('https');

async function askClaude(gameContext) {
  // Call Anthropic API with ghost decision prompt
  // Set ANTHROPIC_API_KEY env variable before starting server
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // ... fetch to https://api.anthropic.com/v1/messages
  // Returns: { action: 'hunt'|'patrol'|'teleport', reason: string }
}
```

> **✓ TIP** Set your API key: `export ANTHROPIC_API_KEY=sk-ant-...` before running `npm start`

---

## 12. Quick Reference

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Start server (default port 3000) | `npm start` |
| Start on custom port | `PORT=8080 node server/index.js` |
| Open game in browser | `http://localhost:3000` |
| Connect from LAN device | `ws://YOUR_LOCAL_IP:3000` |
| Start with PM2 (production) | `pm2 start server/index.js --name ghost-hunt` |
| View server logs (PM2) | `pm2 logs ghost-hunt` |
| Stop server (PM2) | `pm2 stop ghost-hunt` |
| Kill process on port 3000 (Linux/Mac) | `kill $(lsof -ti:3000)` |

---

*☠  Built with Node.js · ws · HTML5 Canvas  ☠*
