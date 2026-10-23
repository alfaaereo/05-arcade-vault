# Protocolo `av:*` — contrato entre la plataforma y un juego embebido

Fuente: SPEC 05. Implementación de referencia: `public/games/asteroids/game.js` (juego) y `components/embedded-game-player.tsx` (plataforma). La plataforma **no cambia** al integrar un juego nuevo: es el juego el que se adapta a este contrato.

## Mensajes

```ts
type ParentToGame =
  | { type: "av:pause" } // congela update(); el canvas sigue mostrando el último frame
  | { type: "av:resume" } // reanuda sin salto de dt
  | { type: "av:restart" } // nueva partida desde cero (score 0, nivel 1, vidas iniciales)
  | { type: "av:end" } // fuerza el fin de partida y responde av:gameover
  | {
      type: "av:skin";
      skin: "clasico" | "neon" | "retro";
      mode: "oscuro" | "claro";
    }; // solo cambia el dibujo

type GameToParent = { type: "av:gameover"; score: number }; // una sola vez por partida
```

- Los mensajes con otro `type` se ignoran.
- El padre envía con `targetOrigin = window.location.origin` y solo acepta mensajes con `event.source === iframe.contentWindow` y `event.origin === window.location.origin`.
- El juego envía con `targetOrigin = location.origin` y solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`.
- El padre llama a `iframe.contentWindow.focus()` tras cargar, tras `av:resume` y tras `av:restart`. El juego no necesita pedir el foco.
- `av:skin { skin, mode }`: la plataforma lo envía al cargar el iframe (también si carga antes de la hidratación) y cada vez que se pulsan los botones `SKIN · …` (cíclico CLÁSICO → NEÓN → RETRO) y `MODO · …` (OSCURO ↔ CLARO), activos en pausa y con el modal abierto. La elección se guarda por juego en `localStorage` (`av_skin_<id>`, JSON `{ skin, mode }`). El juego aplica la paleta con `applySkin(skin, mode)` sin pausar, reiniciar ni tocar la puntuación; valores desconocidos caen en `clasico`/`oscuro`. Abierto directamente, el juego lee `?skin=&mode=` de la URL. Un juego sin skins ignora el mensaje. Contrato completo y estado por juego: `.claude/agents/skin-designer.md` y `references/templates/game-width-themes.md`; referencia: `public/games/asteroids/game.js`.
- `score` debe ser un **entero entre 0 y 10.000.000** (`MAX_SCORE` en `lib/save-score.ts`; la BD lo impone con un `check`). Si el juego puede dar decimales o pasarse, envía `Math.min(Math.floor(score), 10_000_000)` y documéntalo como decisión en el spec.

## Modo embebido vs. abierto directamente

```js
const EMBEDDED = window.parent !== window;
```

|                                      | Embebido (iframe del Vault)                           | Abierto directamente (`/games/<id>/index.html`) |
| ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- |
| Overlay "GAME OVER"                  | No se dibuja (lo sustituye el modal de la plataforma) | Igual que el original                           |
| Reinicio por tecla/botón tras perder | Desactivado (lo decide `av:restart`)                  | Igual que el original                           |
| Pausa propia (P, Esc, botón)         | Desactivada (la plataforma tiene PAUSA)               | Igual que el original                           |
| Overlays/botones DOM propios         | Ocultos                                               | Igual que el original                           |
| `av:gameover`                        | Se envía una vez por partida                          | No se envía                                     |

## Adaptador de referencia

Patrón tomado de `public/games/asteroids/game.js`. Ajusta los nombres (`state`, `score`, `initGame`, `lastTime`) a los del juego.

```js
// Teclas del juego: evita que Espacio y las flechas hagan scroll en la página.
const GAME_KEYS = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
window.addEventListener("keydown", (e) => {
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  // …lógica original…
});

// Si el foco sale del juego (p. ej. clic en PAUSA de la plataforma) se pierde el keyup.
function clearKeys() {
  for (const k in keys) keys[k] = false;
  for (const k in justPressed) justPressed[k] = false;
}
window.addEventListener("blur", clearKeys);

// ── Modo embebido (iframe de Arcade Vault) ──
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
    lastTime = null; // sin salto de dt
    clearKeys();
  } else if (type === "av:restart") {
    initGame(); // initGame() también hace paused = false y gameOverSent = false
    lastTime = null;
    clearKeys();
  } else if (type === "av:end") {
    if (state !== "gameover") endGame();
  }
});

// En el bucle:
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (!paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Al perder: sustituir `state = "gameover"` por endGame().
// En update(): `if (pressed("Space") && !EMBEDDED) initGame();`
// En draw():   `if (state === "gameover" && !EMBEDDED) drawOverlay(…);`
```

## Variantes según el juego

- **Bucle con `setInterval` / `setTimeout`** (caída de piezas, ticks fijos): en `av:pause`, `clearInterval`; en `av:resume`, volver a crear el intervalo; en `av:restart`, limpiar antes de `init()` para no duplicar intervalos. Si se mezcla con rAF, reiniciar también el acumulador de tiempo (`dropAccum = 0`, `lastTime = null`).
- **Juego con su propia variable `paused`**: reutilízala en vez de crear otra, pero la tecla de pausa propia queda desactivada en modo embebido.
- **HUD o overlay en el DOM** (fuera del canvas): en modo embebido ocultar overlays y botones (`if (EMBEDDED) overlay.hidden = true`, o una clase `embedded` en `<html>` con CSS). Si el HUD DOM se queda, debe caber dentro del 4:3 sin scroll.
- **Ratón**: escalar coordenadas con `getBoundingClientRect()` (`(e.clientX - rect.left) * canvas.width / rect.width`), porque el canvas se escala con CSS. Un clic dentro del iframe también le da el foco.
- **Sonido / `AudioContext`**: silenciar o suspender en `av:pause` y `av:end`; reanudar en `av:resume`.
- **`localStorage` propio** (récord local): puede quedarse, pero no se usa para el leaderboard. Usa una clave con prefijo del juego para no chocar con otras claves del mismo origen.
- **Toggle de tema u otros botones de UI**: ocultarlos en modo embebido salvo que el spec decida lo contrario.
- **Varias "vidas" o niveles con pantalla intermedia**: solo el fin definitivo de la partida llama a `endGame()`.
