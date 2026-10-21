# SPEC 09 — Juego real SNAKE embebido y con leaderboard

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-20
> **Objetivo:** Crear el juego SNAKE y hacerlo jugable en `/juegos/snake/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

ASTEROIDS, TETRIS y ARKANOID ya son juegos reales con leaderboard. SNAKE es el primero que no viene de `references/started-games/`: no hay código de referencia, solo los sprites de frutas de `references/souce-assets/snake-assets/` (`fruits.png` y `sprites.js`). Se crea desde la plantilla de `/add-game` con el tema neón del Vault y entra como entrada nueva del catálogo (la antigua SERPENTINA simulada ya no existe). En cuanto `snake` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

Es el primer juego con bucle por ticks (la serpiente avanza una celda cada intervalo), así que este spec fija cómo encaja ese tick con la pausa y el reinicio del protocolo `av:*`.

## Alcance

**Entra:**

- Juego nuevo en `public/games/snake/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`.
- Sprites copiados tal cual de `references/souce-assets/snake-assets/` a `public/games/snake/assets/` (`fruits.png`, `sprites.js`). En la copia de `sprites.js` solo cambia `sources.fruits` a `'assets/fruits.png'`. `references/` queda intacto.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), cargando `assets/sprites.js` antes de `game.js`.
- Mecánica en `game.js`:
  - Lienzo 800×600: franja de HUD de 40 px arriba (SCORE, NIVEL) y tablero de 20×14 celdas de 40 px debajo.
  - La serpiente empieza con 3 segmentos en el centro, mirando a la derecha, y no se mueve hasta el primer giro válido (flecha o WASD).
  - Controles: flechas y WASD. Cola de hasta 2 giros pendientes; un giro de 180° respecto a la dirección previa se ignora.
  - Cada fruta suma `10 × nivel` y alarga la serpiente un segmento. El sprite es aleatorio entre las 22 frutas de `SPRITE_ATLAS.fruits` (fila pixel-art) y solo es decorativo. La fruta aparece en una celda libre.
  - Cada 5 frutas se sube de nivel. Tick inicial 150 ms, 10 ms menos por nivel, mínimo 60 ms.
  - Fin de partida al chocar con la pared o con el propio cuerpo, o si el tablero se llena y no queda celda libre para la fruta.
  - Frutas dibujadas con `imageSmoothingEnabled = false`, encajadas en la celda manteniendo la proporción del recorte. Si la imagen no ha cargado, se dibuja un cuadrado neón.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta un tick cada vez que supera el intervalo del nivel.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart` y `av:end`. Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador del tick.
  - Abierto directamente: `P` pausa (con overlay de pausa), "GAME OVER" con la puntuación y Espacio reinicia.
- Nueva entrada `snake` al final de `GAMES` en `lib/games.ts`.
- Portada: reutiliza `cover-snake` de `app/globals.css`.
- Migración `supabase/migrations/<version>_add_snake_to_games.sql` que inserta `snake` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Controles táctiles.
- Puntuación, longitud o nivel en vivo en la barra de la plataforma.
- Leaderboard real en `/juegos/snake` (top 10 y récord) y en las tarjetas; `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Obstáculos y frutas bonus o con valores distintos.
- Recortar u optimizar `fruits.png`.
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "snake",
  title: "SNAKE",
  short: "Come frutas, crece y no te muerdas la cola.",
  long: "Guía la serpiente con las flechas o WASD por un tablero de 20×14. Cada fruta suma 10 puntos por nivel y te hace crecer. Cada 5 frutas subes de nivel y la serpiente acelera. Si chocas con la pared o con tu propio cuerpo, se acabó.",
  cat: "ARCADE",
  cover: "cover-snake",
  color: "green",
  best: 0,
  plays: "0",
  src: "/games/snake/index.html",
}
```

```sql
-- supabase/migrations/<version>_add_snake_to_games.sql
insert into public.games (id, title) values ('snake', 'SNAKE');
```

```js
// public/games/snake/game.js — tick y modo embebido (resumen; protocolo completo en SPEC 05)
const COLS = 20,
  ROWS = 14,
  CELL = 40,
  HUD_H = 40;
const tickMs = () => Math.max(60, 150 - (level - 1) * 10);

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state === "playing" && started) {
    acc += dt;
    while (acc >= tickMs()) {
      acc -= tickMs();
      step();
    } // step() puede llamar a endGame()
  }
  draw();
  requestAnimationFrame(loop);
}

// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame()
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida.
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera y su máximo teórico (279 frutas, unos 56 niveles) ronda los 80.000 puntos, muy por debajo de 10.000.000.
- Fin de partida: en `step()` al chocar con la pared o con el cuerpo, o al no encontrar celda libre para la fruta → `endGame()`. FIN de la plataforma (`av:end`) → `endGame()`.
- Teclas: `↑`/`W`, `↓`/`S`, `←`/`A`, `→`/`D` giran. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores del tema (la plantilla los define en `C`, porque el iframe no ve las variables CSS): serpiente en verde neón, HUD con la paleta del Vault.
- El iframe lleva `title="SNAKE"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md` y `public/games/asteroids/game.js` como referencia del protocolo, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/snake/` desde la plantilla de `/add-game`. Copiar `fruits.png` y `sprites.js` a `assets/` y cambiar `sources.fruits` a `'assets/fruits.png'`. Cargar `assets/sprites.js` en `index.html` antes de `game.js`. Implementar la mecánica (tablero, tick con acumulador, cola de giros, frutas con sprite, niveles, colisiones, HUD) con `preventDefault` en flechas, Espacio y WASD, y diseñar el aspecto con `/frontend-design`. Verificación: `/games/snake/index.html` se juega completo, incluidos la pausa con P, "GAME OVER" y el reinicio con Espacio. Al reducir la ventana, el juego se ve entero sin scroll.
2. Repasar el adaptador `av:*` de la plantilla para el bucle por ticks: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni el overlay de pausa ni "GAME OVER". Verificación: abierto directamente sigue igual que en el paso 1.
3. Añadir la entrada `snake` al final de `GAMES`. Verificación: `/games` muestra la tarjeta SNAKE, `/juegos/snake` muestra el detalle y `/juegos/snake/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_snake_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_snake_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `snake`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña SNAKE de `/salon`.
5. Actualizar `CLAUDE.md`: `snake` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego por ticks usa un acumulador sobre rAF que se pone a cero al reanudar y reiniciar.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/snake` y `/juegos/snake/jugar` aparecen prerenderizadas.
- [ ] `references/souce-assets/snake-assets/` no tiene cambios respecto a su estado inicial.
- [ ] `/games` muestra la tarjeta SNAKE (ARCADE, green, portada `cover-snake`) y el filtro ARCADE la incluye.

