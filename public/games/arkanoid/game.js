const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (800 - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;
const paddle = { x: 0, y: 560, w: 81, h: 14 };
const ball = { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 };
const bounceSound = new Audio("assets/sounds/ball-bounce.mp3");
const breakSound = new Audio("assets/sounds/break-sound.mp3");
// El navegador bloquea el audio hasta la primera interacción: sin errores en consola.
function playSound(sound) {
  sound
    .cloneNode()
    .play()
    .catch(() => {});
}
let blocks = [];
let explosions = [];
let lives = 3;
let score = 0;
let gameState = "playing";
let currentLevel = 1;
let isPaused = false;
const keys = { ArrowLeft: false, ArrowRight: false };
// ── Skins (contrato av:skin) ──────────────────────────────────────────────────
// El dibujo solo lee la paleta activa C. Todas las paletas tienen las mismas claves.
// C.style elige cómo se pinta la escena: "sprite" (spritesheet original),
// "neon" (vectorial con brillo) o "retro" (píxel duro de 4 tonos, sin imágenes).
const MONO = {
  hud: "bold 18px monospace",
  title: "bold 64px monospace",
  pause: "bold 56px monospace",
  small: "bold 16px monospace",
  btn: "bold 20px monospace",
};
const PIXEL = {
  hud: '14px "Press Start 2P", monospace',
  title: '30px "Press Start 2P", monospace',
  pause: '36px "Press Start 2P", monospace',
  small: '10px "Press Start 2P", monospace',
  btn: '14px "Press Start 2P", monospace',
};
const ORIGINAL_BLOCKS = {
  red: "red",
  yellow: "yellow",
  cyan: "cyan",
  magenta: "magenta",
  hotpink: "hotpink",
  green: "green",
  gray: "gray",
};
const BASE = {
  style: "sprite",
  font: MONO,
  outline: null, // contorno de los sprites (clásico claro) o null
  grid: null, // retícula de fondo (null = sin retícula)
  glow: 0, // shadowBlur de las figuras
  textGlow: 0, // shadowBlur del texto
  pixel: 1, // tamaño del píxel de la skin retro (1 = sin rejilla)
  scan: null, // scanlines (null = sin scanlines)
  blockFill: 1, // opacidad del relleno de los ladrillos vectoriales
  blocks: ORIGINAL_BLOCKS, // color de cada ladrillo (solo vectoriales)
  blockDetail: "#000", // tinta de los motivos de ladrillo y pala (retro)
  spark: null, // color de las explosiones (null = el del ladrillo)
  paddle: "#fff",
  ball: "#fff",
  veil: "rgba(0, 0, 0, 0.6)",
  veilPause: "rgba(0, 0, 0, 0.65)",
  btn: "#444",
  btnInk: "#fff",
  btnActive: "#f0c040",
  btnActiveInk: "#000",
  btnStroke: "#fff",
};
const RETRO_DARK = ["#071108", "#1e3a1b", "#4f8a2c", "#d4f7a0"];
const RETRO_LIGHT = ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"];
const retroPalette = (t, scan) => ({
  ...BASE,
  style: "retro",
  font: PIXEL,
  pixel: 4,
  scan,
  bg: t[0],
  ink: t[3],
  blocks: Object.fromEntries(
    Object.keys(ORIGINAL_BLOCKS).map((k) => [k, t[2]]),
  ),
  blockDetail: t[1],
  spark: t[3],
  paddle: t[2],
  ball: t[3],
  veil: t[0] + "cc",
  veilPause: t[0] + "d9",
  btn: t[1],
  btnInk: t[3],
  btnActive: t[3],
  btnActiveInk: t[0],
  btnStroke: t[3],
});
const SKINS = {
  clasico: {
    oscuro: { ...BASE, bg: "#000", ink: "#fff" },
    claro: {
      ...BASE,
      bg: "#f2efe6",
      ink: "#111",
      outline: "#111",
      paddle: "#111",
      ball: "#111",
      veil: "rgba(242, 239, 230, 0.7)",
      veilPause: "rgba(242, 239, 230, 0.78)",
      btn: "#d8d3c4",
      btnInk: "#111",
      btnActive: "#c98a00",
      btnActiveInk: "#111",
      btnStroke: "#111",
    },
  },
  neon: {
    oscuro: {
      ...BASE,
      style: "neon",
      font: PIXEL,
      bg: "#0a0a0f",
      ink: "#e6e9ff",
      grid: "rgba(0, 245, 255, 0.06)",
      glow: 12,
      textGlow: 4,
      blockFill: 0.28,
      blocks: {
        red: "#ff3355",
        yellow: "#f5ff00",
        cyan: "#00ff88",
        magenta: "#b026ff",
        hotpink: "#ff8c1a",
        green: "#00f5ff",
        gray: "#8a8fb5",
      },
      paddle: "#ff006e",
      ball: "#f5ff00",
      veil: "rgba(10, 10, 15, 0.72)",
      veilPause: "rgba(10, 10, 15, 0.78)",
      btn: "#1a1a2e",
      btnInk: "#e6e9ff",
      btnActive: "#00f5ff",
      btnActiveInk: "#0a0a0f",
      btnStroke: "#00f5ff",
    },
    claro: {
      ...BASE,
      style: "neon",
      font: PIXEL,
      bg: "#eef0fa",
      ink: "#1a1a2e",
      grid: "rgba(0, 127, 138, 0.09)",
      glow: 3,
      blockFill: 0.2,
      blocks: {
        red: "#c8102e",
        yellow: "#6b5f00",
        cyan: "#00754a",
        magenta: "#6a1fc0",
        hotpink: "#b35900",
        green: "#007f8a",
        gray: "#4a4f70",
      },
      paddle: "#c8005a",
      ball: "#0a0a0f",
      veil: "rgba(238, 240, 250, 0.75)",
      veilPause: "rgba(238, 240, 250, 0.82)",
      btn: "#dde0f0",
      btnInk: "#1a1a2e",
      btnActive: "#007f8a",
      btnActiveInk: "#fff",
      btnStroke: "#1a1a2e",
    },
  },
  retro: {
    oscuro: retroPalette(RETRO_DARK, "rgba(0, 0, 0, 0.22)"),
    claro: retroPalette(RETRO_LIGHT, "rgba(15, 56, 15, 0.10)"),
  },
};
let C = SKINS.clasico.oscuro;
// Silueta del spritesheet en el color de C.outline (contorno del clásico claro).
let silhouette = null;
function buildSilhouette() {
  silhouette = null;
  if (!C.outline || !ssLoaded) return;
  const sc = document.createElement("canvas");
  sc.width = ssImg.width;
  sc.height = ssImg.height;
  const sctx = sc.getContext("2d");
  sctx.drawImage(ssImg, 0, 0);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = C.outline;
  sctx.fillRect(0, 0, sc.width, sc.height);
  silhouette = sc;
}
function applySkin(skin, mode) {
  const s = SKINS[skin] ? skin : "clasico";
  const m = mode === "claro" ? "claro" : "oscuro";
  C = SKINS[s][m];
  document.documentElement.dataset.skin = s;
  document.documentElement.dataset.mode = m;
  buildSilhouette();
  if (C.font === PIXEL && document.fonts)
    document.fonts.load(PIXEL.hud).catch(() => {});
}
// Abierto directamente: /games/arkanoid/index.html?skin=retro&mode=claro
const params = new URLSearchParams(location.search);
applySkin(params.get("skin"), params.get("mode"));
// ── Modo embebido (iframe de Arcade Vault) ──────────────────────────────────
// Protocolo postMessage con la plataforma: recibe av:pause | av:resume |
// av:restart | av:end | av:skin y envía av:gameover con la puntuación.
const EMBEDDED = window.parent !== window;
let gameOverSent = false;
// Fin de partida: 'gameover' (sin vidas) o 'win' (nivel 5 completado).
function endGame(state) {
  gameState = state;
  if (EMBEDDED && !gameOverSent) {
    gameOverSent = true;
    window.parent.postMessage({ type: "av:gameover", score }, location.origin);
  }
}
// Nueva partida desde cero (el original no tiene reinicio; lo usa av:restart).
function initGame() {
  lives = 3;
  score = 0;
  gameState = "playing";
  isPaused = false;
  gameOverSent = false;
  explosions = [];
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  initPaddle();
  loadLevel(1);
}
window.addEventListener("message", (e) => {
  if (!EMBEDDED || e.source !== window.parent || e.origin !== location.origin)
    return;
  const type = e.data && e.data.type;
  if (type === "av:pause") {
    if (gameState === "playing") isPaused = true;
  } else if (type === "av:resume") {
    isPaused = false;
    lastTime = null;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
  } else if (type === "av:restart") {
    initGame();
    lastTime = null;
  } else if (type === "av:end") {
    if (gameState === "playing") endGame("gameover");
  } else if (type === "av:skin") {
    applySkin(e.data.skin, e.data.mode);
  } else if (type === "av:key") {
    pressKey(e.data.code, e.data.down);
  }
});
// Mando táctil de la plataforma (SPEC 10): av:key se convierte en una tecla
// sintética que procesan los manejadores de teclado de siempre (aquí, e.key).
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
function initPaddle() {
  paddle.x = (canvas.width - paddle.w) / 2;
}
function initBall() {
  const speed = LEVELS[currentLevel - 1].speed;
  ball.x = paddle.x + (paddle.w - ball.w) / 2;
  ball.y = paddle.y - ball.h;
  ball.vx = BASE_BALL_VX * speed;
  ball.vy = BASE_BALL_VY * speed;
}
function loadLevel(n) {
  currentLevel = n;
  const level = LEVELS[n - 1];
  blocks = level.blocks.map((b) => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }));
  explosions = [];
  ball.x = paddle.x + (paddle.w - ball.w) / 2;
  ball.y = paddle.y - ball.h;
  ball.vx = BASE_BALL_VX * level.speed;
  ball.vy = BASE_BALL_VY * level.speed;
}
function collideAABB(block) {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}
canvas.addEventListener("click", (e) => {
  // Embebido no se puede saltar de nivel: la partida cuenta para el Salón.
  if (!isPaused || EMBEDDED) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  for (let i = 0; i < 5; i++) {
    const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
    if (
      mx >= bx &&
      mx <= bx + PAUSE_BTN_W &&
      my >= PAUSE_BTN_Y &&
      my <= PAUSE_BTN_Y + PAUSE_BTN_H
    ) {
      loadLevel(i + 1);
      isPaused = false;
      return;
    }
  }
});
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  paddle.x = Math.max(
    0,
    Math.min(canvas.width - paddle.w, mouseX - paddle.w / 2),
  );
});
document.addEventListener("keydown", (e) => {
  // Evita que las flechas hagan scroll en la página.
  if (e.key in keys) e.preventDefault();
  if (e.key in keys) keys[e.key] = true;
  // Embebido, la pausa la controla la plataforma (av:pause / av:resume).
  if (
    (e.key === "p" || e.key === "P" || e.key === "Escape") &&
    gameState === "playing" &&
    !EMBEDDED
  ) {
    isPaused = !isPaused;
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key in keys) keys[e.key] = false;
});
function update(dt) {
  if (gameState !== "playing") return;
  // Paddle
  if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
  if (keys.ArrowRight)
    paddle.x = Math.min(canvas.width - paddle.w, paddle.x + PADDLE_SPEED * dt);
  // Ball movement
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  // Wall bounces (left, right, top)
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    playSound(bounceSound);
  }
  if (ball.x + ball.w >= canvas.width) {
    ball.x = canvas.width - ball.w;
    ball.vx = -Math.abs(ball.vx);
    playSound(bounceSound);
  }
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    playSound(bounceSound);
  }
  // Paddle bounce
  if (
    ball.vy > 0 &&
    ball.x + ball.w > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.h >= paddle.y &&
    ball.y + ball.h <= paddle.y + paddle.h + 8
  ) {
    ball.y = paddle.y - ball.h;
    ball.vy = -Math.abs(ball.vy);
    playSound(bounceSound);
  }
  // Block collisions
  for (const block of blocks) {
    if (!block.alive) continue;
    if (collideAABB(block)) {
      block.alive = false;
      explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        elapsed: 0,
      });
      score += 10;
      ball.vy = -ball.vy;
      playSound(breakSound);
      if (blocks.every((b) => !b.alive)) {
        if (currentLevel < 5) loadLevel(currentLevel + 1);
        else endGame("win");
      }
      break; // one block per frame
    }
  }
  // Explosions
  for (const exp of explosions) exp.elapsed += dt * 1000;
  explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);
  // Ball lost
  if (ball.y > canvas.height) {
    lives--;
    if (lives <= 0) {
      lives = 0;
      endGame("gameover");
    } else {
      initBall();
    }
  }
}
// ── Dibujo por skin ─────────────────────────────────────────────────────────
// Brillo neón: shadowBlur con el color de la figura (0 en las skins sin brillo).
function glow(color, blur = C.glow) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
// Retro: coordenadas a la rejilla de píxel duro (sin efecto con C.pixel = 1).
function snap(v) {
  return Math.round(v / C.pixel) * C.pixel;
}
// Sprite con contorno: la silueta, 2 px más grande, va detrás del sprite.
function drawOutlinedSprite(name, x, y, w, h) {
  if (silhouette) {
    const sp = SPRITES[name];
    ctx.drawImage(
      silhouette,
      sp.sx,
      sp.sy,
      sp.sw,
      sp.sh,
      x - 2,
      y - 2,
      w + 4,
      h + 4,
    );
  }
  drawSprite(ctx, name, x, y, w, h);
}
// Motivos de los ladrillos retro (una tinta, como en una portátil de 4 tonos):
// c y r son columna y fila de píxel dentro del ladrillo (15 × 5).
const RETRO_PATTERNS = {
  red: () => false,
  yellow: (c, r) => r === 2 && c % 2 === 1,
  cyan: (c, r) => r === 2 && c > 0 && c < 14,
  magenta: (c, r) =>
    (r === 1 || r === 3) && c > 0 && c < 14
      ? true
      : r === 2 && (c === 1 || c === 13),
  hotpink: (c, r) => r > 0 && r < 4 && (c + r) % 2 === 0,
  green: (c, r) => r > 0 && r < 4 && c % 3 === 1,
  gray: (c, r) =>
    r === 2 || (r < 2 && c === 7) || (r > 2 && (c === 3 || c === 11)),
};
function drawBlock(b) {
  if (C.style === "sprite") {
    if (C.outline) {
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }
    drawSprite(ctx, "block_" + b.color, b.x, b.y, b.w, b.h);
    return;
  }
  const col = C.blocks[b.color];
  if (C.style === "neon") {
    ctx.save();
    ctx.globalAlpha = C.blockFill;
    ctx.fillStyle = col;
    ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    glow(col);
    ctx.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
    ctx.restore();
    return;
  }
  const P = C.pixel;
  const x = snap(b.x);
  const y = snap(b.y);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, b.w - P, b.h - P);
  ctx.fillStyle = C.blockDetail;
  const pattern = RETRO_PATTERNS[b.color] || RETRO_PATTERNS.red;
  const cols = (b.w - P) / P;
  const rows = (b.h - P) / P;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (pattern(c, r)) ctx.fillRect(x + c * P, y + r * P, P, P);
}
function drawExplosion(exp) {
  const t = exp.elapsed / EXPLOSION_DURATION;
  const frameIndex = Math.min(Math.floor(t * 4), 3);
  if (C.style === "sprite") {
    drawFrame(
      ctx,
      EXPLOSION_FRAMES[exp.color][frameIndex],
      exp.x,
      exp.y,
      exp.w,
      exp.h,
    );
    return;
  }
  const col = C.spark || C.blocks[exp.color];
  if (C.style === "neon") {
    const grow = t * 10;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    glow(col);
    ctx.strokeRect(
      exp.x + 3 - grow,
      exp.y + 3 - grow,
      exp.w - 6 + 2 * grow,
      exp.h - 6 + 2 * grow,
    );
    ctx.restore();
    return;
  }
  // Retro: el ladrillo se deshace en píxeles que parpadean por fotogramas.
  const P = C.pixel;
  const x = snap(exp.x);
  const y = snap(exp.y);
  ctx.fillStyle = col;
  for (let r = 0; r < (exp.h - P) / P; r++)
    for (let c = 0; c < (exp.w - P) / P; c++)
      if ((c * 5 + r * 3) % 4 === frameIndex)
        ctx.fillRect(x + c * P, y + r * P, P, P);
}
function drawPaddle() {
  if (C.style === "sprite") {
    drawOutlinedSprite("paddle", paddle.x, paddle.y, paddle.w, paddle.h);
    return;
  }
  if (C.style === "neon") {
    ctx.save();
    ctx.fillStyle = C.paddle;
    glow(C.paddle);
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, paddle.h / 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  // Retro: pala de 3 píxeles de alto con los extremos redondeados y dos bandas.
  const P = C.pixel;
  const x = snap(paddle.x);
  const y = snap(paddle.y);
  const w = snap(paddle.w);
  ctx.fillStyle = C.paddle;
  ctx.fillRect(x + P, y, w - 2 * P, 3 * P);
  ctx.fillRect(x, y + P, w, P);
  ctx.fillStyle = C.blockDetail;
  ctx.fillRect(x + 3 * P, y + P, P, P);
  ctx.fillRect(x + w - 4 * P, y + P, P, P);
}
function drawBall(x, y, size) {
  if (C.style === "sprite") {
    drawOutlinedSprite("ball", x, y, size, size);
    return;
  }
  if (C.style === "neon") {
    ctx.save();
    ctx.fillStyle = C.ball;
    glow(C.ball);
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  // Retro: bola de 4 × 4 píxeles sin las esquinas.
  const P = size / 4;
  const sx = snap(x);
  const sy = snap(y);
  ctx.fillStyle = C.ball;
  ctx.fillRect(sx + P, sy, 2 * P, 4 * P);
  ctx.fillRect(sx, sy + P, 4 * P, 2 * P);
}
function drawGrid() {
  ctx.save();
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < canvas.width; x += 40) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
  }
  for (let y = 40; y < canvas.height; y += 40) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}
