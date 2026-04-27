# ☠ Ghost Hunt — LAN Multiplayer Horror Game

> **GHOST HUNT** · LAN MULTIPLAYER HORROR  
> *Complete Setup & Network Guide*  
> Node.js · WebSockets · HTML5 Canvas Raycaster

---

## What's New in This Version

| Change | Details |
|---|---|
| **LAN binding** | Server now listens on `0.0.0.0` (all interfaces), not just `127.0.0.1` |
| **IP auto-detection** | Server detects its own LAN IP and prints it on startup |
| **`/info` endpoint** | `GET /info` returns the LAN IP so the client pre-fills the WebSocket URL |
| **Auto-fill in browser** | Clients connecting from other devices get the correct `ws://` URL automatically |
| **LAN URL banner** | Lobby shows a shareable URL for friends to join |
| **Better console logs** | Shows which IPs are connecting and disconnecting |

---

## 1. Prerequisites

### Node.js (required)

Check if you already have it:

```bash
node --version   # must be v16 or higher
npm --version
```

If not installed, download from **https://nodejs.org** (choose the LTS version).

| OS | Install method |
|---|---|
| Windows | Download the `.msi` installer from nodejs.org |
| macOS | Download the `.pkg` installer, or `brew install node` |
| Ubuntu/Debian | `sudo apt update && sudo apt install nodejs npm` |
| Arch | `sudo pacman -S nodejs npm` |

### A modern browser (on every device)

Chrome, Firefox, Edge, or Safari — any recent version works. No extension or plugin needed.

---

## 2. Installation

### Step 1 — Download/clone the project

If you cloned from GitHub:

```bash
git clone https://github.com/Athifeeeeyyy-dev/Multiplayer_horror_game.git
cd Multiplayer_horror_game
```

Or if you have the zip, extract it and open a terminal inside the folder.

### Step 2 — Install dependencies

```bash
npm install express ws
```

That's it. Only two packages needed.

---

## 3. Starting the Server

Run this from inside the project folder:

```bash
node server.js
```

You will see output like this:

```
──────────────────────────────────────────────────────
  ☠  GHOST HUNT — LAN MULTIPLAYER SERVER
──────────────────────────────────────────────────────
  Local (this machine)  →  http://localhost:3000
  LAN  (other devices)  →  http://192.168.1.42:3000
  WebSocket             →  ws://192.168.1.42:3000
──────────────────────────────────────────────────────
  Share the LAN address with friends on the same Wi-Fi.
  They open it in any modern browser — no install needed.
```

The **LAN address** (e.g. `http://192.168.1.42:3000`) is what you share with other players.

> **Keep this terminal open while playing.** Closing it stops the server.

---

## 4. Connecting from Other Devices on the Same Wi-Fi

### On the host machine (the one running `node server.js`)

Open: `http://localhost:3000`

### On every other device (phones, laptops, tablets)

Open the **LAN address** shown in the terminal, e.g.:

```
http://192.168.1.42:3000
```

Type this directly into the browser's address bar — **not** a search engine.

The lobby will auto-detect the server and pre-fill the WebSocket URL. Just type a name and press **CONNECT**.

---

## 5. Finding Your LAN IP Manually

The server prints it automatically, but if you need to find it yourself:

**Windows:**

```cmd
ipconfig
```
Look for `IPv4 Address` under your Wi-Fi adapter. Example: `192.168.1.42`

**macOS:**

```bash
ipconfig getifaddr en0
```
(Use `en1` if en0 gives nothing — it depends on whether you're on Wi-Fi or Ethernet.)

**Linux:**

```bash
ip addr show
# or
hostname -I
```

Look for an address starting with `192.168.x.x` or `10.x.x.x`.

---

## 6. Firewall Troubleshooting

If other devices can't connect, your firewall may be blocking port 3000.

### Windows Firewall

1. Open **Windows Defender Firewall** → **Advanced Settings**
2. **Inbound Rules** → **New Rule**
3. Rule type: **Port** → TCP → port `3000`
4. Action: **Allow the connection**
5. Profile: check **Private** (and Domain if needed)
6. Give it a name like "Ghost Hunt"

Or quickly via PowerShell (run as Administrator):

```powershell
New-NetFirewallRule -DisplayName "Ghost Hunt" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### macOS

macOS usually allows Node.js through automatically. If prompted, click **Allow**.

If not, go to **System Settings → Network → Firewall → Options** and add Node.js.

### Linux (ufw)

```bash
sudo ufw allow 3000/tcp
```

---

## 7. Network Requirements

| Requirement | Details |
|---|---|
| Same Wi-Fi network | All players must be on the same router/access point |
| No VPN | VPNs can route traffic through different subnets — disable them |
| No guest network isolation | Some routers isolate guest network clients — use the main network |
| Router AP isolation | If devices can't see each other, check if "AP Isolation" is on in your router settings and disable it |

---

## 8. How to Play

### Controls

| Key | Action |
|---|---|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `D` | Strafe left / right |
| `←` `→` | Rotate (without mouse lock) |
| Mouse | Look around (click canvas to lock mouse) |
| `F` | Toggle flashlight |
| `ESC` | Release mouse lock |
| `Enter` (in chat) | Send chat message |

### Objective

1. Find the **yellow key** in the maze
2. Collect it by walking over it
3. Reach the **green exit door** (top-right of map)
4. Escape before the ghost catches you

### Chat commands

| Command | Effect |
|---|---|
| `/start` | Start the game from the lobby |
| `/reset` | Reset the game back to lobby |

### Ghost behaviour

- Starts dormant for the first 15 seconds
- Wakes up if a player gets within 8 tiles
- Hunts the player with the highest fear level
- Fear increases when the ghost is nearby; drops slowly when far
- After 60 seconds the ghost may teleport near a target

---

## 9. Running on a Custom Port

```bash
PORT=8080 node server.js
```

Then use `http://<LAN-IP>:8080` on other devices.

---

## 10. File Structure

```
Multiplayer_horror_game/
├── server.js      ← Node.js server (run this)
├── index.html     ← Game client (served automatically)
├── README.md      ← This file
└── package.json   ← (after npm install)
```

---

## 11. Common Issues

| Problem | Fix |
|---|---|
| "Connection failed" on other devices | Check firewall (Section 6), confirm same Wi-Fi |
| Browser shows "This site can't be reached" | Make sure `node server.js` is still running |
| IP address changed | Stop and restart server; it re-detects your LAN IP on startup |
| "ws://" field shows localhost on other devices | The `/info` auto-detect should fix this; if not, manually type `ws://192.168.x.x:3000` |
| Game lags | Close other tabs; the raycaster is CPU-intensive |
| Screen too small on phone | Rotate to landscape mode |

---

*Built with Node.js, ws, Express, and vanilla HTML5 Canvas — no frameworks, no build step.*