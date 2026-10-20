# SPEC 07 — Juego real TETRIS embebido y con leaderboard

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-19
> **Objetivo:** Añadir el juego TETRIS de `references/started-games/03-tetris/` y hacerlo jugable en `/juegos/tetris/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

ASTEROIDS es hoy el único juego real (SPEC 05) y el único con leaderboard en Supabase (SPEC 06). TETRIS es el siguiente juego de `references/started-games/`, que SPEC 05 ya apuntaba como siguiente en usar el protocolo `av:*`. Entra como juego nuevo del catálogo: CAÍDA, el Tetris simulado, se queda como está. Cuando `tetris` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

A diferencia de ASTEROIDS, TETRIS no es un único canvas 4:3. Tiene un layout DOM vertical (título, tablero 300×600, panel lateral con SCORE, LINES, LEVEL, NEXT y CONTROLS) y mecanismos propios en el DOM: pausa con `P`, overlay de pausa y GAME OVER con botón "Reiniciar", y botón de tema claro/oscuro. Este spec decide cómo encaja todo eso en el reproductor.

## Alcance

**Entra:**

- Copia de `index.html`, `style.css` y `game.js` en `public/games/tetris/`, servida en `/games/tetris/index.html`. `references/started-games/03-tetris/` queda intacto. No se copian `.Claude/`, `.github/`, `.DS_Store`, `.gitignore`, `README.md` ni `CLAUDE.md`.
- El aspecto visual no cambia: colores, tipografía, título `TETRIS`, panel lateral (SCORE, LINES, LEVEL, NEXT, CONTROLS) y botón de tema claro/oscuro. Todo se ve también dentro de la plataforma.
- Cambios en la copia de `index.html` y `style.css`:
  - `html, body { height: 100%; overflow: hidden; }`. `body` deja de usar `min-height: 100vh`.
  - El bloque `.wrapper` (título + tablero + panel) se escala entero con `transform: scale(…)` para caber en la ventana o el iframe, centrado, con letterbox y sin scroll. El factor nunca pasa de 1.
- Cambios en la copia de `game.js`:
  - `preventDefault` en `keydown` para `Space`, `ArrowLeft`, `ArrowRight`, `ArrowUp` y `ArrowDown`.
  - Función de ajuste de escala de `.wrapper`, al cargar y en `resize`.
  - `themeToggle.blur()` tras cada clic del botón de tema, para que Espacio no lo vuelva a pulsar.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido:
    - La tecla `P` no hace nada.
    - Al perder no se muestra el overlay "GAME OVER" ni el botón "Reiniciar".
    - El `endGame()` existente envía `av:gameover` al padre una sola vez por partida.
    - Escucha `av:pause`, `av:resume`, `av:restart` y `av:end` del padre.
  - Abierto directamente, el juego se comporta como el original: pausa con `P` y su overlay, overlay "GAME OVER" y botón "Reiniciar".
- Nueva entrada `tetris` al final de `GAMES` en `lib/games.ts`, con la portada `cover-tetro` reutilizada.
- Migración `supabase/migrations/<version>_add_tetris_to_games.sql` que inserta `tetris` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Cambios en CAÍDA, que sigue simulada.
- Reskin neón del juego y portada propia `cover-tetris`.
- Sonido y controles táctiles. Un layout pensado para móvil.
- Puntuación, líneas o nivel en vivo en la barra de la plataforma.
- Leaderboard real en `/juegos/tetris` (top 10 y récord) y en las tarjetas. `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Cambios en reglas, piezas (incluida la "tuerca") o puntuación del juego.
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "tetris",
  title: "TETRIS",
  short: "El clásico de piezas que caen: completa líneas y sube de nivel.",
  long: "Siete piezas clásicas y una tuerca rebelde caen sobre un tablero de 10×20. Muévelas, rótalas y completa filas para borrarlas: una, dos, tres o cuatro de golpe valen 100, 300, 500 u 800 puntos por nivel. Cada 10 líneas subes de nivel y la caída se acelera. La pieza fantasma te muestra dónde aterrizará.",
  cat: "PUZZLE",
  cover: "cover-tetro",
  color: "magenta",
  best: 0,
  plays: "0",
  src: "/games/tetris/index.html",
}
```

```sql
-- supabase/migrations/<version>_add_tetris_to_games.sql
insert into public.games (id, title) values ('tetris', 'TETRIS');
```

```js
// public/games/tetris/game.js — modo embebido (resumen; protocolo completo en SPEC 05)
const EMBEDDED = window.parent !== window;
let gameOverSent = false; // se pone a false en init()

// endGame() existente: en modo embebido no muestra el overlay y envía una vez
//   window.parent.postMessage({ type: "av:gameover", score: Math.min(score, 10000000) }, location.origin);