function drawScanlines() {
  ctx.save();
  ctx.fillStyle = C.scan;
  for (let y = C.pixel - 1; y < canvas.height; y += C.pixel)
    ctx.fillRect(0, y, canvas.width, 1);
  ctx.restore();
}
function text(str, x, y, font, color) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  glow(color, C.textGlow);
  ctx.fillText(str, x, y);
  ctx.restore();
}
function drawOverlay(message) {
  ctx.fillStyle = C.veil;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  text(message, canvas.width / 2, canvas.height / 2, C.font.title, C.ink);
}
const PAUSE_BTN_W = 60;
const PAUSE_BTN_H = 40;
const PAUSE_BTN_GAP = 12;
const PAUSE_BTN_Y = 340;
const PAUSE_BTN_ROW_X =
  (canvas.width - (5 * PAUSE_BTN_W + 4 * PAUSE_BTN_GAP)) / 2;
function drawPauseOverlay() {
  ctx.fillStyle = C.veilPause;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  text("PAUSA", canvas.width / 2, 260, C.font.pause, C.ink);
  text("Saltar al nivel:", canvas.width / 2, 310, C.font.small, C.ink);
  for (let i = 0; i < 5; i++) {
    const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
    const isActive = i + 1 === currentLevel;
    ctx.fillStyle = isActive ? C.btnActive : C.btn;
    ctx.strokeStyle = C.btnStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      bx,
      PAUSE_BTN_Y,
      PAUSE_BTN_W,
      PAUSE_BTN_H,
      C.style === "retro" ? 0 : 6,
    );
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    text(
      i + 1,
      bx + PAUSE_BTN_W / 2,
      PAUSE_BTN_Y + PAUSE_BTN_H / 2 + (C.font === PIXEL ? 1 : 0),
      C.font.btn,
      isActive ? C.btnActiveInk : C.btnInk,
    );
  }
}
function drawHUD() {
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const y = C.font === PIXEL ? 12 : 10;
  text("Score: " + score, 10, y, C.font.hud, C.ink);
  ctx.textAlign = "center";
  text("Nivel: " + currentLevel, canvas.width / 2, y, C.font.hud, C.ink);
  const ballSize = 16;
  const ballSpacing = 4;
  for (let i = 0; i < lives; i++) {
    const bx = canvas.width - 10 - (lives - i) * (ballSize + ballSpacing);
    drawBall(bx, 10, ballSize);
  }
}
function draw() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (C.grid) drawGrid();
  for (const block of blocks) if (block.alive) drawBlock(block);
  for (const exp of explosions) drawExplosion(exp);
  drawPaddle();
  drawBall(ball.x, ball.y, ball.w);
  if (gameState === "playing") drawHUD();
  if (C.scan) drawScanlines();
  // Embebido, el cierre de partida y la pausa los muestra la plataforma.
  if (EMBEDDED) return;
  if (gameState === "gameover") drawOverlay("GAME OVER");
  if (gameState === "win") drawOverlay("¡Completaste el juego!");
  if (isPaused) drawPauseOverlay();
}
let lastTime = null;
function loop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  // Tope de 50 ms: tras cambiar de pestaña la pelota no atraviesa bloques.
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  if (!isPaused) update(dt);
  draw();
  requestAnimationFrame(loop);
}
loadSpritesheet(() => {
  buildSilhouette();
  initPaddle();
  loadLevel(1);
  requestAnimationFrame(loop);
});
