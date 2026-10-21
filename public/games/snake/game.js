"use strict";
// SNAKE para Arcade Vault: la serpiente avanza una celda por tick, come frutas,
// crece y acelera cada 5 frutas. Protocolo av:* de la plantilla de /add-game.
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
// Tablero: franja de HUD de 40 px arriba y 20×14 celdas de 40 px debajo.
const COLS = 20,
  ROWS = 14,
  CELL = 40,
  HUD_H = 40;
const FRUITS_PER_LEVEL = 5;
// Paleta del tema neón del Vault (app/globals.css). El iframe no ve las variables CSS.
const C = {
  bg: "#0a0a0f",
  hud: "#0f0f1a",
  ink: "#e6e9ff",
  inkDim: "#8a8fb5",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  yellow: "#f5ff00",
  green: "#00ff88",
};
const FONT = '"Press Start 2P", monospace';
// ── Sprites de frutas ───────────────────────────────────────────────────────
const ATLAS = window.SPRITE_ATLAS;
const FRUIT_KEYS = ATLAS ? Object.keys(ATLAS.fruits) : [];
const fruitImg = new Image();
let fruitImgReady = false;
fruitImg.onload = () => {
  fruitImgReady = true;
};
if (ATLAS) fruitImg.src = ATLAS.sources.fruits;
// ── Utilidades ───────────────────────────────────────────────────────────────
const MAX_SCORE = 10000000; // límite de la tabla leaderboard (SPEC 06)
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const KEY_DIR = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};
const isOpposite = (a, b) =>
  DIRS[a].x + DIRS[b].x === 0 && DIRS[a].y + DIRS[b].y === 0;
const tickMs = () => Math.max(60, 150 - (level - 1) * 10);
// ── Estado ───────────────────────────────────────────────────────────────────
let state; // 'playing' | 'gameover'
let score, level, eaten, started;
let snake, dir, turns, fruit;
let levelFlash = -Infinity; // marca de tiempo del último cambio de nivel
let lastTime = null;
let acc = 0;
// ── Modo embebido (iframe de Arcade Vault) ──────────────────────────────────
// Protocolo postMessage con la plataforma: recibe av:pause | av:resume |
// av:restart | av:end y envía av:gameover con la puntuación.
const EMBEDDED = window.parent !== window;
let paused = false;
let gameOverSent = false;
function endGame() {
  state = "gameover";
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
    acc = 0;
    clearKeys();
  } else if (type === "av:restart") {
    initGame();
    lastTime = null;
    acc = 0;
    clearKeys();
  } else if (type === "av:end") {
    if (state !== "gameover") endGame();
  }
});
// ── Entrada ──────────────────────────────────────────────────────────────────
const GAME_KEYS = ["Space", ...Object.keys(KEY_DIR)];
window.addEventListener("keydown", (e) => {
  // Evita que Espacio, las flechas y WASD hagan scroll en la página.
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (!EMBEDDED) {
    if (e.code === "KeyP" && state === "playing") {
      paused = !paused;
      lastTime = null;
      acc = 0;
      clearKeys();
      return;
    }
    if (e.code === "Space" && state === "gameover") {
      initGame();
      lastTime = null;
      acc = 0;
      return;
    }
  }
  const next = KEY_DIR[e.code];
  if (next && state === "playing" && !paused) queueTurn(next);
});
// Giros pendientes: se descartan al perder el foco, pausar o reiniciar.
function clearKeys() {
  turns.length = 0;
}
window.addEventListener("blur", () => clearKeys());
// Cola de hasta 2 giros. Cada uno se valida contra el anterior de la cola para
// que dos pulsaciones rápidas no sumen un giro de 180°.
function queueTurn(next) {
  if (!started) {
    if (isOpposite(next, dir)) return;
    started = true;
    if (next !== dir) turns.push(next);
    return;
  }
  if (turns.length >= 2) return;
  const ref = turns.length ? turns[turns.length - 1] : dir;
  if (next === ref || isOpposite(next, ref)) return;
  turns.push(next);
}
function initGame() {
  score = 0;
  level = 1;
  eaten = 0;
  started = false;
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  snake = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  dir = "right";
  turns = [];
  fruit = null;
  spawnFruit();
  state = "playing";
  paused = false;
  gameOverSent = false;
}
// Coloca la fruta en una celda libre al azar. Devuelve false si no queda ninguna.
function spawnFruit() {
  const taken = new Set(snake.map((s) => s.y * COLS + s.x));
  const free = [];
  for (let i = 0; i < COLS * ROWS; i++) if (!taken.has(i)) free.push(i);
  if (!free.length) {
    fruit = null;
    return false;
  }
  const cell = free[Math.floor(Math.random() * free.length)];
  const kind = FRUIT_KEYS.length
    ? FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)]
    : null;
  fruit = { x: cell % COLS, y: Math.floor(cell / COLS), kind };
  return true;
}
// ── Lógica ───────────────────────────────────────────────────────────────────
function step() {
  if (turns.length) dir = turns.shift();
  const head = snake[0];
  const nx = head.x + DIRS[dir].x;
  const ny = head.y + DIRS[dir].y;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return endGame();
  const eats = fruit && fruit.x === nx && fruit.y === ny;
  // Sin comer, la cola deja su celda en este mismo tick.
  const body = eats ? snake : snake.slice(0, -1);
  if (body.some((s) => s.x === nx && s.y === ny)) return endGame();
  snake.unshift({ x: nx, y: ny });
  if (!eats) {
    snake.pop();
    return;
  }
  score += 10 * level;
  eaten++;
  if (eaten % FRUITS_PER_LEVEL === 0) {
    level++;
    levelFlash = performance.now();
  }
  if (!spawnFruit()) endGame();
}
// ── Dibujo ───────────────────────────────────────────────────────────────────
const cellX = (x) => x * CELL;
const cellY = (y) => HUD_H + y * CELL;
function glow(color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}
// Mezcla lineal entre dos colores #rrggbb.
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) =>
    Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}