// av:pause   → si !gameOver: paused = true; cancelAnimationFrame(animId); sin overlay
// av:resume  → si !gameOver y paused: paused = false; lastTime = performance.now(); animId = requestAnimationFrame(loop)
// av:restart → init()
// av:end     → si !gameOver: endGame()
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05. El juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`.
- `score` ya es entero. Se envía `Math.min(score, 10_000_000)` (`MAX_SCORE` de `lib/save-score.ts`).
- Fin de partida: el `endGame()` existente, llamado desde `spawn()` cuando la pieza nueva colisiona, o por `av:end`.
- La pausa de la plataforma reutiliza la variable `paused` del original. Mientras está activa, el `keydown` ya ignora las teclas, igual que con `gameOver`.
- Teclas del juego: `←`/`→` mover, `↑`/`X` rotar, `↓` bajada suave, `Space` caída instantánea, `P` pausa (solo abierto directamente).
- Escalado: `scale = Math.min(1, innerWidth / w, innerHeight / h)`, con `w`/`h` = `offsetWidth`/`offsetHeight` de `.wrapper` (tamaño sin transformar).
- El iframe lleva `title="TETRIS"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md` y `public/games/asteroids/game.js` como referencia del protocolo.

1. Copiar `index.html`, `style.css` y `game.js` de `references/started-games/03-tetris/` a `public/games/tetris/`. Ajustar `style.css` (`html, body` a 100% de alto sin scroll, sin `min-height: 100vh`) y añadir a `game.js` la función de escala de `.wrapper` (al cargar y en `resize`), `preventDefault` para `Space` y las flechas, y `themeToggle.blur()` tras el clic. Verificación: `/games/tetris/index.html` se juega como el original, incluidos la pausa con `P` y "GAME OVER" con "Reiniciar". Al reducir la ventana, título, tablero y panel se ven enteros sin scroll.
2. Añadir a `game.js` la detección de modo embebido, el listener de `av:pause`/`av:resume`/`av:restart`/`av:end` y el envío único de `av:gameover` desde `endGame()`. En modo embebido, `P` no hace nada y no se muestran el overlay ni "Reiniciar". Verificación: abierto directamente sigue igual que en el paso 1.
3. Añadir la entrada `tetris` al final de `GAMES`. Verificación: `/games` muestra la tarjeta TETRIS, `/juegos/tetris` muestra el detalle y `/juegos/tetris/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_tetris_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_tetris_to_games`). Renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `tetris`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña TETRIS de `/salon`.
5. Actualizar `CLAUDE.md`:
   - `tetris` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06).
   - Convención nueva: un juego que no es 4:3 escala su layout entero dentro del iframe, sin tocar el reproductor.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/tetris` y `/juegos/tetris/jugar` aparecen prerenderizadas.
- [ ] `references/started-games/03-tetris/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta TETRIS (PUZZLE, magenta, portada `cover-tetro`) y el filtro PUZZLE la incluye.
- [ ] CAÍDA sigue en el catálogo, con su URL `/juegos/caida` y el reproductor simulado.

**Juego embebido**

- [ ] Al entrar en `/juegos/tetris/jugar`, las flechas y Espacio controlan la pieza sin hacer clic antes en el juego.
- [ ] Pulsar Espacio o las flechas no hace scroll en la página.
- [ ] A 1280px y a 375px de ancho, título, tablero y panel se ven enteros dentro del marco CRT, sin barras de scroll dentro del iframe.
- [ ] PAUSA congela la caída, muestra "EN PAUSA" de la plataforma (no el overlay "PAUSA" del juego) y las teclas no mueven la pieza. REANUDAR continúa sin que la pieza baje varias filas de golpe.
- [ ] En modo embebido, pulsar `P` no pausa el juego.
- [ ] Al perder aparece el modal "FIN DEL JUEGO" con el mismo SCORE que mostraba el panel, y no aparecen el overlay "GAME OVER" ni el botón "Reiniciar" del juego.
- [ ] FIN durante la partida abre el modal con el SCORE actual del panel.
- [ ] Con el modal abierto, las teclas no mueven piezas ni reinician el juego.
- [ ] "JUGAR DE NUEVO" cierra el modal y reinicia el juego con SCORE 0, LINES 0, LEVEL 1 y tablero vacío.
- [ ] El botón de tema funciona dentro de la plataforma y, después de pulsarlo, Espacio hace la caída instantánea sin volver a cambiar el tema.

**Leaderboard**

- [ ] `games` contiene la fila `tetris` / `TETRIS` y `list_migrations` muestra `add_tetris_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'tetris'` y la puntuación del panel.
- [ ] La pestaña TETRIS de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] Abrir `/games/tetris/index.html` directamente se comporta como el original: pausa con `P` y su overlay, "GAME OVER" con "Reiniciar" y botón de tema.
- [ ] ASTEROIDS y los juegos simulados siguen igual que antes.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/tetris/jugar` ni en `/salon`.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `tetris` es un juego real, está en `games` y la convención de escalado para juegos que no son 4:3.

