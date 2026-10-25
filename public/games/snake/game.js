"use strict";
// SNAKE para Arcade Vault: la serpiente avanza una celda por tick, come frutas,
// crece y acelera cada 5 frutas. Protocolo av:* de la plantilla de /add-game.
const canvas = document.getElementById("canvas");
// let: paintOn() lo apunta un momento a un lienzo auxiliar para cachear dibujos.
let ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
// Tablero: franja de HUD de 40 px arriba y 20×14 celdas de 40 px debajo.
const COLS = 20,
  ROWS = 14,
  CELL = 40,
  HUD_H = 40;
const FRUITS_PER_LEVEL = 5;
const FONT = '"Press Start 2P", monospace';
// ── Skins (contrato av:skin) ─────────────────────────────────────────────────
// El dibujo solo lee la paleta activa C. Todas las paletas tienen las mismas
// claves; los estilos (grid, wallStyle, snakeStyle, fruitStyle) eligen la forma.
const rgbOf = (hex) => hex.match(/\w\w/g).map((h) => parseInt(h, 16));
const rgba = (hex, a) => `rgba(${rgbOf(hex).join(", ")}, ${a})`;
const BASE = {
  grid: "dots", // "dots" | "lines" | "blocks"
  wallStyle: "glow", // "glow" (resplandor desde el borde) | "solid" (marco de píxel)
  snakeStyle: "tube", // "tube" | "segments" | "blocks"
  fruitStyle: "sprite", // "sprite" | "tones" (sprite cuantizado a C.tones)
  fruitOutline: null, // filtro CSS para perfilar los sprites sobre fondo claro
  glow: 1, // multiplicador de shadowBlur
  textGlow: 0, // shadowBlur del texto del HUD
  tones: null,
  scan: null, // color de las scanlines (null = sin scanlines)
};
const SKINS = {
  clasico: {
    oscuro: {
      ...BASE,
      bg: "#0a0a0f",
      hud: "#0f0f1a",
      ink: "#e6e9ff",
      inkDim: "#8a8fb5",
      score: "#00f5ff",
      levelInk: "#f5ff00",
      pip: "#00ff88",
      gridColor: "rgba(0, 245, 255, 0.16)",
      wall: "#ff006e",
      wallFlash: "#f5ff00",
      halo: "#ff006e",
      fruitAlt: "#ff006e",
      head: "#00ff88",
      tail: "#0a7a4e",
      core: "rgba(0, 255, 136, 0.55)",
      deadHead: "#8a8fb5",
      deadTail: "#2a2d40",
      deadCore: "rgba(138, 143, 181, 0.35)",
      eye: "#0a0a0f",
      overlay: "rgba(10, 10, 15, 0.75)",
      title: "#ff006e",
    },
    claro: {
      ...BASE,
      bg: "#f2f3f7",
      hud: "#e3e5ee",
      ink: "#1a1a2e",
      inkDim: "#4a4f70",
      score: "#006b75",
      levelInk: "#6b5f00",
      pip: "#00754a",
      gridColor: "rgba(0, 107, 117, 0.28)",
      wall: "#c8005a",
      wallFlash: "#8a7a00",
      halo: "#c8005a",
      fruitAlt: "#c8005a",
      head: "#00754a",
      tail: "#008a5c",
      core: "rgba(255, 255, 255, 0.4)",
      deadHead: "#6a6f8a",
      deadTail: "#b9bccb",
      deadCore: "rgba(255, 255, 255, 0.45)",
      eye: "#f2f3f7",
      overlay: "rgba(242, 243, 247, 0.8)",
      title: "#c8005a",
      fruitOutline: "drop-shadow(0 0 1px #1a1a2e)",
      glow: 0.25,
    },
  },
  neon: {
    oscuro: {
      ...BASE,
      grid: "lines",
      snakeStyle: "segments",
      bg: "#0a0a0f",
      hud: "#0f0f1a",
      ink: "#e6e9ff",
      inkDim: "#8a8fb5",
      score: "#00f5ff",
      levelInk: "#ff4d9a",
      pip: "#f5ff00",
      gridColor: "rgba(255, 0, 110, 0.12)",
      wall: "#e8005f",
      wallFlash: "#f5ff00",
      halo: "#f5ff00",
      fruitAlt: "#f5ff00",
      head: "#00f5ff",
      tail: "#007a85",
      core: "rgba(0, 245, 255, 0.45)",
      deadHead: "#8a8fb5",
      deadTail: "#2a2d40",
      deadCore: "rgba(138, 143, 181, 0.35)",
      eye: "#0a0a0f",
      overlay: "rgba(10, 10, 15, 0.75)",
      title: "#ff006e",
      glow: 1.3,
      textGlow: 4,
    },
    claro: {
      ...BASE,
      grid: "lines",
      snakeStyle: "segments",
      bg: "#eef0fa",
      hud: "#e0e3f2",
      ink: "#1a1a2e",
      inkDim: "#4a4f70",
      score: "#006b75",
      levelInk: "#a8004a",
      pip: "#6b5f00",
      gridColor: "rgba(200, 0, 90, 0.12)",
      wall: "#c8005a",
      wallFlash: "#6b5f00",
      halo: "#6b5f00",
      fruitAlt: "#6b5f00",
      head: "#007f8a",
      tail: "#178c96",
      core: "rgba(0, 127, 138, 0.45)",
      deadHead: "#6a6f8a",
      deadTail: "#b9bccb",
      deadCore: "rgba(255, 255, 255, 0.45)",
      eye: "#eef0fa",
      overlay: "rgba(238, 240, 250, 0.8)",
      title: "#c8005a",
      fruitOutline: "drop-shadow(0 0 1px #1a1a2e)",
      glow: 0.25,
    },
  },
  retro: {
    oscuro: {
      ...BASE,
      grid: "blocks",
      wallStyle: "solid",
      snakeStyle: "blocks",
      fruitStyle: "tones",
      bg: "#071108",
      hud: "#1e3a1b",
      ink: "#d4f7a0",
      inkDim: "#4f8a2c",
      score: "#d4f7a0",
      levelInk: "#d4f7a0",
      pip: "#d4f7a0",
      gridColor: "#1e3a1b",
      wall: "#4f8a2c",
      wallFlash: "#d4f7a0",
      halo: null,
      fruitAlt: "#4f8a2c",
      head: "#d4f7a0",
      tail: "#4f8a2c",
      core: "#d4f7a0",
      deadHead: "#4f8a2c",
      deadTail: "#1e3a1b",
      deadCore: "#4f8a2c",
      eye: "#071108",
      overlay: "rgba(7, 17, 8, 0.8)",
      title: "#d4f7a0",
      glow: 0,
      tones: ["#071108", "#1e3a1b", "#4f8a2c", "#d4f7a0"],
      scan: "rgba(0, 0, 0, 0.2)",
    },
    claro: {
      ...BASE,
      grid: "blocks",
      wallStyle: "solid",
      snakeStyle: "blocks",
      fruitStyle: "tones",
      bg: "#9bbc0f",
      hud: "#8bac0f",
      ink: "#0f380f",
      inkDim: "#306230",
      score: "#0f380f",
      levelInk: "#0f380f",
      pip: "#0f380f",
      gridColor: "#8bac0f",
      wall: "#306230",
      wallFlash: "#0f380f",
      halo: null,
      fruitAlt: "#306230",
      head: "#0f380f",
      tail: "#306230",
      core: "#0f380f",
      deadHead: "#306230",
      deadTail: "#8bac0f",
      deadCore: "#306230",
      eye: "#9bbc0f",
      overlay: "rgba(155, 188, 15, 0.8)",
      title: "#0f380f",
      glow: 0,
      tones: ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"],
      scan: "rgba(15, 56, 15, 0.08)",
    },
  },
};
let C = SKINS.clasico.oscuro;
// Frutas recoloreadas a los tonos de la skin retro (kind → lienzo); se vacía en applySkin.
let toneFruits = new Map();
// Cachés de dibujo (rendimiento, como FROGGER en el SPEC 12); se vacían en applySkin:
// bgLayer = fondo, retícula y pared en reposo; sprites = frutas con su perfil
// (filter) y bloques de la serpiente con su brillo (shadowBlur) ya pintados.
let bgLayer = null;
const sprites = new Map();
function applySkin(skin, mode) {
  const s = SKINS[skin] ? skin : "clasico";
  const m = mode === "claro" ? "claro" : "oscuro";
  C = SKINS[s][m];
  document.documentElement.dataset.skin = s;
  document.documentElement.dataset.mode = m;
  toneFruits = new Map();
  bgLayer = null;
  sprites.clear();
  if (document.fonts) document.fonts.load(`14px ${FONT}`).catch(() => {});
}
// Abierto directamente: /games/snake/index.html?skin=retro&mode=claro
const params = new URLSearchParams(location.search);
applySkin(params.get("skin"), params.get("mode"));
// ── Sprites de frutas ───────────────────────────────────────────────────────
const ATLAS = window.SPRITE_ATLAS;
const FRUIT_KEYS = ATLAS ? Object.keys(ATLAS.fruits) : [];
const fruitImg = new Image();
let fruitImgReady = false;
// Recorte ajustado de cada fruta: los recortes del atlas dejan mucho margen
// transparente y el dibujo quedaría diminuto en la celda.
const FRUIT_TRIM = {};
fruitImg.onload = () => {
  fruitImgReady = true;
  try {
    const off = document.createElement("canvas");
    off.width = fruitImg.naturalWidth;
    off.height = fruitImg.naturalHeight;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(fruitImg, 0, 0);
    for (const k of FRUIT_KEYS) {
      const a = ATLAS.fruits[k];
      const px = octx.getImageData(a.x, a.y, a.w, a.h).data;
      let x0 = a.w,
        y0 = a.h,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < a.h; y++)
        for (let x = 0; x < a.w; x++)
          if (px[(y * a.w + x) * 4 + 3] > 16) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 >= 0)
        FRUIT_TRIM[k] = {
          x: a.x + x0,
          y: a.y + y0,
          w: x1 - x0 + 1,
          h: y1 - y0 + 1,
        };
    }
  } catch {
    // Abierto como file:// el lienzo queda contaminado: se usa el recorte del atlas.
  }
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
  } else if (type === "av:skin") {
    applySkin(e.data.skin, e.data.mode);
  } else if (type === "av:key") {
    pressKey(e.data.code, e.data.down);
  }
});
// Mando táctil de la plataforma (SPEC 10): av:key se convierte en una tecla
// sintética que procesan los manejadores de teclado de siempre.
const KEY_OF = {
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Space: " ",
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
// Brillo neón: shadowBlur escalado por C.glow (0 en retro).
function glow(color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * C.glow;
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
// ── Cachés de dibujo ─────────────────────────────────────────────────────────
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
// Ejecuta fn con ctx apuntando a otro lienzo (las funciones de dibujo usan ctx).
function paintOn(target, fn) {
  const prev = ctx;
  ctx = target.getContext("2d");
  fn();
  ctx = prev;
}
// Fondo, retícula y pared sin destello, pintados una vez por skin.
function buildBgLayer() {
  const layer = makeCanvas(W, H);
  paintOn(layer, () => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawBoard(Infinity); // Infinity = sin destello de nivel
  });
  return layer;
}
// Fruta encajada en la celda con su perfil de modo claro (ctx.filter, muy caro
// por frame) ya aplicado. Se dibuja en (x - pad, y - pad) de la celda.
const FRUIT_PAD = 4;
function fruitSprite(kind, crop) {
  const key = `fruit:${kind}`;
  let img = sprites.get(key);
  if (img) return img;
  img = makeCanvas(CELL + FRUIT_PAD * 2, CELL + FRUIT_PAD * 2);
  paintOn(img, () => {
    const box = CELL - 4;
    const s = Math.min(box / crop.w, box / crop.h);
    const dw = crop.w * s;
    const dh = crop.h * s;
    ctx.imageSmoothingEnabled = false;
    if (C.fruitOutline) ctx.filter = C.fruitOutline;
    ctx.drawImage(
      fruitImg,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
      FRUIT_PAD + (CELL - dw) / 2,
      FRUIT_PAD + (CELL - dh) / 2,
      dw,
      dh,
    );
  });
  sprites.set(key, img);
  return img;
}
// Bloque redondeado de la serpiente con su brillo (glow) ya pintado. El margen
// cubre el desenfoque de la sombra (≈ 1,5 × shadowBlur).
function blockSprite(fill, shadow, blur, size, r) {
  const key = `block:${fill}:${shadow}:${blur}:${size}:${r}`;
  let sp = sprites.get(key);
  if (sp) return sp;
  const pad = Math.ceil(blur * C.glow * 1.5) + 2;
  const img = makeCanvas(size + pad * 2, size + pad * 2);
  paintOn(img, () => {
    if (blur) glow(shadow, blur);
    ctx.fillStyle = fill;
    roundRect(pad, pad, size, size, r);
  });
  sp = { img, pad };
  sprites.set(key, sp);
  return sp;
}
function drawBlock(x, y, fill, shadow, blur, size, r) {
  const sp = blockSprite(fill, shadow, blur, size, r);
  ctx.drawImage(sp.img, x - sp.pad, y - sp.pad);
}
function drawGrid() {
  ctx.fillStyle = C.gridColor;
  const top = HUD_H;
  const bottom = HUD_H + ROWS * CELL;
  if (C.grid === "lines") {
    // Retícula completa de líneas finas (skin neón).
    for (let x = 1; x < COLS; x++) ctx.fillRect(cellX(x), top, 1, bottom - top);
    for (let y = 1; y < ROWS; y++) ctx.fillRect(0, cellY(y), W, 1);
    return;
  }
  // Puntos en las intersecciones (bloques de 4 px en retro).
  const s = C.grid === "blocks" ? 4 : 2;
  for (let y = 1; y < ROWS; y++)
    for (let x = 1; x < COLS; x++)
      ctx.fillRect(cellX(x) - s / 2, cellY(y) - s / 2, s, s);
}
function drawBoard(now) {
  drawGrid();
  const flash = Math.max(0, 1 - (now - levelFlash) / 700);
  const top = HUD_H;
  const bottom = HUD_H + ROWS * CELL;
  if (C.wallStyle === "solid") {
    // Marco de píxel duro; al subir de nivel parpadea al tono más fuerte.
    ctx.fillStyle =
      flash > 0 && Math.floor(flash * 6) % 2 ? C.wallFlash : C.wall;
    ctx.fillRect(0, top, W, 4);
    ctx.fillRect(0, bottom - 4, W, 4);
    ctx.fillRect(0, top, 4, bottom - top);
    ctx.fillRect(W - 4, top, 4, bottom - top);
    return;
  }
  // Pared: resplandor que entra desde los bordes (el marco CRT de la plataforma
  // recorta las esquinas, así que una línea fina no bastaría). Destella al
  // subir de nivel.
  const rgb = mix(C.wall, C.wallFlash, flash);
  const a = (v) => rgb.replace("rgb", "rgba").replace(")", `, ${v})`);
  const depth = 22 + flash * 14;
  const band = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, a(0.55 + flash * 0.3));
    g.addColorStop(1, a(0));
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  band(0, top, 0, top + depth, 0, top, W, depth);
  band(0, bottom, 0, bottom - depth, 0, bottom - depth, W, depth);
  band(0, 0, depth, 0, 0, top, depth, bottom - top);
  band(W, 0, W - depth, 0, W - depth, top, depth, bottom - top);
  ctx.fillStyle = a(1);
  ctx.fillRect(0, top, W, 3);
  ctx.fillRect(0, bottom - 3, W, 3);
  ctx.fillRect(0, top, 3, bottom - top);
  ctx.fillRect(W - 3, top, 3, bottom - top);
}
// Sprite de fruta cuantizado a 18×18 px y a los tonos de la paleta (skin retro):
// el contorno oscuro del sprite cae en el tono 1 y el relleno en los tonos 2-3.
const TONE_RES = 18;
function toneFruit(kind, crop) {
  if (toneFruits.has(kind)) return toneFruits.get(kind);
  let out = document.createElement("canvas");
  try {
    out.width = out.height = TONE_RES;
    const o = out.getContext("2d", { willReadFrequently: true });
    const s = Math.min(TONE_RES / crop.w, TONE_RES / crop.h);
    const dw = crop.w * s;
    const dh = crop.h * s;
    o.drawImage(
      fruitImg,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
      (TONE_RES - dw) / 2,
      (TONE_RES - dh) / 2,
      dw,
      dh,
    );
    const img = o.getImageData(0, 0, TONE_RES, TONE_RES);
    const px = img.data;
    const tones = C.tones.map(rgbOf);
    // En modo claro la tinta fuerte es la oscura: se invierte la luminancia.
    const dark = rgbOf(C.bg).reduce((t, v) => t + v, 0) < 384;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 110) {
        px[i + 3] = 0;
        continue;
      }
      const l = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      const ink = dark ? l : 1 - l;
      const t = tones[ink < 0.2 ? 1 : ink < 0.55 ? 2 : 3];
      px[i] = t[0];
      px[i + 1] = t[1];
      px[i + 2] = t[2];
      px[i + 3] = 255;
    }
    o.putImageData(img, 0, 0);
  } catch {
    out = null; // lienzo contaminado (file://): se dibuja el bloque de reserva
  }
  toneFruits.set(kind, out);
  return out;
}
function drawFruit(now) {
  if (!fruit) return;
  const x = cellX(fruit.x);
  const y = cellY(fruit.y);
  if (C.halo) {
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
    halo.addColorStop(0, rgba(C.halo, 0.22 + pulse * 0.18));
    halo.addColorStop(1, rgba(C.halo, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(x - CELL / 2, y - CELL / 2, CELL * 2, CELL * 2);
  }
  const crop =
    fruit.kind && (FRUIT_TRIM[fruit.kind] || ATLAS.fruits[fruit.kind]);
  const tile =
    fruitImgReady && crop && C.fruitStyle === "tones"
      ? toneFruit(fruit.kind, crop)
      : null;
  ctx.imageSmoothingEnabled = false;
  if (tile) {
    // 18 px escalados ×2: píxel duro de 2 px.
    ctx.drawImage(tile, x + 2, y + 2, CELL - 4, CELL - 4);
  } else if (fruitImgReady && crop && C.fruitStyle === "sprite") {
    // Recorte encajado en la celda (proporción, sin suavizado), cacheado.
    ctx.drawImage(fruitSprite(fruit.kind, crop), x - FRUIT_PAD, y - FRUIT_PAD);
  } else {
    glow(C.fruitAlt, 14);
    ctx.fillStyle = C.fruitAlt;
    ctx.fillRect(x + 11, y + 11, CELL - 22, CELL - 22);
    ctx.shadowBlur = 0;
  }
}
// Ojos mirando hacia donde avanza la cabeza.
function drawEyes(hs, size) {
  const d = DIRS[dir];
  const ex = cellX(hs.x) + CELL / 2 + d.x * 7;
  const ey = cellY(hs.y) + CELL / 2 + d.y * 7;
  const ox = d.y !== 0 ? 7 : 0;
  const oy = d.x !== 0 ? 7 : 0;
  ctx.fillStyle = C.eye;
  ctx.fillRect(ex - ox - size / 2, ey - oy - size / 2, size, size);
  ctx.fillRect(ex + ox - size / 2, ey + oy - size / 2, size, size);
}
function drawSnake() {
  // Muerta se apaga para no confundirse con la pared.
  const dead = state === "gameover";
  const head = dead ? C.deadHead : C.head;
  const tail = dead ? C.deadTail : C.tail;
  const core = dead ? C.deadCore : C.core;
  const n = snake.length;
  const cx = (s) => cellX(s.x) + CELL / 2;
  const cy = (s) => cellY(s.y) + CELL / 2;
  const hs = snake[0];
  if (C.snakeStyle === "blocks") {
    // Cadena de bloques de 32 px unidos por puentes, con el centro en el tono
    // medio en el cuerpo y maciza en la cabeza. Sin brillo.
    for (let i = n - 1; i >= 0; i--) {
      const s = snake[i];
      const x = cellX(s.x);
      const y = cellY(s.y);
      ctx.fillStyle = head;
      ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
      if (i < n - 1) {
        const p = snake[i + 1];
        if (p.x !== s.x)
          ctx.fillRect(cellX(Math.min(s.x, p.x)) + CELL - 4, y + 12, 8, 16);
        else ctx.fillRect(x + 12, cellY(Math.min(s.y, p.y)) + CELL - 4, 16, 8);
      }
      if (i > 0) {
        ctx.fillStyle = tail;
        ctx.fillRect(x + 12, y + 12, 16, 16);
      }
    }
    drawEyes(hs, 8);
    return;
  }
  if (C.snakeStyle === "segments") {
    // Cadena de luz: hilo fino por los centros y un bloque redondeado por celda
    // que se apaga de la cabeza a la cola.
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = core;
    ctx.beginPath();
    ctx.moveTo(cx(snake[n - 1]), cy(snake[n - 1]));
    for (let i = n - 2; i >= 0; i--) ctx.lineTo(cx(snake[i]), cy(snake[i]));
    ctx.stroke();
    for (let i = n - 1; i >= 1; i--) {
      const s = snake[i];
      const fill = mix(head, tail, Math.min(1, i / Math.max(6, n - 1)));
      const x = cellX(s.x) + 6;
      drawBlock(x, cellY(s.y) + 6, fill, head, dead ? 0 : 10, CELL - 12, 6);
    }
    const hx = cellX(hs.x) + 3;
    drawBlock(hx, cellY(hs.y) + 3, head, head, dead ? 0 : 20, CELL - 6, 8);
    drawEyes(hs, 6);
    return;
  }
  // Tubo neón: un solo trazo por los centros, de la cola a la cabeza.
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(cx(snake[n - 1]), cy(snake[n - 1]));
    for (let i = n - 2; i >= 0; i--) ctx.lineTo(cx(snake[i]), cy(snake[i]));
    ctx.stroke();
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 26;
  ctx.strokeStyle = tail;
  if (!dead) glow(C.head, 12);
  body();
  ctx.shadowBlur = 0;
  // Brillo central del tubo.
  ctx.strokeStyle = core;
  ctx.lineWidth = 8;
  body();
  // Cabeza: algo más ancha que el cuerpo.
  const hx = cellX(hs.x) + 3;
  drawBlock(hx, cellY(hs.y) + 3, head, C.head, dead ? 0 : 18, CELL - 6, 11);
  drawEyes(hs, 6);
}
function drawHUD() {
  ctx.fillStyle = C.hud;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.font = `14px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.save();
  ctx.shadowBlur = C.textGlow;
  ctx.shadowColor = C.score;
  ctx.fillStyle = C.score;
  ctx.fillText(`SCORE ${score}`, 18, HUD_H / 2 + 1);
  ctx.textAlign = "center";
  ctx.shadowColor = C.levelInk;
  ctx.fillStyle = C.levelInk;
  ctx.fillText(`NIVEL ${level}`, W / 2, HUD_H / 2 + 1);
  ctx.restore();
  // Frutas que faltan para el siguiente nivel.
  const got = eaten % FRUITS_PER_LEVEL;
  for (let i = 0; i < FRUITS_PER_LEVEL; i++) {
    const x = W - 18 - (FRUITS_PER_LEVEL - i) * 20 + 6;
    if (i < got) {
      ctx.fillStyle = C.pip;
      ctx.fillRect(x, 14, 12, 12);
    } else {
      ctx.strokeStyle = C.tones ? C.inkDim : rgba(C.pip, 0.4);
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
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  glow(C.title, 18);
  ctx.fillStyle = C.title;
  ctx.font = `36px ${FONT}`;
  ctx.fillText(title, W / 2, H / 2 - 24);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.inkDim;
  ctx.font = `12px ${FONT}`;
  ctx.fillText(sub, W / 2, H / 2 + 28);
}
// Scanlines tenues de la pantalla de fósforo (skin retro).
function drawScanlines() {
  ctx.fillStyle = C.scan;
  for (let y = 2; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}
function draw(now) {
  ctx.shadowBlur = 0;
  if (now - levelFlash < 700) {
    // Destello de subida de nivel: la pared se pinta en vivo.
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawBoard(now);
  } else {
    if (!bgLayer) bgLayer = buildBgLayer();
    ctx.drawImage(bgLayer, 0, 0);
  }
  drawFruit(now);
  drawSnake();
  drawHUD();
  if (state === "playing" && !started) drawStartHint(now);
  // Embebido, la plataforma muestra su propia pausa y su modal de fin.
  if (!EMBEDDED) {
    if (paused) drawOverlay("PAUSA", "P PARA CONTINUAR");
    else if (state === "gameover")
      drawOverlay("GAME OVER", `PUNTAJE ${score} — ESPACIO PARA REINICIAR`);
  }
  if (C.scan) drawScanlines();
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