function drawBoard(now) {
  // Retícula de puntos en las intersecciones de las celdas.
  ctx.fillStyle = "rgba(0, 245, 255, 0.16)";
  for (let y = 1; y < ROWS; y++)
    for (let x = 1; x < COLS; x++)
      ctx.fillRect(cellX(x) - 1, cellY(y) - 1, 2, 2);
  // Marco: la pared mata. Destella en amarillo al subir de nivel.
  const flash = Math.max(0, 1 - (now - levelFlash) / 700);
  const color = flash > 0 ? mix(C.magenta, C.yellow, flash) : C.magenta;
  glow(color, 12 + flash * 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, HUD_H + 1.5, W - 3, ROWS * CELL - 3);
  ctx.shadowBlur = 0;
}
function drawFruit(now) {
  if (!fruit) return;
  const x = cellX(fruit.x);
  const y = cellY(fruit.y);
  // Halo que late suavemente bajo la fruta.
  const pulse = 0.5 + 0.5 * Math.sin(now / 260);
  const halo = ctx.createRadialGradient(
    x + CELL / 2,
    y + CELL / 2,
    2,
    x + CELL / 2,
    y + CELL / 2,
    CELL * 0.75,
  );
  halo.addColorStop(0, `rgba(255, 0, 110, ${0.22 + pulse * 0.18})`);
  halo.addColorStop(1, "rgba(255, 0, 110, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x - CELL / 2, y - CELL / 2, CELL * 2, CELL * 2);
  const crop = fruit.kind && ATLAS.fruits[fruit.kind];
  if (fruitImgReady && crop) {
    // Encaja el recorte en la celda manteniendo su proporción, sin suavizado.
    const box = CELL - 6;
    const s = Math.min(box / crop.w, box / crop.h);
    const dw = crop.w * s;
    const dh = crop.h * s;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      fruitImg,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
      x + (CELL - dw) / 2,
      y + (CELL - dh) / 2,
      dw,
      dh,
    );
  } else {
    glow(C.magenta, 14);
    ctx.fillStyle = C.magenta;
    ctx.fillRect(x + 11, y + 11, CELL - 22, CELL - 22);
    ctx.shadowBlur = 0;
  }
}
function drawSnake() {
  const dead = state === "gameover";
  const head = dead ? C.magenta : C.green;
  const tail = dead ? "#4a0f2a" : "#0b6b45";
  const pad = 4;
  const n = snake.length;
  // De la cola a la cabeza; solo la cabeza brilla para que el cuerpo quede nítido.
  for (let i = n - 1; i >= 0; i--) {
    const s = snake[i];
    if (i === 0) glow(head, dead ? 8 : 16);
    ctx.fillStyle = mix(head, tail, n > 1 ? i / (n - 1) : 0);
    roundRect(
      cellX(s.x) + pad,
      cellY(s.y) + pad,
      CELL - pad * 2,
      CELL - pad * 2,
      8,
    );
    // Puente hacia el segmento siguiente (más cerca de la cabeza) para que el cuerpo sea continuo.
    if (i > 0) {
      const p = snake[i - 1];
      const x = Math.min(s.x, p.x);
      const y = Math.min(s.y, p.y);
      const horiz = s.y === p.y;
      ctx.fillRect(
        cellX(x) + (horiz ? CELL / 2 : pad),
        cellY(y) + (horiz ? pad : CELL / 2),
        horiz ? CELL : CELL - pad * 2,
        horiz ? CELL - pad * 2 : CELL,
      );
    }
  }
  ctx.shadowBlur = 0;
  // Ojos mirando hacia donde avanza la cabeza.
  const h = snake[0];
  const d = DIRS[dir];
  const cx = cellX(h.x) + CELL / 2 + d.x * 7;
  const cy = cellY(h.y) + CELL / 2 + d.y * 7;
  const ox = d.y !== 0 ? 7 : 0;
  const oy = d.x !== 0 ? 7 : 0;
  ctx.fillStyle = C.bg;
  ctx.fillRect(cx - ox - 3, cy - oy - 3, 6, 6);
  ctx.fillRect(cx + ox - 3, cy + oy - 3, 6, 6);
}
function drawHUD() {
  ctx.fillStyle = C.hud;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.font = `14px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = C.cyan;
  ctx.fillText(`SCORE ${score}`, 18, HUD_H / 2 + 1);
  ctx.textAlign = "center";
  ctx.fillStyle = C.yellow;
  ctx.fillText(`NIVEL ${level}`, W / 2, HUD_H / 2 + 1);
  // Frutas que faltan para el siguiente nivel.
  const got = eaten % FRUITS_PER_LEVEL;
  for (let i = 0; i < FRUITS_PER_LEVEL; i++) {
    const x = W - 18 - (FRUITS_PER_LEVEL - i) * 20 + 6;
    if (i < got) {
      ctx.fillStyle = C.green;
      ctx.fillRect(x, 14, 12, 12);
    } else {
      ctx.strokeStyle = "rgba(0, 255, 136, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, 15, 10, 10);
    }
  }
}
function drawStartHint(now) {
  if (Math.floor(now / 500) % 2) return;
  ctx.font = `12px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.ink;
  ctx.fillText("FLECHAS O WASD PARA EMPEZAR", W / 2, cellY(4) + CELL / 2);
}
function drawOverlay(title, sub) {
  ctx.fillStyle = "rgba(10, 10, 15, 0.75)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  glow(C.magenta, 18);
  ctx.fillStyle = C.magenta;
  ctx.font = `36px ${FONT}`;
  ctx.fillText(title, W / 2, H / 2 - 24);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.inkDim;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(sub, W / 2, H / 2 + 28);
}
function draw(now) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawBoard(now);
  drawFruit(now);
  drawSnake();
  drawHUD();
  if (state === "playing" && !started) drawStartHint(now);
  // Embebido, la plataforma muestra su propia pausa y su modal de fin.
  if (EMBEDDED) return;
  if (paused) drawOverlay("PAUSA", "P PARA CONTINUAR");
  else if (state === "gameover")
    drawOverlay("GAME OVER", `PUNTAJE ${score} — ESPACIO PARA REINICIAR`);
}
// ── Bucle ────────────────────────────────────────────────────────────────────
// rAF con dt limitado a 50 ms y un acumulador que ejecuta un tick cada vez que
// supera el intervalo del nivel.
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state === "playing" && started) {
    acc += dt;
    while (state === "playing" && acc >= tickMs()) {
      acc -= tickMs();
      step(); // step() puede llamar a endGame()
    }
  }
  draw(ts);
  requestAnimationFrame(loop);
}
initGame();
requestAnimationFrame(loop);