## Decisiones

- **Sí:** entrada nueva `tetris` al final de `GAMES`, por decisión del usuario. CAÍDA sigue simulada.
- **No:** añadir `src` a CAÍDA. Cambiaría su identidad y el catálogo se quedaría sin su juego simulado equivalente.
- **Sí:** `tetris` / `TETRIS`, como hizo ASTEROIDS con el nombre del original, por decisión del usuario.
- **Sí:** PUZZLE, magenta y portada `cover-tetro` reutilizada, por decisión del usuario. Habrá dos tarjetas con la misma portada, igual que `rocas` y `asteroids`.
- **Sí:** aspecto original, por decisión del usuario. Incluye el título, el panel con CONTROLS y el botón de tema dentro de la plataforma.
- **Sí:** escalar el layout entero dentro del juego, por decisión del usuario. La plataforma no se toca.
- **No:** campo `aspect` en `Game` ni cambios en `EmbeddedGamePlayer` o `.crt-screen` para un marco vertical.
- **Sí:** el factor de escala no pasa de 1. Los canvas no se ven borrosos y en pantallas grandes queda letterbox.
- **Sí:** en modo embebido se desactivan la pausa con `P` y su overlay, y el overlay "GAME OVER" con "Reiniciar", por decisión del usuario. La plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** el botón de tema se queda en modo embebido, por decisión del usuario.
- **Sí:** `themeToggle.blur()` tras el clic, por decisión del usuario. Cambio mínimo que también corrige el juego abierto directamente.
- **Sí:** la pausa de la plataforma reutiliza `paused` y `cancelAnimationFrame` del original. Al reanudar, `lastTime = performance.now()`, igual que `togglePause()`.
- **Sí:** `av:gameover` se envía desde el `endGame()` existente, con una bandera `gameOverSent`.
- **Sí:** `best: 0` y `plays: "0"`. No hay puntuaciones reales todavía.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`.
- **Sí:** reglas, piezas (incluida la "tuerca") y puntuación sin cambios.

## Riesgos

| Riesgo                                                                                                   | Mitigación                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El iframe no tiene el foco y el teclado no llega al juego.                                               | El padre ya llama a `contentWindow.focus()` al cargar, al reanudar y al reiniciar. Hay un criterio que lo comprueba.                                               |
| El `dt` del bucle no tiene límite: al reanudar o al volver a la pestaña, la pieza podría bajar de golpe. | Al reanudar, `lastTime = performance.now()`. `dropAccum` vuelve a 0 en cada caída automática, así que como mucho baja una fila por frame.                          |
| El juego envía `av:gameover` varias veces en la misma partida.                                           | Bandera `gameOverSent` hasta el siguiente `init()`.                                                                                                                |
| `av:pause`, `av:resume` o `av:end` llegan con la partida ya terminada y relanzan el bucle.               | Los tres comprueban `gameOver` antes de actuar.                                                                                                                    |
| La escala se calcula mal (antes del layout final o con el overlay visible).                              | Se mide el tamaño sin transformar de `.wrapper` (`offsetWidth`/`offsetHeight`) al cargar y en `resize`. El overlay es `position: absolute` y no cambia ese tamaño. |
| A 375px el layout queda muy pequeño (escala ~0,4).                                                       | Aceptado: el criterio pide que se vea entero. El layout móvil y los controles táctiles quedan fuera.                                                               |
| El botón de tema conserva el foco y Espacio lo vuelve a pulsar.                                          | `themeToggle.blur()` tras el clic. Hay un criterio que lo comprueba.                                                                                               |
| `localStorage` `tetris-theme` comparte origen con la plataforma.                                         | Clave con prefijo propio. No choca con nada de la plataforma.                                                                                                      |
| La puntuación no tiene tope teórico y el insert fallaría por encima de 10.000.000.                       | Se envía `Math.min(score, 10_000_000)`. En la práctica la puntuación queda muy por debajo.                                                                         |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.                    | El paso 4 aplica la migración antes de verificar el guardado.                                                                                                      |
| Las copias en `public/` y en `references/` divergen.                                                     | `references/` es solo la fuente original. Los cambios se hacen en `public/games/tetris/`.                                                                          |

## Lo que **no** entra en este spec

- Cambios en CAÍDA.
- Reskin neón y portada propia.
- Sonido, táctil y layout móvil.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en el detalle y en las tarjetas, y `plays` real.
- Antitrampas avanzadas.
- Cambios en reglas, piezas o puntuación.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
