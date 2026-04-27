/**
 * GHOST HUNT - Multiplayer Horror Game Server
 * ─────────────────────────────────────────────────────────────────────────────
 * LAN-READY VERSION — works across all devices on the same Wi-Fi network.
 *
 * Run:   node server.js
 * Then open http://<YOUR-LAN-IP>:3000 on any device on your network.
 *
 * The server auto-detects your LAN IP and prints it on startup.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');
const path      = require('path');
const os        = require('os');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

// ─── LAN IP DETECTION ────────────────────────────────────────────────────────
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}
const LAN_IP = getLanIP();
const PORT   = process.env.PORT || 3000;

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

// ─── SERVER INFO ENDPOINT ─────────────────────────────────────────────────────
app.get('/info', (req, res) => {
  res.json({ lanIp: LAN_IP, port: PORT, wsUrl: `ws://${LAN_IP}:${PORT}` });
});

// ─── MAP DEFINITION ──────────────────────────────────────────────────────────
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,0,1,1,1,0,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,1,1,1,0,0,1,1,0,0,0,1,0,0,0,1],
  [1,0,1,0,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1],
  [1,0,1,1,1,0,0,0,0,1,0,1,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,0,0,0,1,0,0,0,1,0,1,1,0,1],
  [1,0,0,1,0,1,1,1,0,1,1,1,0,1,1,0,0,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,1,0,0,0,1,0,0,0,1,0,1,1,0,1,1],
  [1,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,1,0,0,1],
  [1,0,1,1,0,0,0,1,0,0,0,1,1,0,1,0,0,1,0,1],
  [1,0,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,0,0,1,1,1,0,0,1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// ─── GAME STATE ──────────────────────────────────────────────────────────────
let gameState = {
  phase: 'lobby',
  players: {},
  ghost: { x: 18.5, y: 18.5, mode: 'dormant', angle: 0 },
  key: { x: 10.5, y: 10.5, collected: false, collectedBy: null },
  exit: { x: 18.5, y: 1.5 },
  winner: null,
  startTime: null
};

const SPAWNS = [
  { x: 1.5, y: 1.5 }, { x: 1.5, y: 3.5 },
  { x: 3.5, y: 1.5 }, { x: 3.5, y: 3.5 },
  { x: 1.5, y: 5.5 }, { x: 5.5, y: 1.5 }
];
let spawnIndex = 0;
let clientIdCounter = 0;

// ─── UTILITY ─────────────────────────────────────────────────────────────────
function isWall(x, y) {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= 20 || my >= 20) return true;
  return MAP[my][mx] === 1;
}
function dist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}
function broadcast(data, exceptId = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.playerId !== exceptId)
      client.send(msg);
  });
}
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function getPublicState() {
  return {
    type: 'state', phase: gameState.phase, players: gameState.players,
    ghost: gameState.ghost, key: gameState.key,
    exit: gameState.exit, winner: gameState.winner
  };
}

// ─── GHOST AI ────────────────────────────────────────────────────────────────
let ghostThinkTimer = 0;
let ghostTarget = null;

function updateGhost(dt) {
  if (gameState.phase !== 'playing') return;
  const g = gameState.ghost;
  const playerList = Object.values(gameState.players).filter(p => p.alive);
  if (playerList.length === 0) return;
  ghostThinkTimer += dt;
  if (ghostThinkTimer > 3) {
    ghostThinkTimer = 0;
    const fearPlayers = [...playerList].sort((a, b) => b.fear - a.fear);
    ghostTarget = fearPlayers[0];
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    if (g.mode === 'dormant' && elapsed > 15) g.mode = 'hunt';
    if (g.mode === 'dormant') {
      for (const p of playerList) {
        if (dist(p.x, p.y, g.x, g.y) < 8) { g.mode = 'hunt'; break; }
      }
    }
  }
  if (g.mode === 'dormant') return;
  if (ghostTarget && gameState.players[ghostTarget.id]?.alive) {
    const target = gameState.players[ghostTarget.id];
    const dx = target.x - g.x, dy = target.y - g.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const spd = 0.018 * dt * 60;
    if (d > 0.5) {
      const nx = g.x + (dx / d) * spd;
      const ny = g.y + (dy / d) * spd;
      if (!isWall(nx, g.y)) g.x = nx;
      else if (!isWall(g.x, ny)) g.y = ny;
      else {
        const steerAngles = [0.4, -0.4, 0.8, -0.8, Math.PI / 2, -Math.PI / 2];
        const baseAngle = Math.atan2(dy, dx);
        for (const a of steerAngles) {
          const ra = baseAngle + a;
          const gx2 = g.x + Math.cos(ra) * spd;
          const gy2 = g.y + Math.sin(ra) * spd;
          if (!isWall(gx2, g.y)) { g.x = gx2; break; }
          if (!isWall(g.x, gy2)) { g.y = gy2; break; }
        }
      }
      g.angle = Math.atan2(dy, dx);
    }
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    if (elapsed > 60 && Math.random() < 0.001) {
      const tx = target.x + (Math.random() - 0.5) * 3;
      const ty = target.y + (Math.random() - 0.5) * 3;
      if (!isWall(tx, ty)) { g.x = tx; g.y = ty; }
      broadcast({ type: 'ghost_event', event: 'teleport' });
    }
  }
  for (const p of playerList) {
    const d = dist(p.x, p.y, g.x, g.y);
    if (d < 4)      p.fear = Math.min(100, p.fear + 30 * dt);
    else if (d < 7) p.fear = Math.min(100, p.fear + 10 * dt);
    else            p.fear = Math.max(0,   p.fear - 6  * dt);
    if (d < 0.8) {
      p.alive = false;
      broadcast({ type: 'player_caught', id: p.id, name: p.name });
      checkEndCondition();
    }
  }
}

function checkEndCondition() {
  if (Object.values(gameState.players).filter(p => p.alive).length === 0)
    endGame('ghost');
}
function endGame(result, winnerId = null) {
  gameState.phase = 'ended';
  gameState.winner = result === 'escape' ? gameState.players[winnerId]?.name : 'ghost';
  broadcast(getPublicState());
  setTimeout(resetGame, 10000);
}
function resetGame() {
  spawnIndex = 0;
  gameState.phase = 'lobby';
  gameState.ghost = { x: 18.5, y: 18.5, mode: 'dormant', angle: 0 };
  gameState.key = { x: 10.5, y: 10.5, collected: false, collectedBy: null };
  gameState.winner = null;
  gameState.startTime = null;
  for (const id in gameState.players) {
    const spawn = SPAWNS[spawnIndex++ % SPAWNS.length];
    Object.assign(gameState.players[id], {
      x: spawn.x, y: spawn.y, alive: true, fear: 0, hasKey: false, angle: 0
    });
  }
  broadcast(getPublicState());
  broadcast({ type: 'chat', name: 'SYSTEM', msg: 'Game reset. Press START GAME or type /start.' });
}
function startGame() {
  if (Object.keys(gameState.players).length === 0) return;
  gameState.phase = 'playing';
  gameState.startTime = Date.now();
  gameState.ghost.mode = 'dormant';
  broadcast(getPublicState());
  broadcast({ type: 'chat', name: 'SYSTEM', msg: '☠ GAME STARTED — Find the key and escape!' });
}

// ─── WEBSOCKET ───────────────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const id = `p${++clientIdCounter}`;
  ws.playerId = id;
  const spawn = SPAWNS[spawnIndex++ % SPAWNS.length];
  const remoteIp = req.socket.remoteAddress;

  gameState.players[id] = {
    id, name: `Player${clientIdCounter}`,
    x: spawn.x, y: spawn.y, angle: 0, fear: 0,
    alive: true, hasKey: false, flashlight: true, battery: 100,
    color: `hsl(${(clientIdCounter * 60) % 360},80%,60%)`
  };

  console.log(`[+] ${gameState.players[id].name} connected from ${remoteIp}`);
  send(ws, { type: 'welcome', id, map: MAP, lanIp: LAN_IP, port: PORT });
  send(ws, getPublicState());
  broadcast({ type: 'chat', name: 'SYSTEM', msg: `${gameState.players[id].name} joined. Players: ${Object.keys(gameState.players).length}` });
  broadcast(getPublicState(), id);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const player = gameState.players[id];
    if (!player) return;
    switch (msg.type) {
      case 'move':
        if (gameState.phase === 'playing' && player.alive) {
          if (!isWall(msg.x, msg.y)) {
            player.x = msg.x; player.y = msg.y;
            player.angle = msg.angle;
            player.flashlight = msg.flashlight;
            player.battery = msg.battery;
          }
          if (!gameState.key.collected &&
              dist(player.x, player.y, gameState.key.x, gameState.key.y) < 0.7) {
            gameState.key.collected = true;
            gameState.key.collectedBy = id;
            player.hasKey = true;
            broadcast({ type: 'key_collected', by: player.name });
          }
          if (player.hasKey &&
              dist(player.x, player.y, gameState.exit.x, gameState.exit.y) < 0.9) {
            endGame('escape', id);
          }
        }
        break;
      case 'setname':
        if (msg.name && msg.name.length <= 16) {
          const old = player.name;
          player.name = msg.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || player.name;
          broadcast({ type: 'chat', name: 'SYSTEM', msg: `${old} is now ${player.name}` });
        }
        break;
      case 'chat':
        if (msg.msg && msg.msg.length <= 120) {
          if (msg.msg === '/start' && gameState.phase === 'lobby') startGame();
          else if (msg.msg === '/reset') resetGame();
          else broadcast({ type: 'chat', name: player.name, msg: msg.msg, color: player.color });
        }
        break;
      case 'start':
        if (gameState.phase === 'lobby') startGame();
        break;
    }
    broadcast(getPublicState());
  });

  ws.on('close', () => {
    const name = gameState.players[id]?.name;
    delete gameState.players[id];
    console.log(`[-] ${name} disconnected`);
    broadcast({ type: 'chat', name: 'SYSTEM', msg: `${name} disconnected.` });
    broadcast(getPublicState());
    if (gameState.phase === 'playing') checkEndCondition();
  });

  ws.on('error', (err) => console.error(`[!] Error for ${id}:`, err.message));
});

// ─── GAME LOOP ────────────────────────────────────────────────────────────────
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - lastTick) / 1000, 0.1);
  lastTick = now;
  if (gameState.phase === 'playing') {
    updateGhost(dt);
    broadcast(getPublicState());
  }
}, 50);

// ─── START ───────────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so ALL network interfaces are reachable (not just localhost)
server.listen(PORT, '0.0.0.0', () => {
  const line = '─'.repeat(54);
  console.log(`\n${line}`);
  console.log(`  ☠  GHOST HUNT — LAN MULTIPLAYER SERVER`);
  console.log(line);
  console.log(`  Local (this machine)  →  http://localhost:${PORT}`);
  console.log(`  LAN  (other devices)  →  http://${LAN_IP}:${PORT}`);
  console.log(`  WebSocket             →  ws://${LAN_IP}:${PORT}`);
  console.log(line);
  console.log(`  Share the LAN address with friends on the same Wi-Fi.`);
  console.log(`  They open it in any modern browser — no install needed.\n`);
});