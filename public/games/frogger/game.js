"use strict";
// FROGGER para Arcade Vault: la rana salta celda a celda, cruza la carretera y el
// río y llena las 5 bocas de arriba. Protocolo av:* de la plantilla de /add-game.
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
// Tablero: franja de HUD de 40 px arriba y 16×14 celdas de 40 px centradas debajo.
const COLS = 16,
  ROWS = 14,
  CELL = 40,
  HUD_H = 40,
  BOARD_X = 80;
const BOARD_W = COLS * CELL;
const ROW_GOALS = 0,
  ROW_RIVER_TOP = 1,
  ROW_RIVER_BOT = 6,
  ROW_SAFE_MID = 7,
  ROW_ROAD_TOP = 8,
  ROW_ROAD_BOT = 12,
  ROW_START = 13;
const START_COL = 7;
const GOAL_COLS = [1, 4, 7, 10, 13]; // cada boca ocupa col y col + 1
const JUMP_MS = 120;
const DEATH_S = 0.6;
// Tortugas que bucean: 3 s visibles (el último 0,5 s de aviso) y 1,5 s bajo el agua.
const DIVE_UP = 3,
  DIVE_WARN = 0.5,
  DIVE_CYCLE = 4.5;
const roundTime = () => Math.max(8, 15 - (level - 1)); // s
const speedMul = (lvl) => Math.pow(1.15, lvl - 1);
const FONT = '"Press Start 2P", monospace';
// Paleta del tema neón del Vault (app/globals.css). El iframe no ve las variables CSS.
const C = {
  bg: "#0a0a0f",
  hud: "#0f0f1a",
  ink: "#e6e9ff",
  inkDim: "#8a8fb5",
  score: "#00f5ff",
  levelInk: "#f5ff00",
  side: "#07070c",
  sideLine: "rgba(0, 245, 255, 0.35)",
  sideHatch: "rgba(0, 255, 136, 0.07)",
  hedge: "#06301c",
  hedgeDot: "rgba(0, 255, 136, 0.22)",
  goal: "#03120b",
  goalRim: "#f5ff00",
  river: "#04182c",
  ripple: "rgba(0, 245, 255, 0.16)",
  safe: "#0b2416",
  safeDot: "rgba(0, 255, 136, 0.25)",
  curb: "rgba(0, 255, 136, 0.55)",
  road: "#11111a",
  roadEdge: "rgba(0, 245, 255, 0.6)",
  laneDash: "rgba(245, 255, 0, 0.3)",
  log: "#c8742a",
  logTop: "#ff9a3c",
  logVein: "rgba(60, 25, 5, 0.55)",
  turtle: "#ff006e",
  turtleShell: "#8a003c",
  turtleSub: "rgba(255, 0, 110, 0.35)",
  car: "#f5ff00",
  car2: "#ff006e",
  racer: "#00f5ff",
  truck: "#8a8fb5",
  truckCab: "#00f5ff",
  window: "#0a0a0f",
  wheel: "#2a2d40",
  light: "#fffbe0",
  frog: "#00ff88",
  frogDark: "#0a7a4e",
  eye: "#ffffff",
  pupil: "#0a0a0f",
  splat: "#ff006e",
  timeOk: "#00ff88",
  timeMid: "#f5ff00",
  timeLow: "#ff006e",
  timeTrack: "rgba(138, 143, 181, 0.2)",
  overlay: "rgba(10, 10, 15, 0.75)",
  title: "#ff006e",
};
// Carriles a velocidad de nivel 1 (px/s). Cada nivel la multiplica por 1,15.
const LANE_DEFS = [
  { row: 1, type: "log", width: 4, dir: 1, speed: 80, count: 3 },
  {
    row: 2,
    type: "turtle",
    width: 2,
    dir: -1,
    speed: 100,
    count: 4,
    dives: true,
  },
  { row: 3, type: "log", width: 3, dir: 1, speed: 140, count: 3 },
  { row: 4, type: "log", width: 2, dir: 1, speed: 60, count: 4 },
  {
    row: 5,
    type: "turtle",
    width: 3,
    dir: -1,
    speed: 70,
    count: 3,
    dives: true,
  },
  { row: 6, type: "log", width: 3, dir: 1, speed: 110, count: 3 },
  { row: 8, type: "truck", width: 3, dir: -1, speed: 90, count: 2 },
  { row: 9, type: "racer", width: 1, dir: 1, speed: 240, count: 2 },
  { row: 10, type: "car", width: 1, dir: -1, speed: 120, count: 4 },
  { row: 11, type: "truck", width: 2, dir: 1, speed: 100, count: 3 },
  { row: 12, type: "car", width: 1, dir: -1, speed: 150, count: 4 },
];
const isRiver = (row) => row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT;
const isRoad = (row) => row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT;
const cellX = (col) => BOARD_X + col * CELL;
const cellY = (row) => HUD_H + row * CELL;
const MAX_SCORE = 10000000; // límite de la tabla leaderboard (SPEC 06)
// ── Estado ───────────────────────────────────────────────────────────────────
let state; // 'playing' | 'dying' | 'gameover'
let score, lives, level, timer, clock, deathT, bestRow;
let lanes, goals, frog, pendingDir;
let lastTime = null;
// ── Entrada ──────────────────────────────────────────────────────────────────
const GAME_KEYS = [
  "Space",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
];
const DIR_OF = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};
document.addEventListener("keydown", (e) => {
  // Evita que Espacio, las flechas y WASD hagan scroll en la página.
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  if (e.repeat) return; // un salto por pulsación
  if (!EMBEDDED && e.code === "KeyP" && state !== "gameover") {
    paused = !paused;
    lastTime = null;
    pendingDir = null;
    return;
  }
  if (!EMBEDDED && e.code === "Space" && state === "gameover") {
    initGame();
    return;
  }
  const dir = DIR_OF[e.code];
  if (dir && !paused && state === "playing") pendingDir = dir;
});
// Si el foco sale del juego (p. ej. clic en PAUSA de la plataforma) se descarta el salto pendiente.
function clearKeys() {
  pendingDir = null;
}
window.addEventListener("blur", clearKeys);
// ── Modo embebido (iframe de Arcade Vault) ──────────────────────────────────
// Protocolo postMessage con la plataforma: recibe av:pause | av:resume |
// av:restart | av:end | av:key y envía av:gameover con la puntuación.
const EMBEDDED = window.parent !== window;
let paused = false;
let gameOverSent = false;
function endGame() {
  state = "gameover";
  pendingDir = null;
  if (EMBEDDED && !gameOverSent) {
    gameOverSent = true;
    const final = Math.min(Math.floor(score), MAX_SCORE);
    window.parent.postMessage(
      { type: "av:gameover", score: final },
      location.origin,
    );
  }
}
window.addEventListener("message", (e) => {
  if (!EMBEDDED || e.source !== window.parent || e.origin !== location.origin)
    return;
  const type = e.data && e.data.type;
  if (type === "av:pause") {
    paused = true;
  } else if (type === "av:resume") {
    paused = false;
    lastTime = null;
    clearKeys();
  } else if (type === "av:restart") {
    initGame();
    lastTime = null;
    clearKeys();
  } else if (type === "av:end") {
    if (state !== "gameover") endGame();
  } else if (type === "av:key") {
    pressKey(e.data.code, e.data.down);
  }
});
// Mando táctil de la plataforma (SPEC 10): av:key se convierte en una tecla
// sintética que procesan los manejadores de teclado de siempre. Añade aquí
// cada code que declare `controls` en lib/games.ts (code → key).
const KEY_OF = {
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
};
function pressKey(code, down) {
  if (!Object.hasOwn(KEY_OF, code)) return;
  document.dispatchEvent(
    new KeyboardEvent(down ? "keydown" : "keyup", {
      code,
      key: KEY_OF[code],
      bubbles: true,
      cancelable: true,
    }),
  );
}
// ── Carriles ─────────────────────────────────────────────────────────────────
// Las entidades se reparten a intervalos iguales sobre un ciclo de COLS + ancho
// columnas, así siempre quedan huecos atravesables.
function buildLanes(lvl) {
  const mul = speedMul(lvl);
  return LANE_DEFS.map((d) => {
    const span = COLS + d.width;
    const gap = span / d.count;
    const offset = Math.random() * gap;
    const entities = [];
    for (let i = 0; i < d.count; i++) {
      entities.push({
        col: -d.width + ((offset + i * gap) % span),
        width: d.width,
        type: d.type,
        dives: !!d.dives && i % 2 === 0,
        phase: i * 1.1,
      });
    }
    return {
      row: d.row,
      speed: d.speed * mul,
      dir: d.dir,
      entities,
      delta: 0,
    };
  });
}
function moveLanes(dt) {
  for (const lane of lanes) {
    lane.delta = (lane.speed * lane.dir * dt) / CELL;
    const span = COLS;
    for (const e of lane.entities) {
      e.col += lane.delta;
      if (lane.dir > 0 && e.col >= span) e.col -= span + e.width;
      else if (lane.dir < 0 && e.col <= -e.width) e.col += span + e.width;
    }
  }
}
// 0 visible, 1 aviso (medio hundida), 2 sumergida.
function diveState(e) {
  if (!e.dives) return 0;
  const t = (clock + e.phase) % DIVE_CYCLE;
  if (t >= DIVE_UP) return 2;
  if (t >= DIVE_UP - DIVE_WARN) return 1;
  return 0;
}
function laneOf(row) {
  return lanes.find((l) => l.row === row);
}
// ── Colisiones y apoyo ───────────────────────────────────────────────────────
// Contra vehículos: caja de 0,7 celdas centrada en la rana.
function checkRoadCollision() {
  if (!isRoad(frog.row)) return false;
  const lane = laneOf(frog.row);
  const a = frog.col + 0.15,
    b = frog.col + 0.85;
  return lane.entities.some((e) => a < e.col + e.width && b > e.col);
}
// En el río: la entidad bajo el centro de la rana, o null (agua o tortuga sumergida).
function getSupport() {
  if (!isRiver(frog.row)) return null;
  const lane = laneOf(frog.row);
  const c = frog.col + 0.5;
  for (const e of lane.entities) {
    if (c >= e.col && c < e.col + e.width)
      return diveState(e) === 2 ? null : { lane, entity: e };
  }
  return null;
}
function checkGoal() {
  const c = Math.round(frog.col);
  const idx = GOAL_COLS.findIndex((g) => c === g || c === g + 1);
  if (idx < 0 || goals[idx]) {
    killFrog();
    return;
  }
  goals[idx] = true;
  score += 50 + Math.floor(timer) * 10;
  if (goals.every(Boolean)) {
    score += 200;
    completeRound();
  } else {
    resetFrog();
  }
}
// ── Rana ─────────────────────────────────────────────────────────────────────
function resetFrog() {
  frog = {
    col: START_COL,
    row: ROW_START,
    animating: false,
    animT: 0,
    fromCol: START_COL,
    fromRow: ROW_START,
    targetCol: START_COL,
    targetRow: ROW_START,
    facing: "up",
  };
  bestRow = ROW_START;
  timer = roundTime();
  pendingDir = null;
}
function startJump(dir) {
  const dc = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const dr = dir === "up" ? -1 : dir === "down" ? 1 : 0;
  const row = frog.row + dr;
  let col = frog.col + dc;
  frog.facing = dir;
  if (row < ROW_GOALS || row > ROW_START) return;
  if (col < 0 || col > COLS - 1) return;
  if (!isRiver(row)) col = Math.min(COLS - 1, Math.max(0, Math.round(col)));
  frog.animating = true;
  frog.animT = 0;
  frog.fromCol = frog.col;
  frog.fromRow = frog.row;
  frog.targetCol = col;
  frog.targetRow = row;
}
function land() {
  frog.col = frog.targetCol;
  frog.row = frog.targetRow;
  frog.animating = false;
  if (frog.row < bestRow) {
    bestRow = frog.row;
    score += 10;
  }
  if (frog.row === ROW_GOALS) checkGoal();
  else if (checkRoadCollision()) killFrog();
  else if (isRiver(frog.row) && !getSupport()) killFrog();
}
function killFrog() {
  state = "dying";
  deathT = DEATH_S;
  lives--;
  frog.animating = false;
  pendingDir = null;
}
function completeRound() {
  level++;
  goals = goals.map(() => false);
  lanes = buildLanes(level);
  resetFrog();
}
function initGame() {
  score = 0;
  lives = 3;
  level = 1;
  clock = 0;
  deathT = 0;
  goals = GOAL_COLS.map(() => false);
  lanes = buildLanes(level);
  resetFrog();
  state = "playing";
  paused = false;
  gameOverSent = false;
}
// ── Lógica ───────────────────────────────────────────────────────────────────
function update(dt) {
  clock += dt;
  // El apoyo se busca antes de mover los carriles: la rana viaja con su tronco.
  const support =
    state === "playing" && !frog.animating && isRiver(frog.row)
      ? getSupport()
      : null;
  moveLanes(dt);
  if (state === "gameover") return;
  if (state === "dying") {
    deathT -= dt;
    if (deathT <= 0) {
      if (lives <= 0) endGame();
      else {
        state = "playing";
        resetFrog();
      }
    }
    return;
  }
  timer -= dt;
  if (timer <= 0) {
    timer = 0;
    killFrog();
    return;
  }
  if (frog.animating) {
    frog.animT += dt * 1000;
    if (frog.animT >= JUMP_MS) land();
    return;
  }
  if (isRiver(frog.row)) {
    if (!support) {
      killFrog();
      return;
    }
    frog.col += support.lane.delta;
    const c = frog.col + 0.5;
    if (c < 0 || c >= COLS) {
      killFrog();
      return;
    }
  } else if (checkRoadCollision()) {
    killFrog();
    return;
  }
  if (pendingDir) {
    startJump(pendingDir);
    pendingDir = null;
  }
}
// ── Dibujo ───────────────────────────────────────────────────────────────────
function glow(color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function noGlow() {
  ctx.shadowBlur = 0;
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function drawSides() {
  ctx.fillStyle = C.side;
  ctx.fillRect(0, HUD_H, BOARD_X, H - HUD_H);
  ctx.fillRect(BOARD_X + BOARD_W, HUD_H, BOARD_X, H - HUD_H);
  ctx.strokeStyle = C.sideHatch;
  ctx.lineWidth = 2;
  for (let y = HUD_H - BOARD_X; y < H; y += 16) {
    for (const x0 of [0, BOARD_X + BOARD_W]) {
      ctx.beginPath();
      ctx.moveTo(x0, y + BOARD_X);
      ctx.lineTo(x0 + BOARD_X, y);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = C.sideLine;
  ctx.lineWidth = 2;
  for (const x of [BOARD_X - 1, BOARD_X + BOARD_W + 1]) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_H);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
}
function dotRow(row, color) {
  ctx.fillStyle = color;
  const y = cellY(row);
  for (let x = BOARD_X + 10; x < BOARD_X + BOARD_W; x += 20) {
    ctx.fillRect(x, y + 10, 2, 2);
    ctx.fillRect(x + 10, y + 28, 2, 2);
  }
}
function drawGoals() {
  const y = cellY(ROW_GOALS);
  ctx.fillStyle = C.hedge;
  ctx.fillRect(BOARD_X, y, BOARD_W, CELL);
  dotRow(ROW_GOALS, C.hedgeDot);
  GOAL_COLS.forEach((g, i) => {
    const x = cellX(g) + 4;
    ctx.fillStyle = C.goal;
    roundRect(x, y + 4, CELL * 2 - 8, CELL - 4, [10, 10, 0, 0]);
    ctx.fill();
    glow(C.goalRim, 8);
    ctx.strokeStyle = C.goalRim;
    ctx.lineWidth = 2;
    ctx.stroke();
    noGlow();
    if (goals[i])
      drawFrogAt(cellX(g) + CELL, y + CELL / 2 + 2, "down", 0.85, false);
  });
}
function drawRiver() {
  const y0 = cellY(ROW_RIVER_TOP);
  ctx.fillStyle = C.river;
  ctx.fillRect(BOARD_X, y0, BOARD_W, CELL * 6);
  ctx.strokeStyle = C.ripple;
  ctx.lineWidth = 2;
  for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
    const lane = laneOf(row);
    const drift = (((clock * lane.speed * 0.35 * lane.dir) % 80) + 80) % 80;
    const y = cellY(row) + (row % 2 ? 14 : 26);
    for (let x = BOARD_X - 80 + drift; x < BOARD_X + BOARD_W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 8, y - 4, x + 16, y);
      ctx.quadraticCurveTo(x + 24, y + 4, x + 32, y);
      ctx.stroke();
    }
  }
}
function drawSafe(row) {
  const y = cellY(row);
  ctx.fillStyle = C.safe;
  ctx.fillRect(BOARD_X, y, BOARD_W, CELL);
  dotRow(row, C.safeDot);
  ctx.fillStyle = C.curb;
  ctx.fillRect(BOARD_X, y, BOARD_W, 2);
  ctx.fillRect(BOARD_X, y + CELL - 2, BOARD_W, 2);
}
function drawRoad() {
  const y0 = cellY(ROW_ROAD_TOP);
  ctx.fillStyle = C.road;
  ctx.fillRect(BOARD_X, y0, BOARD_W, CELL * 5);
  ctx.fillStyle = C.laneDash;
  for (let row = ROW_ROAD_TOP + 1; row <= ROW_ROAD_BOT; row++) {
    const y = cellY(row) - 1;
    for (let x = BOARD_X + 6; x < BOARD_X + BOARD_W; x += 40)
      ctx.fillRect(x, y, 20, 2);
  }
  glow(C.roadEdge, 6);
  ctx.fillStyle = C.roadEdge;
  ctx.fillRect(BOARD_X, y0 + 2, BOARD_W, 2);
  ctx.fillRect(BOARD_X, cellY(ROW_ROAD_BOT) + CELL - 4, BOARD_W, 2);
  noGlow();
}
function drawLog(x, y, w) {
  ctx.fillStyle = C.log;
  roundRect(x + 2, y + 6, w - 4, CELL - 12, 12);
  ctx.fill();
  ctx.fillStyle = C.logTop;
  roundRect(x + 8, y + 9, w - 16, 5, 3);
  ctx.fill();
  ctx.strokeStyle = C.logVein;
  ctx.lineWidth = 2;
  for (let vx = x + 22; vx < x + w - 16; vx += 26) {
    ctx.beginPath();
    ctx.moveTo(vx, y + 19);
    ctx.lineTo(vx + 12, y + 19);
    ctx.moveTo(vx + 8, y + 26);
    ctx.lineTo(vx + 18, y + 26);
    ctx.stroke();
  }
  ctx.fillStyle = C.logVein;
  ctx.beginPath();
  ctx.ellipse(x + w - 9, y + CELL / 2, 4, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}
function drawTurtles(e, x, y, dir) {
  const ds = diveState(e);
  for (let i = 0; i < e.width; i++) {
    const cx = x + i * CELL + CELL / 2,
      cy = y + CELL / 2;
    if (ds === 2) {
      ctx.strokeStyle = C.turtleSub;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const r = ds === 1 ? 11 : 15;
    ctx.globalAlpha = ds === 1 ? 0.6 : 1;
    ctx.fillStyle = C.turtle;
    ctx.beginPath();
    ctx.arc(cx + dir * (r + 2), cy, 5, 0, Math.PI * 2); // cabeza
    ctx.fill();
    for (const [px, py] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      ctx.beginPath();
      ctx.arc(cx + px * (r - 3), cy + py * (r - 3), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    glow(C.turtle, ds === 1 ? 0 : 6);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    noGlow();
    ctx.strokeStyle = C.turtleShell;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx - r * 0.55, cy);
    ctx.moveTo(cx + r * 0.55, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
function drawWheels(x, y, w) {
  ctx.fillStyle = C.wheel;
  for (const wx of [x + 9, x + w - 9]) {
    ctx.fillRect(wx - 5, y + 5, 10, 4);
    ctx.fillRect(wx - 5, y + CELL - 9, 10, 4);
  }
}
function drawCar(x, y, w, color, dir) {
  drawWheels(x, y, w);
  glow(color, 8);
  ctx.fillStyle = color;
  roundRect(x + 3, y + 8, w - 6, CELL - 16, 7);
  ctx.fill();
  noGlow();
  ctx.fillStyle = C.window;
  const front = dir > 0 ? x + w - 16 : x + 8;
  ctx.fillRect(front, y + 13, 8, CELL - 26);
  ctx.fillRect(dir > 0 ? x + 9 : x + w - 13, y + 14, 4, CELL - 28);
  ctx.fillStyle = C.light;
  const lx = dir > 0 ? x + w - 5 : x + 3;
  ctx.fillRect(lx, y + 10, 2, 4);
  ctx.fillRect(lx, y + CELL - 14, 2, 4);
}
function drawTruck(x, y, w, dir) {
  drawWheels(x, y, w);
  const cabW = 26;
  const cabX = dir > 0 ? x + w - cabW - 2 : x + 2;
  const trX = dir > 0 ? x + 2 : x + cabW + 4;
  const trW = w - cabW - 6;
  ctx.strokeStyle = C.truck;
  ctx.lineWidth = 2;
  ctx.fillStyle = C.road;
  roundRect(trX, y + 6, trW, CELL - 12, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.truck;
  for (let rx = trX + 10; rx < trX + trW - 4; rx += 12)
    ctx.fillRect(rx, y + 10, 2, CELL - 20);
  glow(C.truckCab, 8);
  ctx.fillStyle = C.truckCab;
  roundRect(cabX, y + 8, cabW, CELL - 16, 6);
  ctx.fill();
  noGlow();
  ctx.fillStyle = C.window;
  ctx.fillRect(dir > 0 ? cabX + cabW - 11 : cabX + 4, y + 13, 7, CELL - 26);
}
function drawLanes() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(BOARD_X, HUD_H, BOARD_W, ROWS * CELL);
  ctx.clip();
  for (const lane of lanes) {
    const y = cellY(lane.row);
    for (const e of lane.entities) {
      const x = cellX(e.col);
      const w = e.width * CELL;
      if (e.type === "log") drawLog(x, y, w);
      else if (e.type === "turtle") drawTurtles(e, x, y, lane.dir);
      else if (e.type === "truck") drawTruck(x, y, w, lane.dir);
      else if (e.type === "racer") drawCar(x, y, w, C.racer, lane.dir);
      else drawCar(x, y, w, lane.row === 10 ? C.car : C.car2, lane.dir);
    }
  }
  ctx.restore();
}
const FACING_ANGLE = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};
// Rana mirando hacia `facing`; `hop` (0–1) extiende las patas y la agranda a mitad del salto.
function drawFrogAt(cx, cy, facing, scale, glowOn, hop = 0) {
  const s = scale * (1 + Math.sin(hop * Math.PI) * 0.15);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(FACING_ANGLE[facing]);
  ctx.scale(s, s);
  const leg = 4 + hop * 6;
  ctx.fillStyle = C.frogDark;
  for (const sx of [-1, 1]) {
    ctx.fillRect(sx * 12 - 3, -10 - leg * 0.4, 6, 8); // patas delanteras
    ctx.fillRect(sx * 13 - 3, 5, 6, 6 + leg); // patas traseras
  }
  if (glowOn) glow(C.frog, 14);
  ctx.fillStyle = C.frog;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  noGlow();
  for (const sx of [-1, 1]) {
    ctx.fillStyle = C.eye;
    ctx.beginPath();
    ctx.arc(sx * 6, -9, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.pupil;
    ctx.beginPath();
    ctx.arc(sx * 6, -10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function frogCenter() {
  let col = frog.col,
    row = frog.row,
    hop = 0;
  if (frog.animating) {
    hop = Math.min(1, frog.animT / JUMP_MS);
    col = frog.fromCol + (frog.targetCol - frog.fromCol) * hop;
    row = frog.fromRow + (frog.targetRow - frog.fromRow) * hop;
  }
  return { x: cellX(col) + CELL / 2, y: cellY(row) + CELL / 2, hop };
}
function drawFrog() {
  const p = frogCenter();
  if (state === "dying" || (state === "gameover" && lives <= 0 && deathT > 0)) {
    const t = 1 - Math.max(0, deathT) / DEATH_S;
    ctx.globalAlpha = 1 - t * 0.6;
    glow(C.splat, 12);
    ctx.strokeStyle = C.splat;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8 + t * 10, 0, Math.PI * 2);
    ctx.moveTo(p.x - 10, p.y - 10);
    ctx.lineTo(p.x + 10, p.y + 10);
    ctx.moveTo(p.x + 10, p.y - 10);
    ctx.lineTo(p.x - 10, p.y + 10);
    ctx.stroke();
    noGlow();
    ctx.globalAlpha = 1;
    return;
  }
  if (state === "gameover") return;
  drawFrogAt(p.x, p.y, frog.facing, 1, true, p.hop);
}
function drawHUD() {
  ctx.fillStyle = C.hud;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.font = `12px ${FONT}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = C.score;
  ctx.fillText(`SCORE ${score}`, 18, 9);
  ctx.textAlign = "center";
  ctx.fillStyle = C.levelInk;
  ctx.fillText(`NIVEL ${level}`, W / 2, 9);
  for (let i = 0; i < Math.max(0, lives); i++)
    drawFrogAt(W - 26 - i * 26, 15, "up", 0.5, false);
  // Barra de tiempo con el ancho del tablero: verde → amarillo → rojo.
  const frac = Math.max(0, Math.min(1, timer / roundTime()));
  ctx.fillStyle = C.timeTrack;
  ctx.fillRect(BOARD_X, 30, BOARD_W, 5);
  const color = frac > 0.5 ? C.timeOk : frac > 0.25 ? C.timeMid : C.timeLow;
  glow(color, 6);
  ctx.fillStyle = color;
  ctx.fillRect(BOARD_X, 30, BOARD_W * frac, 5);
  noGlow();
}
function drawOverlay(title, sub) {
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  glow(C.title, 18);
  ctx.fillStyle = C.title;
  ctx.font = `36px ${FONT}`;
  ctx.fillText(title, W / 2, H / 2 - 24);
  noGlow();
  ctx.fillStyle = C.inkDim;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(sub, W / 2, H / 2 + 28);
}
function draw() {
  noGlow();
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawSides();
  drawGoals();
  drawRiver();
  drawSafe(ROW_SAFE_MID);
  drawRoad();
  drawSafe(ROW_START);
  drawLanes();
  drawFrog();
  drawHUD();
  if (EMBEDDED) return;
  if (state === "gameover")
    drawOverlay("GAME OVER", `PUNTAJE ${score} — ESPACIO PARA REINICIAR`);
  else if (paused) drawOverlay("PAUSA", "P PARA CONTINUAR");
}
// ── Bucle ────────────────────────────────────────────────────────────────────
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (!paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}
initGame();
requestAnimationFrame(loop);
