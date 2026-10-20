# SPEC 08 — Juego real ARKANOID embebido y con leaderboard

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-10-19
> **Objetivo:** Añadir el juego ARKANOID de `references/started-games/04-arkanoid/` y hacerlo jugable en `/juegos/arkanoid/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

ASTEROIDS (SPEC 05/06) y TETRIS (SPEC 07) ya son juegos reales con leaderboard en Supabase. ARKANOID es el último juego de `references/started-games/` y entra como juego nuevo del catálogo: BLOQUE BUSTER, el Arkanoid simulado, se queda como está. En cuanto `arkanoid` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma.

El juego ya es un canvas 800×600 (4:3), pero tiene particularidades frente a los anteriores:

- Se controla también con el ratón.
- Usa un spritesheet y sonidos.
- Tiene dos finales: perder las 3 vidas o completar los 5 niveles.
- Su pausa (P/Esc) incluye un selector para saltar de nivel.
- No tiene reinicio.
- Su `dt` no tiene tope.
- Sus sonidos fallan en consola si suenan antes de que el usuario interactúe.

Este spec decide cómo encaja cada uno de esos puntos.

## Alcance

**Entra:**

- Copia en `public/games/arkanoid/` de `index.html`, `game.js`, `levels.js`, `assets/spritesheet.js`, `assets/spritesheet-breakout.png`, `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`, servida en `/games/arkanoid/index.html`.
  - `references/started-games/04-arkanoid/` queda intacto.
  - No se copian `.claude/`, `.agents/`, `specs/`, `skills-lock.json`, `.DS_Store`, `README.md` ni `CLAUDE.md`.
- El aspecto visual no cambia: sprites, HUD (Score, Nivel, vidas) y overlays dibujados en el canvas.
- Cambios en la copia de `index.html`:
  - `html, body { height: 100%; overflow: hidden; }`. `body` deja de usar `height: 100vh`.
  - El canvas escala para llenar la ventana o el iframe manteniendo 4:3, igual que en ASTEROIDS.
  - El fondo de alrededor del canvas pasa de `#2d2d2d` a `#000`.
- Cambios en la copia de `game.js`:
  - `preventDefault` en `keydown` para `ArrowLeft` y `ArrowRight`.
  - `dt` limitado a 50 ms (`Math.min(dt, 0.05)`).
  - Cada sonido se reproduce con `.play().catch(() => {})`.
  - Nueva función `initGame()`: `lives = 3`, `score = 0`, `gameState = 'playing'`, `isPaused = false`, explosiones y teclas a cero, `initPaddle()` y `loadLevel(1)`.
  - Nueva función `endGame(state)` (`'gameover'` | `'win'`) que sustituye a las dos asignaciones directas de `gameState`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido:
    - `P` y `Escape` no hacen nada y el clic sobre el canvas no salta de nivel.
    - No se dibujan "GAME OVER", "¡Completaste el juego!" ni el overlay de pausa.
    - `endGame()` envía `av:gameover` al padre una sola vez por partida, tanto al perder como al ganar.
    - Escucha `av:pause`, `av:resume`, `av:restart` y `av:end` del padre.
  - Abierto directamente se comporta como el original: pausa con P/Esc y selector de niveles, overlays de fin y sin reinicio tras perder.
- Nueva entrada `arkanoid` al final de `GAMES` en `lib/games.ts`, con la portada `cover-bricks` reutilizada.
- Migración `supabase/migrations/<version>_add_arkanoid_to_games.sql` que inserta `arkanoid` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Cambios en BLOQUE BUSTER, que sigue simulado.
- Reskin neón del juego y portada propia `cover-arkanoid`.
- Botón de silencio o control de volumen.
- Reinicio cuando el juego se abre directamente.
- Controles táctiles.
- Puntuación, vidas o nivel en vivo en la barra de la plataforma.
- Leaderboard real en `/juegos/arkanoid` (top 10 y récord) y en las tarjetas. `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Cambios en niveles, físicas o puntuación del juego.
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "arkanoid",
  title: "ARKANOID",
  short: "Rompe el muro ladrillo a ladrillo en cinco niveles.",
  long: "Mueve la paleta con el ratón o las flechas y mantén la pelota en juego. Cada bloque vale 10 puntos y, al limpiar la pantalla, pasas al siguiente de cinco niveles, cada uno con su propia forma y una pelota más rápida. Tienes tres vidas: supera el quinto nivel para completar el juego.",
  cat: "ARCADE",
  cover: "cover-bricks",
  color: "cyan",
  best: 0,
  plays: "0",
  src: "/games/arkanoid/index.html",
}
```