**Juego embebido**

- [ ] Al entrar en `/juegos/snake/jugar`, la serpiente espera quieta y el primer giro con flechas o WASD la pone en marcha sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] Dos giros rápidos (p. ej. `↑` y luego `←`) se aplican en ticks sucesivos, y un giro de 180° se ignora.
- [ ] Comer una fruta suma `10 × nivel`, alarga la serpiente un segmento y hace aparecer otra fruta en una celda libre con un sprite pixel-art.
- [ ] A la 5.ª fruta el HUD pasa a NIVEL 2 y la serpiente avanza visiblemente más rápido.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela la serpiente, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin que la serpiente avance varias celdas de golpe.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al chocar con una pared o con el propio cuerpo aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] FIN durante la partida abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja la serpiente con 3 segmentos, quieta, SCORE 0 y NIVEL 1.

**Leaderboard**

- [ ] `games` contiene la fila `snake` / `SNAKE` y `list_migrations` muestra `add_snake_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'snake'` y la puntuación del HUD.
- [ ] La pestaña SNAKE de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] Si `fruits.png` no ha cargado, la fruta se dibuja como un cuadrado neón y no hay errores en consola.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/snake/jugar` ni en `/salon`.
- [ ] Abrir `/games/snake/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS y ARKANOID siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `snake` es un juego real y está en `games`.

## Decisiones

- **Sí:** juego nuevo desde la plantilla de `/add-game`, con tema neón del Vault y HUD en el canvas.
- **Sí:** entrada nueva `snake` / `SNAKE` al final de `GAMES`, por decisión del usuario. No hay juego simulado equivalente en el catálogo.
- **Sí:** ARCADE, green y portada `cover-snake` reutilizada, por decisión del usuario.
- **Sí:** tablero 20×14 de 40 px con franja de HUD de 40 px arriba, por decisión del usuario. Encaja exacto en 800×600 sin solapar el HUD.
- **Sí:** las paredes matan (sin atravesar bordes), por decisión del usuario.
- **Sí:** `10 × nivel` por fruta, todas iguales; el sprite es solo decorativo, por decisión del usuario.
- **Sí:** subida de nivel cada 5 frutas, tick de 150 ms a 60 ms (−10 ms por nivel), por decisión del usuario.
- **Sí:** flechas y WASD con cola de 2 giros, por decisión del usuario.
- **Sí:** la serpiente espera al primer giro, por decisión del usuario. Evita perder antes de que el iframe tenga el foco.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays propios; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** sprites copiados tal cual, cambiando solo `sources.fruits`, por decisión del usuario. Se usa la fila pixel-art que ya mapea `sprites.js`.
- **Sí:** tablero lleno = fin de partida, para no dejar el juego sin salida.
- **Sí:** `best: 0` y `plays: "0"`. No hay puntuaciones reales todavía.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                                             | Mitigación                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dos giros rápidos dentro del mismo tick provocan un giro de 180° y la serpiente se muerde.                         | Cada giro de la cola se valida contra el último giro de la cola (o la dirección actual si está vacía), no solo contra la dirección actual.           |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta varios ticks seguidos.                                 | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                |
| El iframe no tiene el foco y el teclado no llega al juego.                                                         | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y la serpiente espera al primer giro. Hay un criterio que lo comprueba. |
| `av:gameover` se envía dos veces en la misma partida.                                                              | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                            |
| `fruits.png` (586 KB) tarda en cargar.                                                                             | Mientras no carga, la fruta se dibuja como un cuadrado neón.                                                                                         |
| Los sprites escalados se ven borrosos.                                                                             | `imageSmoothingEnabled = false` y encaje en la celda manteniendo la proporción del recorte.                                                          |
| El tablero se llena y no queda celda libre para la fruta.                                                          | Se trata como fin de partida con `endGame()`.                                                                                                        |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.                              | El paso 4 aplica la migración antes de verificar el guardado.                                                                                        |
| La puntuación supera 10.000.000.                                                                                   | Máximo teórico de unos 80.000; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                     |
| Licencia de los sprites: según `sprites.js` provienen de un ripeo del Google Snake publicado en spriters-resource. | Se usan por decisión del usuario; revisar antes de publicar el proyecto fuera del ámbito de aprendizaje.                                             |

## Lo que **no** entra en este spec

- Sonido.
- Controles táctiles.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en el detalle y en las tarjetas, y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Obstáculos y frutas bonus.
- Optimizar `fruits.png`.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
