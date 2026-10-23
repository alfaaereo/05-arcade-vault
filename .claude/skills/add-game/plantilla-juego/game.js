"use strict";
// Plantilla de /add-game: juego mínimo con el protocolo av:* de Arcade Vault ya integrado.
// Mecánica de ejemplo: mueve la nave con las flechas, recoge núcleos cian (+100) y
// esquiva los bloques magenta. Sustitúyela por la del juego nuevo.
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
// Paleta del tema neón del Vault (app/globals.css). El iframe no ve las variables CSS.
const C = {
  bg: "#0a0a0f",
  ink: "#e6e9ff",
  inkDim: "#8a8fb5",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  yellow: "#f5ff00",
  green: "#00ff88",
};
const FONT = '"Press Start 2P", monospace';
// ── Entrada ──────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};
const GAME_KEYS = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
window.addEventListener("keydown", (e) => {
  // Evita que Espacio y las flechas hagan scroll en la página.
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  if (!keys[e.code]) justPressed[e.code] = true;
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
// Si el foco sale del juego (p. ej. clic en PAUSA de la plataforma) se pierde el keyup.
function clearKeys() {
  for (const k in keys) keys[k] = false;
  for (const k in justPressed) justPressed[k] = false;
}
window.addEventListener("blur", clearKeys);
function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}
// ── Utilidades ───────────────────────────────────────────────────────────────
const rand = (min, max) => min + Math.random() * (max - min);
const MAX_SCORE = 10000000; // límite de la tabla leaderboard (SPEC 06)
// ── Estado ───────────────────────────────────────────────────────────────────
let state; // 'playing' | 'gameover'
let score, lives, level, elapsed, hurt;
let player, orbs, blocks, spawnTimer;
let lastTime = null;
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
function initGame() {
  score = 0;
  lives = 3;
  level = 1;
  elapsed = 0;
  hurt = 0;
  player = { x: W / 2, y: H - 70, r: 16, speed: 340 };
  orbs = [];
  blocks = [];
  spawnTimer = 0;
  state = "playing";
  paused = false;
  gameOverSent = false;
}
// ── Lógica ───────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === "gameover") {
    // Embebido, el reinicio lo decide la plataforma (av:restart).
    if (pressed("Space") && !EMBEDDED) initGame();
    return;
  }
  elapsed += dt;
  level = 1 + Math.floor(elapsed / 20);
  if (hurt > 0) hurt -= dt;
  const dx = (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0);
  const dy = (keys["ArrowDown"] ? 1 : 0) - (keys["ArrowUp"] ? 1 : 0);
  player.x = Math.max(
    player.r,
    Math.min(W - player.r, player.x + dx * player.speed * dt),
  );
  player.y = Math.max(
    80,
    Math.min(H - player.r, player.y + dy * player.speed * dt),
  );
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = Math.max(0.25, 0.9 - level * 0.08);
    const speed = 140 + level * 30;
    if (Math.random() < 0.35)
      orbs.push({ x: rand(20, W - 20), y: -20, r: 10, vy: speed * 0.8 });
    else
      blocks.push({ x: rand(20, W - 20), y: -20, s: rand(22, 40), vy: speed });
  }
  for (const o of orbs) o.y += o.vy * dt;
  for (const b of blocks) b.y += b.vy * dt;
  for (const o of orbs) {
    if (Math.hypot(o.x - player.x, o.y - player.y) < o.r + player.r) {
      o.dead = true;
      score += 100 * level;
    }
  }
  if (hurt <= 0) {
    for (const b of blocks) {
      const half = b.s / 2;
      if (
        Math.abs(b.x - player.x) < half + player.r * 0.7 &&
        Math.abs(b.y - player.y) < half + player.r * 0.7
      ) {
        b.dead = true;
        lives--;
        hurt = 1.5;
        if (lives <= 0) endGame();
        break;
      }
    }
  }
  orbs = orbs.filter((o) => !o.dead && o.y < H + 30);
  blocks = blocks.filter((b) => !b.dead && b.y < H + 50);
}
// ── Dibujo ───────────────────────────────────────────────────────────────────
function glow(color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function drawGrid() {
  ctx.strokeStyle = "rgba(0, 245, 255, 0.07)";
  ctx.lineWidth = 1;
  const off = (elapsed * 40) % 40;
  for (let y = off; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
}
function drawHUD() {
  ctx.shadowBlur = 0;
  ctx.font = `14px ${FONT}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = C.cyan;
  ctx.fillText(`SCORE ${score}`, 18, 18);
  ctx.textAlign = "center";
  ctx.fillStyle = C.yellow;
  ctx.fillText(`NIVEL ${level}`, W / 2, 18);
  ctx.textAlign = "right";
  ctx.fillStyle = C.magenta;
  ctx.fillText("♥".repeat(Math.max(0, lives)), W - 18, 18);
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
function draw() {
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawGrid();
  glow(C.cyan, 14);
  ctx.fillStyle = C.cyan;
  for (const o of orbs) {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  }
  glow(C.magenta, 14);
  ctx.strokeStyle = C.magenta;
  ctx.lineWidth = 3;
  for (const b of blocks)
    ctx.strokeRect(b.x - b.s / 2, b.y - b.s / 2, b.s, b.s);
  // Nave: parpadea mientras es invulnerable.
  if (!(hurt > 0 && Math.floor(hurt * 10) % 2 === 0)) {
    glow(C.yellow, 16);
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
  }
  drawHUD();
  if (state === "gameover" && !EMBEDDED)
    drawOverlay("GAME OVER", `PUNTAJE ${score} — ESPACIO PARA REINICIAR`);
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