```sql
-- supabase/migrations/<version>_add_arkanoid_to_games.sql
insert into public.games (id, title) values ('arkanoid', 'ARKANOID');
```

```js
// public/games/arkanoid/game.js — modo embebido (resumen; protocolo completo en SPEC 05)
const EMBEDDED = window.parent !== window;
let gameOverSent = false; // se pone a false en initGame()

function endGame(state) {
  // 'gameover' | 'win'
  gameState = state;
  if (EMBEDDED && !gameOverSent) {
    gameOverSent = true;
    window.parent.postMessage({ type: "av:gameover", score }, location.origin);
  }
}

// av:pause   → si gameState === 'playing': isPaused = true (sin drawPauseOverlay embebido)
// av:resume  → isPaused = false; lastTime = null
// av:restart → initGame(); lastTime = null
// av:end     → si gameState === 'playing': endGame('gameover')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05. El juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`.
- `score` es entero (+10 por bloque) y como mucho ronda los 2.500, muy por debajo de `MAX_SCORE` (10.000.000). Se envía tal cual.
- Fin de partida:
  - Perder la última vida → `endGame('gameover')`.
  - Vaciar el nivel 5 → `endGame('win')`.
  - FIN de la plataforma (`av:end`) → `endGame('gameover')`.
- La pausa de la plataforma reutiliza `isPaused`: `update()` no corre y `draw()` no dibuja `drawPauseOverlay()` en modo embebido.
- Controles: ratón (`mousemove` sobre el canvas, ya escalado con `getBoundingClientRect`) y `←`/`→`. `P`/`Esc` solo abierto directamente.
- El iframe lleva `title="ARKANOID"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/07-juego-tetris.md` y `public/games/asteroids/game.js` como referencia del protocolo.

1. Copiar de `references/started-games/04-arkanoid/` a `public/games/arkanoid/` los archivos `index.html`, `game.js`, `levels.js` y `assets/` (`spritesheet.js`, `spritesheet-breakout.png`, `sounds/*.mp3`, sin `.DS_Store`). Ajustar `index.html` para que el canvas llene la ventana manteniendo 4:3, sin scroll y con fondo `#000`. Añadir a `game.js` `preventDefault` en las flechas, el tope de `dt` a 50 ms y `.play().catch(() => {})` en los sonidos. Verificación: `/games/arkanoid/index.html` se juega como el original con ratón y flechas, incluidos la pausa P/Esc con selector de niveles y "GAME OVER". No hay errores de audio en consola y, al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir a `game.js` `initGame()` y `endGame(state)`, la detección de modo embebido, el listener de `av:pause`/`av:resume`/`av:restart`/`av:end` y el envío único de `av:gameover`. En modo embebido:
   - `P` y `Esc` no hacen nada y el clic no salta de nivel.
   - No se dibujan los overlays de fin ni el de pausa.

   Verificación: abierto directamente sigue igual que en el paso 1.

3. Añadir la entrada `arkanoid` al final de `GAMES`. Verificación: `/games` muestra la tarjeta ARKANOID, `/juegos/arkanoid` muestra el detalle y `/juegos/arkanoid/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_arkanoid_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_arkanoid_to_games`). Renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `arkanoid`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña ARKANOID de `/salon`.
5. Actualizar `CLAUDE.md`: `arkanoid` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego puede usar el ratón dentro del iframe sin cambios en la plataforma.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/arkanoid` y `/juegos/arkanoid/jugar` aparecen prerenderizadas.
- [ ] `references/started-games/04-arkanoid/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta ARKANOID (ARCADE, cyan, portada `cover-bricks`) y el filtro ARCADE la incluye.
- [ ] BLOQUE BUSTER sigue en el catálogo, con su URL `/juegos/bloque-buster` y el reproductor simulado.

**Juego embebido**

- [ ] Al entrar en `/juegos/arkanoid/jugar`, las flechas mueven la paleta sin hacer clic antes en el juego y no hacen scroll en la página.
- [ ] Mover el ratón sobre el juego mueve la paleta.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela la pelota y las explosiones y muestra "EN PAUSA" de la plataforma, sin el overlay "PAUSA" ni el selector de niveles del juego. REANUDAR continúa sin que la pelota salte de posición.
- [ ] En modo embebido, `P` y `Escape` no pausan el juego.
- [ ] Al perder las 3 vidas aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al completar el nivel 5 aparece el modal "FIN DEL JUEGO" con la puntuación final, y el canvas no dibuja "¡Completaste el juego!".
- [ ] FIN durante la partida abre el modal con la puntuación actual del HUD.
- [ ] "JUGAR DE NUEVO" cierra el modal y reinicia el juego con Score 0, Nivel 1 y 3 vidas.

