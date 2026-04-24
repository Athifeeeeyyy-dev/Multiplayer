/**
 * GHOST HUNT - Multiplayer Horror Game Server
 * Node.js + WebSocket (ws) + Express static file serving
 * Run: node server/index.js
 * Then open: http://localhost:3000
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve the client files from /client folder
app.use(express.static(path.join(__dirname, '../client')));

const PORT = process.env.PORT || 3000;

// ─── MAP DEFINITION ───────────────────────────────────────────────────────────
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

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let gameState = {
  phase: 'lobby',   // lobby | playing | ended
  players: {},      // id -> player obj
  ghost: { x: 18.5, y: 18.5, mode: 'dormant', angle: 0 },
  key: { x: 10.5, y: 10.5, collected: false, collectedBy: null },
  exit: { x: 18.5, y: 1.5 },
  winner: null,
  startTime: null
};

// Spawn positions for players
const SPAWNS = [
  { x: 1.5, y: 1.5 },
  { x: 1.5, y: 3.5 },
  { x: 3.5, y: 1.5 },
  { x: 3.5, y: 3.5 },
  { x: 1.5, y: 5.5 },
  { x: 5.5, y: 1.5 }
];

let spawnIndex = 0;
let clientIdCounter = 0;

// ─── UTILITY ──────────────────────────────────────────────────────────────────
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
    if (client.readyState === WebSocket.OPEN && client.playerId !== exceptId) {
      client.send(msg);
    }
  });
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function getPublicState() {
  return {
    type: 'state',
    phase: gameState.phase,
    players: gameState.players,
    ghost: gameState.ghost,
    key: gameState.key,
    exit: gameState.exit,
    winner: gameState.winner
  };
}

// ─── GHOST AI ─────────────────────────────────────────────────────────────────
let ghostThinkTimer = 0;
let ghostTarget = null;

function updateGhost(dt) {
  if (gameState.phase !== 'playing') return;

  const g = gameState.ghost;
  const playerList = Object.values(gameState.players).filter(p => p.alive);
  if (playerList.length === 0) return;

  ghostThinkTimer += dt;

  // Pick a target player every few seconds
  if (ghostThinkTimer > 3) {
    ghostThinkTimer = 0;

    // Find closest player or random if dormant
    const fearPlayers = playerList.sort((a, b) => b.fear - a.fear);
    ghostTarget = fearPlayers[0]; // Hunt most scared player

    // Ghost awakens when any player gets close enough or time passes
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    if (g.mode === 'dormant' && elapsed > 15) g.mode = 'hunt';
    if (g.mode === 'dormant') {
      for (const p of playerList) {
        if (dist(p.x, p.y, g.x, g.y) < 8) { g.mode = 'hunt'; break; }
      }
    }
  }

  if (g.mode === 'dormant') return;

  // Move ghost toward target
  if (ghostTarget && gameState.players[ghostTarget.id]?.alive) {
    const target = gameState.players[ghostTarget.id];
    const dx = target.x - g.x, dy = target.y - g.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const speed = 0.018 * dt * 60;

    if (d > 0.5) {
      const nx = g.x + (dx / d) * speed;
      const ny = g.y + (dy / d) * speed;

      if (!isWall(nx, g.y)) g.x = nx;
      else if (!isWall(g.x, ny)) g.y = ny;
      else {
        // Steer around walls
        const steerAngles = [0.4, -0.4, 0.8, -0.8, Math.PI / 2, -Math.PI / 2];
        const baseAngle = Math.atan2(dy, dx);
        for (const a of steerAngles) {
          const ra = baseAngle + a;
          const gx2 = g.x + Math.cos(ra) * speed;
          const gy2 = g.y + Math.sin(ra) * speed;
          if (!isWall(gx2, g.y)) { g.x = gx2; break; }
          if (!isWall(g.x, gy2)) { g.y = gy2; break; }
        }
      }
      g.angle = Math.atan2(dy, dx);
    }

    // Occasional teleport when ghost is very agitated
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    if (elapsed > 60 && Math.random() < 0.001) {
      const tx = target.x + (Math.random() - 0.5) * 3;
      const ty = target.y + (Math.random() - 0.5) * 3;
      if (!isWall(tx, ty)) { g.x = tx; g.y = ty; }
      broadcast({ type: 'ghost_event', event: 'teleport' });
    }
  }

  // Update fear for all players and check catches
  for (const p of playerList) {
    const d = dist(p.x, p.y, g.x, g.y);
    if (d < 4) p.fear = Math.min(100, p.fear + 30 * dt);
    else if (d < 7) p.fear = Math.min(100, p.fear + 10 * dt);
    else p.fear = Math.max(0, p.fear - 6 * dt);

    if (d < 0.8) {
      // Ghost catches player
      p.alive = false;
      broadcast({ type: 'player_caught', id: p.id, name: p.name });
      checkEndCondition();
    }
  }
}

function checkEndCondition() {
  const alivePlayers = Object.values(gameState.players).filter(p => p.alive);
  if (alivePlayers.length === 0) {
    endGame('ghost');
  }
}

function endGame(result, winnerId = null) {
  gameState.phase = 'ended';
  gameState.winner = result === 'escape' ? gameState.players[winnerId]?.name : 'ghost';
  broadcast(getPublicState());
  // Reset after 10 seconds
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
    gameState.players[id].x = spawn.x;
    gameState.players[id].y = spawn.y;
    gameState.players[id].alive = true;
    gameState.players[id].fear = 0;
    gameState.players[id].hasKey = false;
    gameState.players[id].angle = 0;
  }
  broadcast(getPublicState());
  broadcast({ type: 'chat', name: 'SYSTEM', msg: 'Game reset. Type /start to begin.' });
}

function startGame() {
  if (Object.keys(gameState.players).length === 0) return;
  gameState.phase = 'playing';
  gameState.startTime = Date.now();
  gameState.ghost.mode = 'dormant';
  broadcast(getPublicState());
  broadcast({ type: 'chat', name: 'SYSTEM', msg: '☠ GAME STARTED — Find the key and escape!' });
}

// ─── WEBSOCKET HANDLERS ───────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  const id = `p${++clientIdCounter}`;
  ws.playerId = id;

  const spawn = SPAWNS[spawnIndex++ % SPAWNS.length];
  gameState.players[id] = {
    id,
    name: `Player${clientIdCounter}`,
    x: spawn.x,
    y: spawn.y,
    angle: 0,
    fear: 0,
    alive: true,
    hasKey: false,
    flashlight: true,
    battery: 100,
    color: `hsl(${(clientIdCounter * 60) % 360},80%,60%)`
  };

  // Send full state to new player
  send(ws, { type: 'welcome', id, map: MAP });
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
            player.x = msg.x;
            player.y = msg.y;
            player.angle = msg.angle;
            player.flashlight = msg.flashlight;
            player.battery = msg.battery;
          }
          // Key pickup
          if (!gameState.key.collected && dist(player.x, player.y, gameState.key.x, gameState.key.y) < 0.7) {
            gameState.key.collected = true;
            gameState.key.collectedBy = id;
            player.hasKey = true;
            broadcast({ type: 'key_collected', by: player.name });
          }
          // Exit reached
          if (player.hasKey && dist(player.x, player.y, gameState.exit.x, gameState.exit.y) < 0.9) {
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
    broadcast({ type: 'chat', name: 'SYSTEM', msg: `${name} disconnected.` });
    broadcast(getPublicState());
    if (gameState.phase === 'playing') checkEndCondition();
  });
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
}, 50); // 20 Hz server tick

server.listen(PORT, () => {
  console.log(`\n☠  GHOST HUNT SERVER RUNNING`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`\n   Open the URL in multiple browser tabs to test multiplayer\n`);
});
