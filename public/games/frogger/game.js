"use strict";
// FROGGER para Arcade Vault: la rana salta celda a celda, cruza la carretera y el
// río y llena las 5 bocas de arriba. Protocolo av:* de la plantilla de /add-game.
const canvas = document.getElementById("canvas");
// ctx es el contexto en el que dibujan todas las funciones de dibujo; paintOn() lo
// redirige un momento a un lienzo fuera de pantalla para cachear capas (SPEC 12).
let ctx = canvas.getContext("2d");
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
// ── Skins (contrato av:skin) ─────────────────────────────────────────────────
// 3 skins × 2 modos con las mismas claves. El dibujo solo lee la paleta activa C.
// Flags: style ("solid" | "wire" | "pixel"), glow (multiplicador de shadowBlur),
// fillA (alfa del relleno en "wire"), outline (contorno de entidades o null),
// grid (retícula de neón o null) y scan (scanlines de retro o null).
const CLASICO_OSCURO = {
  style: "solid",
  glow: 1,
  fillA: 1,
  outline: null,
  grid: null,
  scan: null,
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
// Retro: 4 tintas de fósforo (t[0] fondo … t[3] tinta) sobre rejilla de 4 px.
function retroPalette(t, light) {
  const [t0, t1, t2, t3] = t;
  return {
    style: "pixel",
    glow: 0,
    fillA: 1,
    outline: null,
    grid: null,
    scan: light ? "rgba(15, 56, 15, 0.1)" : "rgba(0, 0, 0, 0.22)",
    bg: t0,
    hud: t1,
    ink: t3,
    inkDim: t2,
    score: t3,
    levelInk: t3,
    side: light ? t1 : t0,
    sideLine: t2,
    sideHatch: light ? t0 : t1,
    hedge: t1,
    hedgeDot: t2,
    goal: t0,
    goalRim: light ? t3 : t2,
    river: light ? t1 : t0,
    ripple: light ? t0 : t1,
    safe: light ? t0 : t1,
    safeDot: light ? t1 : t2,
    curb: t2,
    road: t0,
    roadEdge: t2,
    laneDash: t1,
    log: light ? t0 : t2,
    logTop: t1,
    logVein: light ? t3 : t1,
    turtle: t2,
    turtleShell: light ? t0 : t1,
    turtleSub: light ? t3 : t2,
    car: t2,
    car2: t2,
    racer: t2,
    truck: t2,
    truckCab: t2,
    window: t0,
    wheel: light ? t3 : t1,
    light: light ? t0 : t3,
    frog: t3,
    frogDark: t2,
    eye: t0,
    pupil: t0,
    splat: t3,
    timeOk: t3,
    timeMid: t2,
    timeLow: t2,
    timeTrack: t0,
    overlay: light ? "rgba(155, 188, 15, 0.85)" : "rgba(7, 17, 8, 0.85)",
    title: t3,
  };
}
const SKINS = {
  clasico: {
    oscuro: CLASICO_OSCURO,
    claro: {
      ...CLASICO_OSCURO,
      glow: 0.25,
      outline: "#1a1a2e",
      bg: "#f2f3f7",
      hud: "#e3e5ee",
      ink: "#1a1a2e",
      inkDim: "#4a4f70",
      score: "#006b75",
      levelInk: "#6b5f00",
      side: "#e6e8f0",
      sideLine: "rgba(0, 107, 117, 0.5)",
      sideHatch: "rgba(0, 117, 74, 0.12)",
      hedge: "#a9d9bd",
      hedgeDot: "rgba(0, 117, 74, 0.4)",
      goal: "#e2f3e9",
      goalRim: "#7a6c00",
      river: "#9cc3e6",
      ripple: "rgba(0, 70, 130, 0.3)",
      safe: "#cfe8d8",
      safeDot: "rgba(0, 117, 74, 0.35)",
      curb: "rgba(0, 117, 74, 0.6)",
      road: "#d6d8e2",
      roadEdge: "rgba(0, 127, 138, 0.8)",
      laneDash: "rgba(107, 95, 0, 0.55)",
      log: "#ebb57f",
      logTop: "#f7d3a8",
      logVein: "rgba(90, 40, 5, 0.5)",
      turtle: "#ff4d94",
      turtleShell: "#8a003c",
      turtleSub: "rgba(200, 0, 90, 0.45)",
      car: "#7a6c00",
      car2: "#c8005a",
      racer: "#007f8a",
      truck: "#4a4f70",
      truckCab: "#007f8a",
      window: "#f2f3f7",
      wheel: "#1a1a2e",
      light: "#fff3a0",
      frog: "#00754a",
      frogDark: "#004d30",
      eye: "#ffffff",
      pupil: "#0a0a0f",
      splat: "#c8005a",
      timeOk: "#00754a",
      timeMid: "#7a6c00",
      timeLow: "#c8005a",
      timeTrack: "rgba(74, 79, 112, 0.2)",
      overlay: "rgba(242, 243, 247, 0.85)",
      title: "#c8005a",
    },
  },
  neon: {
    oscuro: {
      ...CLASICO_OSCURO,
      style: "wire",
      glow: 1.3,
      fillA: 0.22,
      grid: "rgba(0, 245, 255, 0.07)",
      hud: "#0d0d18",
      score: "#00f5ff",
      levelInk: "#ff4d9a",
      side: "#0a0a0f",
      sideLine: "rgba(255, 0, 110, 0.7)",
      sideHatch: "rgba(255, 0, 110, 0.07)",
      hedge: "#0a0a0f",
      hedgeDot: "rgba(0, 255, 136, 0.35)",
      goal: "#0a0a0f",
      goalRim: "#00ff88",
      river: "#070b1e",
      ripple: "rgba(176, 38, 255, 0.4)",
      safe: "#0a0a0f",
      safeDot: "rgba(0, 245, 255, 0.3)",
      curb: "rgba(0, 245, 255, 0.7)",
      road: "#0a0a0f",
      roadEdge: "#ff006e",
      laneDash: "rgba(0, 245, 255, 0.35)",
      log: "#ff8c1a",
      logTop: "#ffc27a",
      logVein: "rgba(255, 140, 26, 0.55)",
      turtle: "#00ff88",
      turtleShell: "#00ff88",
      turtleSub: "rgba(0, 255, 136, 0.4)",
      car: "#e8005f",
      car2: "#b026ff",
      racer: "#2a6bff",
      truck: "#b026ff",
      truckCab: "#e8005f",
      window: "#0a0a0f",
      wheel: "#3a3d58",
      light: "#f5ff00",
      frog: "#00f5ff",
      frogDark: "#008a96",
      splat: "#f5ff00",
      timeOk: "#00f5ff",
      timeMid: "#f5ff00",
      timeLow: "#ff006e",
      timeTrack: "rgba(0, 245, 255, 0.15)",
      overlay: "rgba(10, 10, 15, 0.8)",
      title: "#00f5ff",
    },
    claro: {
      ...CLASICO_OSCURO,
      style: "wire",
      glow: 0.25,
      fillA: 0.18,
      grid: "rgba(0, 127, 138, 0.1)",
      bg: "#eef0fa",
      hud: "#e2e5f3",
      ink: "#1a1a2e",
      inkDim: "#4a4f70",
      score: "#006b75",
      levelInk: "#a8004a",
      side: "#eef0fa",
      sideLine: "rgba(200, 0, 90, 0.6)",
      sideHatch: "rgba(200, 0, 90, 0.08)",
      hedge: "#eef0fa",
      hedgeDot: "rgba(0, 117, 74, 0.45)",
      goal: "#eef0fa",
      goalRim: "#00754a",
      river: "#dfe4f7",
      ripple: "rgba(106, 31, 192, 0.35)",
      safe: "#eef0fa",
      safeDot: "rgba(0, 127, 138, 0.4)",
      curb: "rgba(0, 127, 138, 0.7)",
      road: "#eef0fa",
      roadEdge: "#c8005a",
      laneDash: "rgba(0, 127, 138, 0.4)",
      log: "#b35900",
      logTop: "#d98a3a",
      logVein: "rgba(179, 89, 0, 0.55)",
      turtle: "#00754a",
      turtleShell: "#00754a",
      turtleSub: "rgba(0, 117, 74, 0.45)",
      car: "#c8005a",
      car2: "#6a1fc0",
      racer: "#1f4fd0",
      truck: "#6a1fc0",
      truckCab: "#c8005a",
      window: "#eef0fa",
      wheel: "#4a4f70",
      light: "#6b5f00",
      frog: "#007f8a",
      frogDark: "#004f56",
      eye: "#ffffff",
      pupil: "#0a0a0f",
      splat: "#6b5f00",
      timeOk: "#007f8a",
      timeMid: "#6b5f00",
      timeLow: "#c8005a",
      timeTrack: "rgba(0, 127, 138, 0.15)",
      overlay: "rgba(238, 240, 250, 0.85)",
      title: "#007f8a",
    },
  },
  retro: {
    oscuro: retroPalette(["#071108", "#1e3a1b", "#4f8a2c", "#d4f7a0"], false),
    claro: retroPalette(["#9bbc0f", "#8bac0f", "#306230", "#0f380f"], true),
  },
};
let C = CLASICO_OSCURO;
// Fondo estático de la skin activa, pintado una vez (SPEC 12). null = hay que rehacerlo.
let bgLayer = null;
// Sprites de coches, camiones, troncos y tortugas con su brillo ya pintado (SPEC 12).
// Clave `${kind}:${ancho}:${sentido}:${variante}`; se vacía al cambiar de skin.
const sprites = new Map();
// Solo cambia el dibujo: no pausa, no reinicia ni toca la partida.
function applySkin(skin, mode) {
  const s = Object.hasOwn(SKINS, skin) ? skin : "clasico";
  const m = mode === "claro" ? "claro" : "oscuro";
  C = SKINS[s][m];
  bgLayer = null; // las capas cacheadas dependen de la paleta
  sprites.clear();
  document.documentElement.dataset.skin = s;
  document.documentElement.dataset.mode = m;
}
// Abierto directamente: /games/frogger/index.html?skin=retro&mode=claro
const params = new URLSearchParams(location.search);
applySkin(params.get("skin"), params.get("mode"));
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
// av:restart | av:end | av:key | av:skin y envía av:gameover con la puntuación.
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
  } else if (type === "av:skin") {
    applySkin(e.data.skin, e.data.mode);
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
// C.style elige la forma: "solid" (clásico), "wire" (neón: todo en trazo
// luminoso menos la rana) y "pixel" (retro: rectángulos en rejilla de 4 px).
const P = 4;
const snap = (v) => Math.round(v / P) * P;
function glow(color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * C.glow;
}
function noGlow() {
  ctx.shadowBlur = 0;
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
// Rellena el trazado actual. En "wire" (salvo `solid`) es relleno tenue + trazo con brillo.
function body(color, blur, solid = false) {
  if (C.style === "wire" && !solid) {
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * C.fillA;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = a;
    glow(color, blur);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    noGlow();
    return;
  }
  glow(color, blur);
  ctx.fillStyle = color;
  ctx.fill();
  noGlow();
  if (C.outline) {
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
function px(color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
// Ejecuta fn() dibujando sobre `target` en vez de sobre la pantalla.
function paintOn(target, fn) {
  const prev = ctx;
  ctx = target.getContext("2d");
  fn();
  ctx = prev;
}
function drawSides() {
  ctx.fillStyle = C.side;
  ctx.fillRect(0, HUD_H, BOARD_X, H - HUD_H);
  ctx.fillRect(BOARD_X + BOARD_W, HUD_H, BOARD_X, H - HUD_H);
  if (C.style === "pixel") {
    for (let y = HUD_H; y < H; y += 8) {
      for (let x = (y / 8) % 2 ? 4 : 0; x < BOARD_X; x += 8) {
        px(C.sideHatch, x, y, 4, 4);
        px(C.sideHatch, BOARD_X + BOARD_W + x, y, 4, 4);
      }
    }
    px(C.sideLine, BOARD_X - 4, HUD_H, 4, H - HUD_H);
    px(C.sideLine, BOARD_X + BOARD_W, HUD_H, 4, H - HUD_H);
    return;
  }
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
  const d = C.style === "pixel" ? 4 : 2;
  const o = d === 4 ? 8 : 10;
  for (let x = BOARD_X + o; x < BOARD_X + BOARD_W; x += 20) {
    ctx.fillRect(x, y + o, d, d);
    ctx.fillRect(x + (d === 4 ? 12 : 10), y + 28, d, d);
  }
}
// Seto y bocas vacías (capa de fondo).
function drawGoalSlots() {
  const y = cellY(ROW_GOALS);
  ctx.fillStyle = C.hedge;
  ctx.fillRect(BOARD_X, y, BOARD_W, CELL);
  dotRow(ROW_GOALS, C.hedgeDot);
  GOAL_COLS.forEach((g) => {
    const x = cellX(g) + 4;
    if (C.style === "pixel") {
      px(C.goal, x, y + 4, CELL * 2 - 8, CELL - 4);
      px(C.goalRim, x, y + 4, CELL * 2 - 8, 4);
      px(C.goalRim, x, y + 4, 4, CELL - 4);
      px(C.goalRim, x + CELL * 2 - 12, y + 4, 4, CELL - 4);
    } else {
      ctx.fillStyle = C.goal;
      roundRect(x, y + 4, CELL * 2 - 8, CELL - 4, [10, 10, 0, 0]);
      ctx.fill();
      glow(C.goalRim, 8);
      ctx.strokeStyle = C.goalRim;
      ctx.lineWidth = 2;
      ctx.stroke();
      noGlow();
    }
  });
}
// Ranas de las bocas ocupadas (cambian durante la ronda: se dibujan cada frame).
function drawGoalFrogs() {
  const y = cellY(ROW_GOALS);
  GOAL_COLS.forEach((g, i) => {
    if (goals[i])
      drawFrogAt(cellX(g) + CELL, y + CELL / 2 + 2, "down", 0.85, false);
  });
}
function drawRiverBase() {
  ctx.fillStyle = C.river;
  ctx.fillRect(BOARD_X, cellY(ROW_RIVER_TOP), BOARD_W, CELL * 6);
}
// Ondas del río: se desplazan con el reloj, así que no van en la capa de fondo.
function drawRipples() {
  ctx.strokeStyle = C.ripple;
  ctx.lineWidth = 2;
  for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
    const lane = laneOf(row);
    const drift = (((clock * lane.speed * 0.35 * lane.dir) % 80) + 80) % 80;
    const y = cellY(row) + (row % 2 ? 14 : 26);
    for (let x = BOARD_X - 80 + drift; x < BOARD_X + BOARD_W; x += 80) {
      if (C.style === "pixel") {
        px(C.ripple, snap(x), y - 2, 12, 4);
        px(C.ripple, snap(x) + 16, y + 2, 12, 4);
        continue;
      }
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
  const t = C.style === "pixel" ? 4 : 2;
  ctx.fillStyle = C.curb;
  ctx.fillRect(BOARD_X, y, BOARD_W, t);
  ctx.fillRect(BOARD_X, y + CELL - t, BOARD_W, t);
}
function drawRoad() {
  const y0 = cellY(ROW_ROAD_TOP);
  const t = C.style === "pixel" ? 4 : 2;
  ctx.fillStyle = C.road;
  ctx.fillRect(BOARD_X, y0, BOARD_W, CELL * 5);
  ctx.fillStyle = C.laneDash;
  for (let row = ROW_ROAD_TOP + 1; row <= ROW_ROAD_BOT; row++) {
    const y = cellY(row) - t / 2;
    for (let x = BOARD_X + (t === 4 ? 8 : 6); x < BOARD_X + BOARD_W; x += 40)
      ctx.fillRect(x, y, 20, t);
  }
  glow(C.roadEdge, 6);
  ctx.fillStyle = C.roadEdge;
  ctx.fillRect(BOARD_X, y0 + 4 - t, BOARD_W, t);
  ctx.fillRect(BOARD_X, cellY(ROW_ROAD_BOT) + CELL - 4, BOARD_W, t);
  noGlow();
}
// Retícula de neón: líneas de celda sobre todo el tablero, bajo las entidades.
function drawGrid() {
  if (!C.grid) return;
  ctx.fillStyle = C.grid;
  for (let x = BOARD_X; x <= BOARD_X + BOARD_W; x += CELL)
    ctx.fillRect(x, HUD_H, 1, ROWS * CELL);
  for (let y = HUD_H; y <= H; y += CELL) ctx.fillRect(BOARD_X, y, BOARD_W, 1);
}
function drawLog(x, y, w) {
  if (C.style === "pixel") {
    x = snap(x);
    px(C.logVein, x + 4, y + 8, w - 8, CELL - 16);
    px(C.log, x + 8, y + 12, w - 16, CELL - 24);
    px(C.logTop, x + 12, y + 12, w - 24, 4);
    for (let vx = x + 20; vx < x + w - 24; vx += 24)
      px(C.logVein, vx, y + 20, 12, 4);
    px(C.logVein, x + w - 16, y + 16, 4, 8);
    return;
  }
  roundRect(x + 2, y + 6, w - 4, CELL - 12, 12);
  body(C.log, C.style === "wire" ? 6 : 0);
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
function drawTurtlesPx(e, x, y, dir, ds) {
  x = snap(x);
  for (let i = 0; i < e.width; i++) {
    const cx = x + i * CELL + CELL / 2,
      cy = y + CELL / 2;
    if (ds === 2) {
      for (const [dx, dy] of [
        [-8, -8],
        [4, -8],
        [-8, 4],
        [4, 4],
      ])
        px(C.turtleSub, cx + dx, cy + dy, 4, 4);
      continue;
    }
    if (ds === 1) {
      // Aviso: solo asoma el centro del caparazón.
      px(C.turtle, cx - 8, cy - 8, 16, 16);
      px(C.turtleShell, cx - 4, cy - 4, 8, 8);
      continue;
    }
    px(C.turtle, cx + (dir > 0 ? 12 : -16), cy - 4, 4, 8); // cabeza
    for (const [dx, dy] of [
      [-16, -12],
      [12, -12],
      [-16, 8],
      [12, 8],
    ])
      px(C.turtle, cx + dx, cy + dy, 4, 4); // aletas
    px(C.turtle, cx - 12, cy - 8, 24, 16);
    px(C.turtle, cx - 8, cy - 12, 16, 24);
    px(C.turtleShell, cx - 4, cy - 8, 8, 4);
    px(C.turtleShell, cx - 4, cy + 4, 8, 4);
    px(C.turtleShell, cx - 8, cy - 4, 4, 8);
    px(C.turtleShell, cx + 4, cy - 4, 4, 8);
  }
}
// ds: 0 visible, 1 aviso, 2 sumergida (el sprite lo recibe ya calculado).
function drawTurtles(e, x, y, dir, ds = diveState(e)) {
  if (C.style === "pixel") return drawTurtlesPx(e, x, y, dir, ds);
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
    for (const [ox, oy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      ctx.beginPath();
      ctx.arc(cx + ox * (r - 3), cy + oy * (r - 3), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    body(C.turtle, ds === 1 ? 0 : 6);
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
  if (C.style === "pixel") {
    for (const wx of [x + 8, x + w - 16]) {
      px(C.wheel, wx, y + 4, 8, 4);
      px(C.wheel, wx, y + CELL - 8, 8, 4);
    }
    return;
  }
  ctx.fillStyle = C.wheel;
  for (const wx of [x + 9, x + w - 9]) {
    ctx.fillRect(wx - 5, y + 5, 10, 4);
    ctx.fillRect(wx - 5, y + CELL - 9, 10, 4);
  }
}
function drawCarPx(x, y, w, color, dir, kind) {
  x = snap(x);
  drawWheels(x, y, w);
  px(color, x + 4, y + 8, w - 8, CELL - 16);
  px(C.window, dir > 0 ? x + w - 16 : x + 8, y + 12, 8, CELL - 24);
  if (kind === "car2")
    px(C.window, dir > 0 ? x + 8 : x + w - 12, y + 12, 4, 16);
  if (kind === "racer") px(C.light, x + 4, y + 18, w - 8, 4);
  const lx = dir > 0 ? x + w - 8 : x + 4;
  px(C.light, lx, y + 8, 4, 4);
  px(C.light, lx, y + CELL - 12, 4, 4);
}
function drawCar(x, y, w, color, dir, kind) {
  if (C.style === "pixel") return drawCarPx(x, y, w, color, dir, kind);
  drawWheels(x, y, w);
  roundRect(x + 3, y + 8, w - 6, CELL - 16, 7);
  body(color, 8);
  ctx.fillStyle = C.style === "wire" ? color : C.window;
  const front = dir > 0 ? x + w - 16 : x + 8;
  ctx.fillRect(front, y + 13, 8, CELL - 26);
  ctx.fillRect(dir > 0 ? x + 9 : x + w - 13, y + 14, 4, CELL - 28);
  ctx.fillStyle = C.light;
  const lx = dir > 0 ? x + w - 5 : x + 3;
  ctx.fillRect(lx, y + 10, 2, 4);
  ctx.fillRect(lx, y + CELL - 14, 2, 4);
}
function drawTruck(x, y, w, dir) {
  const pixel = C.style === "pixel";
  if (pixel) x = snap(x);
  else drawWheels(x, y, w);
  const cabW = pixel ? 24 : 26;
  const cabX = dir > 0 ? x + w - cabW - (pixel ? 4 : 2) : x + (pixel ? 4 : 2);
  const trX = dir > 0 ? x + (pixel ? 4 : 2) : x + cabW + (pixel ? 8 : 4);
  const trW = w - cabW - (pixel ? 12 : 6);
  if (pixel) {
    px(C.truck, trX, y + 4, trW, CELL - 8);
    px(C.road, trX + 4, y + 8, trW - 8, CELL - 16);
    for (let rx = trX + 12; rx < trX + trW - 8; rx += 12)
      px(C.truck, rx, y + 12, 4, CELL - 24);
    px(C.truckCab, cabX, y + 8, cabW, CELL - 16);
    px(C.window, dir > 0 ? cabX + cabW - 12 : cabX + 4, y + 12, 8, CELL - 24);
    return;
  }
  ctx.strokeStyle = C.truck;
  ctx.lineWidth = 2;
  ctx.fillStyle = C.road;
  roundRect(trX, y + 6, trW, CELL - 12, 3);
  ctx.fill();
  if (C.style === "wire") glow(C.truck, 6);
  ctx.stroke();
  noGlow();
  ctx.fillStyle = C.truck;
  for (let rx = trX + 10; rx < trX + trW - 4; rx += 12)
    ctx.fillRect(rx, y + 10, 2, CELL - 20);
  roundRect(cabX, y + 8, cabW, CELL - 16, 6);
  body(C.truckCab, 8);
  ctx.fillStyle = C.style === "wire" ? C.truckCab : C.window;
  ctx.fillRect(dir > 0 ? cabX + cabW - 11 : cabX + 4, y + 13, 7, CELL - 26);
}
// Dibuja una entidad en (x, y). kind: log | turtle | truck | racer | car | car2.
function drawEntity(kind, x, y, w, dir, variant) {
  if (kind === "log") drawLog(x, y, w);
  else if (kind === "turtle")
    drawTurtles({ width: w / CELL }, x, y, dir, variant);
  else if (kind === "truck") drawTruck(x, y, w, dir);
  else if (kind === "racer") drawCar(x, y, w, C.racer, dir, "racer");
  else drawCar(x, y, w, kind === "car" ? C.car : C.car2, dir, kind);
}
// Margen del sprite para que quepa el brillo (shadowBlur máximo 8 × glow 1,3 ≈ 10,4).
// Múltiplo de 4 para que en retro siga la rejilla.
const SPRITE_PAD = 16;
function spriteFor(kind, width, dir, variant) {
  const key = `${kind}:${width}:${dir}:${variant}`;
  let img = sprites.get(key);
  if (img) return img;
  const w = width * CELL;
  img = makeCanvas(w + SPRITE_PAD * 2, CELL + SPRITE_PAD * 2);
  paintOn(img, () => {
    ctx.translate(SPRITE_PAD, SPRITE_PAD);
    drawEntity(kind, 0, 0, w, dir, variant);
  });
  sprites.set(key, img);
  return img;
}
function drawLanes() {
  ctx.save();
  ctx.beginPath();
  ctx.rect(BOARD_X, HUD_H, BOARD_W, ROWS * CELL);
  ctx.clip();
  const pixel = C.style === "pixel";
  for (const lane of lanes) {
    const y = cellY(lane.row);
    for (const e of lane.entities) {
      const kind =
        e.type === "car" ? (lane.row === 10 ? "car" : "car2") : e.type;
      const variant = e.type === "turtle" ? diveState(e) : 0;
      const img = spriteFor(kind, e.width, lane.dir, variant);
      // Coordenada entera (o en la rejilla de 4 px en retro) para no emborronar el sprite.
      const x = cellX(e.col);
      ctx.drawImage(
        img,
        (pixel ? snap(x) : Math.round(x)) - SPRITE_PAD,
        y - SPRITE_PAD,
      );
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
// Rana de 8×8 píxeles mirando arriba (B cuerpo, D patas, E ojos); 2.º cuadro: salto.
const FROG_PX = [
  [
    ".BB..BB.",
    "DBEBBEBD",
    "D.BBBB.D",
    ".BBBBBB.",
    ".BBBBBB.",
    "D.BBBB.D",
    "DD....DD",
    "........",
  ],
  [
    "DBB..BBD",
    ".BEBBEB.",
    "..BBBB..",
    ".BBBBBB.",
    ".BBBBBB.",
    "..BBBB..",
    ".D....D.",
    "D......D",
  ],
];
function drawFrogPx(cx, cy, facing, scale, hop) {
  const p = scale >= 0.8 ? P : 2;
  const map = FROG_PX[hop > 0.15 && hop < 0.85 ? 1 : 0];
  const tone = { B: C.frog, D: C.frogDark, E: C.pupil };
  const x0 = snap(cx - 4 * p),
    y0 = snap(cy - 4 * p);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let sx = x,
        sy = y;
      if (facing === "down") {
        sx = 7 - x;
        sy = 7 - y;
      } else if (facing === "right") {
        sx = y;
        sy = 7 - x;
      } else if (facing === "left") {
        sx = 7 - y;
        sy = x;
      }
      const ch = map[sy][sx];
      if (ch !== ".") px(tone[ch], x0 + x * p, y0 + y * p, p, p);
    }
  }
}
// Rana mirando hacia `facing`; `hop` (0–1) extiende las patas y la agranda a mitad del salto.
function drawFrogAt(cx, cy, facing, scale, glowOn, hop = 0) {
  if (C.style === "pixel") return drawFrogPx(cx, cy, facing, scale, hop);
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
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  body(C.frog, glowOn ? 14 : 0, true);
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
    if (C.style === "pixel") {
      // Aspa de píxeles que parpadea.
      if (Math.floor(t * 8) % 2) return;
      const x0 = snap(p.x) - 2,
        y0 = snap(p.y) - 2;
      for (let i = -3; i <= 3; i++) {
        px(C.splat, x0 + i * 4, y0 + i * 4, 4, 4);
        px(C.splat, x0 + i * 4, y0 - i * 4, 4, 4);
      }
      return;
    }
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
// HUD_FONT de 24 px: en un móvil vertical el lienzo se ve a ~275 px de ancho y el
// texto queda en ~8 px reales; a 12 px no se leía.
const HUD_FONT = 24,
  HUD_TEXT_Y = 5,
  TIME_Y = 32;
function drawHUD() {
  ctx.fillStyle = C.hud;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.font = `${HUD_FONT}px ${FONT}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  if (C.style === "wire") glow(C.score, 4);
  ctx.fillStyle = C.score;
  ctx.fillText(`SCORE ${score}`, 12, HUD_TEXT_Y);
  ctx.textAlign = "center";
  if (C.style === "wire") glow(C.levelInk, 4);
  ctx.fillStyle = C.levelInk;
  ctx.fillText(`NIVEL ${level}`, W / 2, HUD_TEXT_Y);
  noGlow();
  for (let i = 0; i < Math.max(0, lives); i++)
    drawFrogAt(W - 24 - i * 30, 16, "up", 0.62, false);
  // Barra de tiempo con el ancho del tablero: verde → amarillo → rojo.
  const frac = Math.max(0, Math.min(1, timer / roundTime()));
  const pixel = C.style === "pixel";
  const bh = pixel ? 4 : 6;
  ctx.fillStyle = C.timeTrack;
  ctx.fillRect(BOARD_X, TIME_Y, BOARD_W, bh);
  const color = frac > 0.5 ? C.timeOk : frac > 0.25 ? C.timeMid : C.timeLow;
  // En retro, el tramo final parpadea porque no hay color de alarma.
  if (pixel && frac <= 0.25 && Math.floor(clock * 4) % 2) return;
  glow(color, 6);
  ctx.fillStyle = color;
  const bw = BOARD_W * frac;
  ctx.fillRect(BOARD_X, TIME_Y, pixel ? snap(bw) : bw, bh);
  noGlow();
}
function drawScanlines() {
  if (!C.scan) return;
  ctx.fillStyle = C.scan;
  for (let y = 2; y < H; y += 4) ctx.fillRect(0, y, W, 2);
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
// Todo lo que no se mueve, en un lienzo de 800×600 que se copia con un solo drawImage.
function buildBgLayer() {
  const layer = makeCanvas(W, H);
  paintOn(layer, () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawSides();
    drawGoalSlots();
    drawRiverBase();
    drawSafe(ROW_SAFE_MID);
    drawRoad();
    drawSafe(ROW_START);
    drawGrid();
  });
  return layer;
}
function draw() {
  noGlow();
  if (!bgLayer) bgLayer = buildBgLayer();
  ctx.drawImage(bgLayer, 0, 0);
  drawGoalFrogs();
  drawRipples();
  drawLanes();
  drawFrog();
  drawHUD();
  if (!EMBEDDED) {
    if (state === "gameover")
      drawOverlay("GAME OVER", `PUNTAJE ${score} — ESPACIO PARA REINICIAR`);
    else if (paused) drawOverlay("PAUSA", "P PARA CONTINUAR");
  }
  drawScanlines();
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