**Leaderboard**

- [ ] `games` contiene la fila `arkanoid` / `ARKANOID` y `list_migrations` muestra `add_arkanoid_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'arkanoid'` y la puntuación del HUD.
- [ ] La pestaña ARKANOID de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores de audio (`NotAllowedError`) ni errores o advertencias de hidratación en `/juegos/arkanoid/jugar`, ni abriendo el juego directamente.
- [ ] Abrir `/games/arkanoid/index.html` directamente se comporta como el original: pausa con P/Esc y selector de niveles, "GAME OVER" y "¡Completaste el juego!".
- [ ] ASTEROIDS, TETRIS y los juegos simulados siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `arkanoid` es un juego real y está en `games`.

## Decisiones

- **Sí:** entrada nueva `arkanoid` al final de `GAMES`, por decisión del usuario. BLOQUE BUSTER sigue simulado y la landing no cambia.
- **No:** añadir `src` a BLOQUE BUSTER. Cambiaría el primer juego de la landing y el catálogo se quedaría sin su equivalente simulado.
- **Sí:** `arkanoid` / `ARKANOID`, como ASTEROIDS y TETRIS con el nombre del original, por decisión del usuario.
- **Sí:** ARCADE, cyan y portada `cover-bricks` reutilizada, por decisión del usuario.
- **Sí:** aspecto original, por decisión del usuario. Solo cambian el escalado al iframe y el fondo de alrededor, que pasa a negro, como en ASTEROIDS.
- **Sí:** en modo embebido se desactivan P/Esc y el selector de niveles, por decisión del usuario. Saltar de nivel en una partida que cuenta para el Salón haría las puntuaciones incomparables.
- **Sí:** completar el juego también es fin de partida y abre el modal sin el overlay de victoria, por decisión del usuario.
- **Sí:** nueva función `initGame()`, porque el original no tiene reinicio y `av:restart` lo necesita.
- **No:** reinicio al abrirlo directamente, por decisión del usuario. Se mantiene el original.
- **Sí:** `dt` limitado a 50 ms y `.play().catch(() => {})`, por decisión del usuario. Son cambios mínimos que también corrigen el juego abierto directamente.
- **Sí:** se mantiene el control con ratón. Funciona dentro del iframe sin cambios en la plataforma.
- **Sí:** `best: 0` y `plays: "0"`. No hay puntuaciones reales todavía.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`.

## Riesgos

| Riesgo                                                                                                     | Mitigación                                                                                                     |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| El navegador bloquea el audio antes de la primera interacción y la consola se llena de errores.            | `.play().catch(() => {})`. El sonido suena en cuanto el usuario interactúa con el juego.                       |
| El `dt` sin tope hace que la pelota atraviese bloques o la paleta al volver de otra pestaña o al reanudar. | `Math.min(dt, 0.05)` y `lastTime = null` al reanudar y reiniciar.                                              |
| `av:gameover` se envía dos veces en la misma partida (p. ej. ganar y FIN casi a la vez).                   | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `gameState === 'playing'`.                   |
| Un clic sobre el canvas pausado salta de nivel en modo embebido.                                           | El handler de clic sale enseguida si `EMBEDDED`.                                                               |
| `initGame()` deja estado de la partida anterior.                                                           | Pone a cero `explosions`, `keys`, `isPaused` y `gameOverSent`, y llama a `initPaddle()` y `loadLevel(1)`.      |
| La pelota arranca nada más cargar, antes de que el iframe tenga el foco.                                   | Igual que en el original. El padre da el foco al cargar y el ratón funciona sin foco.                          |
| El iframe no tiene el foco y las flechas no llegan al juego.                                               | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar. Hay un criterio que lo comprueba. |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.                      | El paso 4 aplica la migración antes de verificar el guardado.                                                  |
| Las copias en `public/` y en `references/` divergen.                                                       | `references/` es solo la fuente original. Los cambios se hacen en `public/games/arkanoid/`.                    |

## Lo que **no** entra en este spec

- Cambios en BLOQUE BUSTER.
- Reskin neón y portada propia.
- Botón de silencio y volumen.
- Reinicio abierto directamente.
- Controles táctiles.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en el detalle y en las tarjetas, y `plays` real.
- Antitrampas avanzadas.
- Cambios en niveles, físicas o puntuación.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
