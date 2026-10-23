"use strict";
const canvas = document.getElementById("canvas");
const screenCtx = canvas.getContext("2d");
let ctx = screenCtx; // contexto de dibujo activo (la skin retro dibuja la escena en baja resolución)
const W = 800;
const H = 600;
// ── Skins (contrato av:skin) ──────────────────────────────────────────────────
// El dibujo solo lee la paleta activa C. Todas las paletas tienen las mismas claves.
const MONO = {
  hud: "15px monospace",
  tag: "bold 12px monospace",
  title: "bold 46px monospace",
  sub: "18px monospace",
};
const PIXEL = {
  hud: '14px "Press Start 2P", monospace',
  tag: '8px "Press Start 2P", monospace',
  title: '32px "Press Start 2P", monospace',
  sub: '11px "Press Start 2P", monospace',
};
const rgb = (hex) => hex.match(/\w\w/g).map((h) => parseInt(h, 16));
const BASE = {
  font: MONO,
  grid: null, // color de la retícula de fondo (null = sin retícula)
  glow: 0, // shadowBlur de las líneas
  textGlow: 0, // shadowBlur del texto
  line: 1, // multiplicador del grosor de línea
  pixel: 1, // >1: escena en baja resolución y reescalada sin suavizado
  tones: null, // tonos a los que se cuantiza la escena (pantalla de fósforo)
  scan: null, // color de las scanlines (null = sin scanlines)
  title: "#fff",
};
const SKINS = {
  clasico: {
    oscuro: {
      ...BASE,
      bg: "#000",
      ink: "#fff",
      inkDim: "rgba(255,255,255,0.65)",
      ship: "#fff",
      rock: "#fff",
      bullet: "#fff",
      power: "#0ff",
      flame: "rgba(255,130,0,0.85)",
      particle: "#fff",
    },
    claro: {
      ...BASE,
      bg: "#f2efe6",
      ink: "#111",
      inkDim: "#55524a",
      ship: "#111",
      rock: "#111",
      bullet: "#111",
      power: "#006b75",
      flame: "rgba(194,65,12,0.9)",
      particle: "#111",
      title: "#111",
    },
  },
  neon: {
    oscuro: {
      ...BASE,
      font: PIXEL,
      bg: "#0a0a0f",
      ink: "#e6e9ff",
      inkDim: "#8a8fb5",
      ship: "#00f5ff",
      rock: "#e8005f",
      bullet: "#f5ff00",
      power: "#00ff88",
      flame: "#f5ff00",
      particle: "#f5ff00",
      title: "#ff006e",
      grid: "rgba(0,245,255,0.06)",
      glow: 12,
      textGlow: 4,
      line: 1.4,
    },
    claro: {
      ...BASE,
      font: PIXEL,
      bg: "#eef0fa",
      ink: "#1a1a2e",
      inkDim: "#4a4f70",
      ship: "#007f8a",
      rock: "#c8005a",
      bullet: "#6b5f00",
      power: "#00754a",
      flame: "#b35900",
      particle: "#c8005a",
      title: "#c8005a",
      grid: "rgba(0,127,138,0.09)",
      glow: 3,
      line: 1.4,
    },
  },
  retro: {
    oscuro: {
      ...BASE,
      font: PIXEL,
      bg: "#071108",
      ink: "#d4f7a0",
      inkDim: "#4f8a2c",
      ship: "#d4f7a0",
      rock: "#4f8a2c",
      bullet: "#d4f7a0",
      power: "#d4f7a0",
      flame: "#4f8a2c",
      particle: "#d4f7a0",
      title: "#d4f7a0",
      line: 1.6,
      pixel: 2,
      tones: ["#071108", "#1e3a1b", "#4f8a2c", "#d4f7a0"].map(rgb),
      scan: "rgba(0,0,0,0.22)",
    },
    claro: {
      ...BASE,
      font: PIXEL,
      bg: "#9bbc0f",
      ink: "#0f380f",
      inkDim: "#306230",
      ship: "#0f380f",
      rock: "#306230",
      bullet: "#0f380f",
      power: "#0f380f",
      flame: "#306230",
      particle: "#0f380f",
      title: "#0f380f",
      line: 1.6,
      pixel: 2,
      tones: ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"].map(rgb),
      scan: "rgba(15,56,15,0.10)",
    },
  },
};
let C = SKINS.clasico.oscuro;
// Lienzo auxiliar de baja resolución para las skins con C.pixel > 1.
const lo = document.createElement("canvas");
const loCtx = lo.getContext("2d", { willReadFrequently: true });
// Caché color → tono de quantize() (la mayoría de píxeles repiten color); se vacía en applySkin.
let toneCache = new Map();
function applySkin(skin, mode) {
  const s = SKINS[skin] ? skin : "clasico";
  const m = mode === "claro" ? "claro" : "oscuro";
  C = SKINS[s][m];
  document.documentElement.dataset.skin = s;
  document.documentElement.dataset.mode = m;
  lo.width = W / C.pixel;
  lo.height = H / C.pixel;
  toneCache = new Map();
  if (C.font === PIXEL && document.fonts)
    document.fonts.load(PIXEL.hud).catch(() => {});
}
// Abierto directamente: /games/asteroids/index.html?skin=retro&mode=claro
const params = new URLSearchParams(location.search);
applySkin(params.get("skin"), params.get("mode"));
// Brillo neón: shadowBlur con el color del trazo (0 en las skins sin brillo).
function glow(color, blur = C.glow) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
// ── Input ─────────────────────────────────────────────────────────────────────
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
// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap = (v, max) => ((v % max) + max) % max;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
// ── Constants ─────────────────────────────────────────────────────────────────
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const TRIPLE_SPREAD = 0.18;
// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
    this.radius = 2;
    this.dead = false;
  }
  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw() {
    ctx.save();
    ctx.fillStyle = C.bullet;
    glow(C.bullet);
    ctx.beginPath();
    if (C.pixel > 1) {
      // Píxel duro: un bloque cuadrado que sobrevive a la cuantización.
      ctx.rect(this.x - 2, this.y - 2, 4, 4);
    } else {
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}
// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño
class Asteroid {
  constructor(x, y, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }
  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = C.rock;
    glow(C.rock);
    ctx.lineWidth = 1.5 * C.line;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl = POWERUP_TTL;
    this.dead = false;
  }
  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  hidden() {
    return this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0;
  }
  draw() {
    if (this.hidden()) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = C.power;
    glow(C.power);
    ctx.lineWidth = 2 * Math.min(C.line, 1.2);
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  // La etiqueta se dibuja a resolución completa, después de la escena.
  drawLabel() {
    if (this.hidden()) return;
    ctx.save();
    ctx.fillStyle = C.power;
    glow(C.power, C.textGlow);
    ctx.font = C.font.tag;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y + (C.font === PIXEL ? 1 : 0));
    ctx.restore();
  }
}
// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() {
    this.tripleShot = 0;
    this.reset();
  }
  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }
  update(dt) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;
    const ROT = 3.5; // rad/s
    const THRUST = 260; // px/s²
    const DRAG = 0.987;
    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;
    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }
    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }
  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }
  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = C.ship;
    glow(C.ship);
    ctx.lineWidth = 1.5 * C.line;
    ctx.lineJoin = "round";
    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();
    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = C.flame;
      glow(C.flame);
      ctx.stroke();
    }
    ctx.restore();
  }
}
// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw() {
    const alpha = this.ttl / this.life;
    ctx.save();
    ctx.globalAlpha = Number(alpha.toFixed(2));
    ctx.strokeStyle = C.particle;
    ctx.lineWidth = C.line;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.restore();
  }
}
// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state; // 'playing' | 'dead' | 'gameover'
let deadTimer;
let powerUpSpawned;
let killsSinceSpawn;
// ── Modo embebido (iframe de Arcade Vault) ────────────────────────────────────
// Protocolo postMessage con la plataforma: recibe av:pause | av:resume |
// av:restart | av:end y envía av:gameover con la puntuación.
const EMBEDDED = window.parent !== window;
let paused = false;
let gameOverSent = false;
function endGame() {
  state = "gameover";
  if (EMBEDDED && !gameOverSent) {
    gameOverSent = true;
    window.parent.postMessage({ type: "av:gameover", score }, location.origin);
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
  } else if (type === "av:skin") {
    // Solo cambia el dibujo: no pausa, no reinicia ni toca la puntuación.
    applySkin(e.data.skin, e.data.mode);
  }
});
function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}
function initGame() {
  ship = new Ship();
  bullets = [];
  asteroids = [];
  particles = [];
  powerUps = [];
  powerUpSpawned = false;
  killsSinceSpawn = 0;
  score = 0;
  lives = 3;
  level = 1;
  state = "playing";
  paused = false;
  gameOverSent = false;
  spawnAsteroids(4);
}
function nextLevel() {
  level++;
  bullets = [];
  particles = [];
  powerUps = [];
  powerUpSpawned = false;
  killsSinceSpawn = 0;
  ship.reset();
  spawnAsteroids(3 + level);
}
function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}
function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    endGame();
  } else {
    state = "dead";
    deadTimer = 2;
  }
}
// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === "gameover") {
    // Embebido, el reinicio lo decide la plataforma (av:restart).
    if (pressed("Space") && !EMBEDDED) initGame();
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
    return;
  }
  if (state === "dead") {
    deadTimer -= dt;
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
    asteroids.forEach((a) => a.update(dt));
    if (deadTimer <= 0) {
      state = "playing";
      ship.reset();
    }
    return;
  }
  // Disparar
  if (pressed("Space")) {
    bullets.push(...ship.tryShoot());
  }
  ship.update(dt);
  bullets.forEach((b) => b.update(dt));
  asteroids.forEach((a) => a.update(dt));
  particles.forEach((p) => p.update(dt));
  powerUps.forEach((p) => p.update(dt));
  bullets = bullets.filter((b) => !b.dead);
  particles = particles.filter((p) => !p.dead);
  powerUps = powerUps.filter((p) => !p.dead);
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.tripleShot = POWERUP_DURATION;
    }
  }
  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (!powerUpSpawned) {
          killsSinceSpawn++;
          const guaranteed = killsSinceSpawn >= 5;
          if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
            powerUps.push(new PowerUp(a.x, a.y));
            powerUpSpawned = true;
          }
        }
      }
    }
  }
  asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
  bullets = bullets.filter((b) => !b.dead);
  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }
  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}
// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = C.ship;
  glow(C.ship, C.textGlow);
  ctx.lineWidth = 1.2 * C.line;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function drawHUD() {
  ctx.save();
  ctx.fillStyle = C.ink;
  glow(C.ink, C.textGlow);
  ctx.font = C.font.hud;
  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${score}`, 14, 26);
  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);
  ctx.restore();
  for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
  if (ship.tripleShot > 0) {
    ctx.save();
    ctx.font = C.font.hud;
    ctx.textAlign = "left";
    ctx.fillStyle = C.power;
    glow(C.power, C.textGlow);
    const y = C.font === PIXEL ? 50 : 46;
    ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, y);
    ctx.restore();
  }
}
function drawOverlay(title, sub) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = C.title;
  glow(C.title, C.textGlow);
  ctx.font = C.font.title;
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font = C.font.sub;
  ctx.fillStyle = C.inkDim;
  ctx.shadowBlur = 0;
  ctx.fillText(sub, W / 2, H / 2 + 22);
  ctx.restore();
}
// Retícula tenue de fondo (skin neón).
function drawGrid() {
  ctx.save();
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < W; x += 40) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = 40; y < H; y += 40) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}
// Pantalla de fósforo: cada píxel de la escena en baja resolución pasa al tono más cercano.
function nearestTone(px) {
  const r = px & 255;
  const g = (px >> 8) & 255;
  const b = (px >> 16) & 255;
  let best = C.tones[0];
  let bestDist = Infinity;
  for (const t of C.tones) {
    const dd = (r - t[0]) ** 2 + (g - t[1]) ** 2 + (b - t[2]) ** 2;
    if (dd < bestDist) {
      bestDist = dd;
      best = t;
    }
  }
  return (0xff000000 | (best[2] << 16) | (best[1] << 8) | best[0]) >>> 0;
}
function quantize() {
  const img = loCtx.getImageData(0, 0, lo.width, lo.height);
  const px = new Uint32Array(img.data.buffer);
  for (let i = 0; i < px.length; i++) {
    const p = px[i];
    let t = toneCache.get(p);
    if (t === undefined) {
      t = nearestTone(p);
      toneCache.set(p, t);
    }
    px[i] = t;
  }
  loCtx.putImageData(img, 0, 0);
}
function drawScanlines() {
  ctx.save();
  ctx.fillStyle = C.scan;
  for (let y = 1; y < H; y += C.pixel) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}
function draw() {
  // Con C.pixel > 1 la escena se dibuja en el lienzo pequeño y se reescala sin suavizado.
  if (C.pixel > 1) {
    ctx = loCtx;
    ctx.setTransform(1 / C.pixel, 0, 0, 1 / C.pixel, 0, 0);
  } else {
    ctx = screenCtx;
  }
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  if (C.grid) drawGrid();
  particles.forEach((p) => p.draw());
  asteroids.forEach((a) => a.draw());
  powerUps.forEach((p) => p.draw());
  bullets.forEach((b) => b.draw());
  ship.draw();
  if (C.pixel > 1) {
    if (C.tones) quantize();
    ctx = screenCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(lo, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }
  powerUps.forEach((p) => p.drawLabel());
  drawHUD();
  if (state === "gameover" && !EMBEDDED)
    drawOverlay("GAME OVER", `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
  if (C.scan) drawScanlines();
}
// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (!paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}
initGame();
requestAnimationFrame(loop);
