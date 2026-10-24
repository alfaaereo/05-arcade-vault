# SPEC — Juego real FROGGER embebido y con leaderboard

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 10
> **Fecha:** 2026-10-23
> **Objetivo:** Crear el juego FROGGER (canvas puro, desde cero) y hacerlo jugable en `/juegos/frogger/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

La propuesta original de la game jam (2026-05-20) describía Frogger como un componente React con su propia play-page, HUD React y columnas nuevas en `games`. Esa arquitectura no existe en el repo: los juegos reales son HTML/canvas en `public/games/<id>/`, cargados en un iframe con el protocolo `av:*` (SPEC 05), y la tabla `games` solo guarda `id` y `title` (SPEC 06). Este spec conserva la mecánica de la propuesta (cuadrícula 16×14 de 40 px, 5 carriles de carretera, 6 de río con troncos y tortugas que se sumergen, 5 bocas, temporizador, 3 vidas y la misma puntuación) y la lleva a la arquitectura real, igual que SNAKE (SPEC 09). En cuanto `frogger` tenga `src` y esté en `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma.

## Alcance

**Entra:**

- Juego nuevo en `public/games/frogger/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. Todo se dibuja con primitivas canvas; no se carga ninguna imagen.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P").
- Mecánica en `game.js`:
  - Lienzo 800×600: franja de HUD de 40 px arriba y tablero de 16×14 celdas de 40 px (640×560) centrado debajo (`x = 80`, `y = 40`). Las dos franjas laterales de 80 px son decorado (seto/bordillo); las entidades se dibujan recortadas al tablero.
  - Filas del tablero (0 = arriba): 0 bocas, 1–6 río, 7 zona segura central, 8–12 carretera, 13 salida.
  - Bocas: 5 de 2 columnas en las columnas 1–2, 4–5, 7–8, 10–11 y 13–14. Las columnas 0, 3, 6, 9, 12 y 15 de la fila 0 son seto.
  - Rana: empieza en la fila 13, columna 7. Salta exactamente 1 celda (40 px) por pulsación con flechas o WASD, con animación de 120 ms; durante el salto se guarda como mucho 1 dirección pendiente. Una tecla mantenida no repite (`e.repeat` se ignora). No puede salir por los bordes laterales ni por abajo: ese salto se ignora.
  - Carriles (velocidades de nivel 1; cada nivel las multiplica por 1,15):

    | Fila | Entidad           | Sentido | px/s | Nº  | Buceo |
    | ---- | ----------------- | ------- | ---- | --- | ----- |
    | 1    | tronco de 4       | →       | 80   | 3   | —     |
    | 2    | tortugas ×2       | ←       | 100  | 4   | sí    |
    | 3    | tronco de 3       | →       | 140  | 3   | —     |
    | 4    | tronco de 2       | →       | 60   | 4   | —     |
    | 5    | tortugas ×3       | ←       | 70   | 3   | sí    |
    | 6    | tronco de 3       | →       | 110  | 3   | —     |
    | 8    | camión de 3       | ←       | 90   | 2   | —     |
    | 9    | coche de carreras | →       | 240  | 2   | —     |
    | 10   | coche             | ←       | 120  | 4   | —     |
    | 11   | camión de 2       | →       | 100  | 3   | —     |
    | 12   | coche             | ←       | 150  | 4   | —     |

    Las entidades de un carril se reparten a intervalos iguales sobre un ciclo de `COLS + ancho` columnas; al salir por un borde reaparecen por el contrario. Así siempre quedan huecos atravesables (al menos 1 celda en el río).

  - Tortugas: en los carriles con buceo se sumergen los grupos pares, con un ciclo de 3 s visibles y 1,5 s bajo el agua, desfasado por grupo. Durante el último 0,5 s visible se dibujan medio hundidas como aviso. Sumergidas no sirven de apoyo.
  - Río: si la rana está quieta encima de un tronco o de tortugas visibles, se desplaza con él (su columna pasa a ser fraccionaria). Al saltar a una fila que no es de río, la columna se redondea a la celda más cercana.
  - Muerte: (a) un vehículo se solapa con la rana (caja de 0,7 celdas centrada, comprobada en cada frame); (b) cae al río sin apoyo (el centro de la rana no está sobre un tronco ni sobre tortugas visibles); (c) la tortuga que la sostiene se sumerge; (d) el arrastre la saca del tablero por un lateral; (e) se acaba el tiempo; (f) llega a la fila 0 en el seto o en una boca ya ocupada.
  - Tras morir, la rana se dibuja aplastada 0,6 s (sin partículas) y luego vuelve a la salida con el tiempo lleno, o termina la partida si no quedan vidas.
  - Vidas: 3. Al quedarse en 0, `endGame()`.
  - Temporizador por rana: `max(8, 15 − (nivel − 1))` s. Se rellena al ocupar una boca y al reaparecer tras morir.
  - Puntuación: +10 por cada fila nueva avanzada hacia arriba en el viaje actual (se reinicia al ocupar una boca o al morir); +50 al ocupar una boca, más `floor(tiempo_restante) × 10`; +200 al ocupar la 5.ª boca de la ronda.
  - Ronda completa (5 bocas ocupadas): sube el nivel, se vacían las bocas, se reconstruyen los carriles con la nueva velocidad, la rana vuelve a la salida y el temporizador se rellena.
  - Dibujo: carretera oscura con líneas de carril, río azul, filas seguras verdes. Coches con ruedas, camiones con cabina, troncos con vetas, tortugas con caparazón (y contorno translúcido cuando están sumergidas), rana con ojos y las patas extendidas mientras salta, bocas con borde dorado y una rana dentro cuando están ocupadas.
  - HUD en la franja superior: SCORE a la izquierda, NIVEL en el centro, una rana pequeña por vida a la derecha, y debajo una barra de tiempo con el ancho de la franja del tablero, que pasa de verde a amarillo y a rojo según se agota.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms; `if (!paused) update(dt)` y `draw()` siempre.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart` y `av:end`. Al reanudar y reiniciar se pone `lastTime = null`, se vacían las teclas y se descarta la dirección pendiente.
  - Adaptador `av:key` (SPEC 10): `pressKey(code, down)` despacha un `KeyboardEvent` sintético; `KEY_OF` incluye `ArrowUp`, `ArrowDown`, `ArrowLeft` y `ArrowRight`.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" con la puntuación, y Espacio reinicia.
- Nueva entrada `frogger` al final de `GAMES` en `lib/games.ts`, con `controls`.
- Portada nueva `cover-frogger` en `app/globals.css`, que se parezca al juego (carriles, río con tronco y la rana), con el mismo patrón que `cover-snake` (fondo en el elemento y SVG en `::after`, `center/contain`), diseñada con `/frontend-design`.
- Migración `supabase/migrations/<version>_add_frogger_to_games.sql` que inserta `frogger` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Skins `clasico`/`neon`/`retro` (las añade `skin-designer` después de este spec).
- Ajustes de móvil más allá de declarar `controls` (los hace `mobile-porte`).
- Sonido.
- Animaciones de muerte elaboradas (explosiones, partículas).
- Mosca bonus en las bocas y cocodrilo disfrazado de tronco.
- Puntuación, vidas o nivel en vivo en la barra de la plataforma.
- Antitrampas más allá de los límites de SPEC 06.
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "frogger",
  title: "FROGGER",
  short: "Cruza la carretera y el río sin convertirte en papilla.",
  long: "Guía a tu rana con las flechas o WASD a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.",
  cat: "ARCADE",
  cover: "cover-frogger",
  color: "green",
  src: "/games/frogger/index.html",
  controls: {
    pad: [
      { code: "ArrowUp", dir: "up" },
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
      { code: "ArrowDown", dir: "down" },
    ],
    buttons: [],
  },
}
```

```sql
-- supabase/migrations/<version>_add_frogger_to_games.sql
insert into public.games (id, title) values ('frogger', 'FROGGER');
```

```js
// public/games/frogger/game.js — constantes y tipos (resumen)
const COLS = 16,
  ROWS = 14,
  CELL = 40,
  HUD_H = 40,
  BOARD_X = 80;
const ROW_GOALS = 0,
  ROW_RIVER_TOP = 1,
  ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7,
  ROW_ROAD_TOP = 8,
  ROW_ROAD_BOT = 12,
  ROW_START = 13;
const GOAL_COLS = [1, 4, 7, 10, 13]; // cada boca ocupa col y col + 1
const JUMP_MS = 120;
const roundTime = () => Math.max(8, 15 - (level - 1)); // s
const speedMul = () => Math.pow(1.15, level - 1);
// Lane   { row, speed (px/s), dir: 1 | -1, entities: Entity[] }
// Entity { col, width, type: 'car' | 'racer' | 'truck' | 'log' | 'turtle', dives?, phase? }
// Frog   { col, row, animating, animT, fromCol, fromRow, targetCol, targetRow }
// state: 'playing' | 'dying' | 'gameover'
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida.
- `score` enviado: `Math.min(score, MAX_SCORE)`. La puntuación es entera; una ronda completa da unos 1.900 puntos como máximo, muy por debajo de 10.000.000.
- Fin de partida: al acabar la animación de muerte con 0 vidas → `endGame()`. FIN de la plataforma (`av:end`) → `endGame()` si `state !== 'gameover'`.
- Teclas: `↑`/`W`, `↓`/`S`, `←`/`A`, `→`/`D` saltan. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores del tema en `C` (el iframe no ve las variables CSS), con los nombres que luego usará `applySkin()`.
- El iframe lleva `title="FROGGER"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md`, `public/games/snake/game.js` y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/frogger/` desde la plantilla de `/add-game` e implementar la mecánica: constantes, `buildLanes(level)`, movimiento y avance de entidades, ciclo de buceo, salto de la rana con dirección pendiente, `checkRoadCollision`, `getSupport`, `checkGoal`, arrastre del río, temporizador, puntuación, `killFrog()` con la animación de muerte, `completeRound()`, HUD y dibujo con `/frontend-design`. Añadir `preventDefault` a flechas, Espacio y WASD. Verificación: `/games/frogger/index.html` se juega completo, incluidos la pausa con P, "GAME OVER" y el reinicio con Espacio. Al reducir la ventana, el juego se ve entero sin scroll.
2. Repasar el adaptador `av:*` de la plantilla: `lastTime = null`, `clearKeys()` y dirección pendiente descartada en `av:resume` y `av:restart`; `av:key` con `KEY_OF` de las 4 flechas; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni el overlay de pausa ni "GAME OVER". Verificación: abierto directamente sigue igual que en el paso 1.
3. Añadir la entrada `frogger` al final de `GAMES` y la clase `cover-frogger` en `app/globals.css` junto a los demás `cover-*`. Verificación: `/games` muestra la tarjeta FROGGER con su portada, `/juegos/frogger` muestra el detalle y `/juegos/frogger/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_frogger_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_frogger_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `frogger`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #N" y la fila en la pestaña FROGGER de `/salon`.
5. Actualizar `CLAUDE.md`: `frogger` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06).

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/frogger` y `/juegos/frogger/jugar` aparecen prerenderizadas.
- [ ] `/games` muestra la tarjeta FROGGER (ARCADE, green, portada `cover-frogger`) y el filtro ARCADE la incluye.
- [ ] La portada `cover-frogger` se ve igual en la tarjeta y en el detalle.

**Juego embebido**

- [ ] Al entrar en `/juegos/frogger/jugar`, la rana está en la fila de salida, columna 7, y las flechas o WASD la mueven sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] Cada pulsación hace saltar la rana exactamente una celda con una animación de 120 ms; mantener la tecla no repite el salto.
- [ ] La rana no puede salir por los laterales ni por debajo de la fila de salida.
- [ ] Coches, camiones, troncos y tortugas se mueven en bucle por sus carriles y reaparecen por el lado contrario.
- [ ] Las tortugas que bucean avisan medio hundidas y luego se sumergen; sumergidas no sostienen a la rana.
- [ ] Encima de un tronco o de tortugas, la rana se desplaza con ellos; si el arrastre la saca del tablero, muere.
- [ ] La rana muere al tocar un vehículo, al caer al agua, cuando su tortuga se sumerge, al agotarse el tiempo y al llegar al seto o a una boca ocupada; pierde una vida y vuelve a la salida con el tiempo lleno.
- [ ] Al llegar a una boca libre, queda una rana dibujada dentro y la puntuación sube 50 más el bonus de tiempo.
- [ ] Al llenar la 5.ª boca se suman 200, el HUD pasa a NIVEL 2, las bocas se vacían y el tráfico va visiblemente más rápido; el temporizador del nivel 2 es de 14 s.
- [ ] El HUD del canvas muestra SCORE, NIVEL, una rana por vida y la barra de tiempo, que cambia de verde a amarillo y a rojo.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela el juego, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos ni salto pendiente.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder la última vida aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] FIN durante la partida abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja la rana en la salida con SCORE 0, NIVEL 1, 3 vidas y las bocas vacías.

**Leaderboard**

- [ ] `games` contiene la fila `frogger` / `FROGGER` y `list_migrations` muestra `add_frogger_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'frogger'` y la puntuación del HUD.
- [ ] La pestaña FROGGER de `/salon` y el detalle `/juegos/frogger` muestran la puntuación guardada al recargar ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/frogger/jugar` ni en `/salon`.
- [ ] Abrir `/games/frogger/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS, ARKANOID y SNAKE siguen igual que antes, y ninguna ruta existente devuelve 500.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `frogger` es un juego real y está en `games`.

## Decisiones

- **Sí:** juego HTML/canvas en iframe con el protocolo `av:*` en vez de un componente React con play-page propia, por decisión del usuario. Es la arquitectura de todos los juegos reales y permite skins y móvil.
- **Sí:** solo se inserta `(id, title)` en `games`. Los textos, la portada y el color van en `lib/games.ts`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **Sí:** `color: "green"`. La propuesta pedía `lime`, que no existe en `GameColor`; añadirlo sería un cambio de plataforma.
- **Sí:** guardado con el `GameOverModal` común y `saveScore()`. No se añade `av_player_name` ni `user_id` (la tabla no tiene esa columna).
- **Sí:** cuadrícula 16×14 de 40 px dentro del lienzo 4:3 de 800×600, con franja de HUD de 40 px y laterales decorativos. Mantiene el tablero vertical sin tocar el reproductor.
- **Sí:** temporizador por rana (no por ronda). Con 15 s por ronda sería imposible llenar 5 bocas, y el bonus por tiempo restante al ocupar cada boca solo tiene sentido así.
- **Sí:** +10 por fila nueva en cada viaje (no por ronda), como el original.
- **Sí:** velocidades en px/s (las px/frame de la propuesta × 60 fps). El movimiento no depende de la tasa de refresco.
- **Sí:** aviso visual de 0,5 s antes de sumergirse y animación de muerte de 0,6 s sin partículas. Hacen legibles las muertes.
- **Sí:** primitivas canvas, sin sprites.
- **Sí:** mando táctil con las 4 direcciones y sin botones ni `repeat`; un salto por pulsación.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays propios; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`.
- **No:** mosca bonus ni cocodrilo; van en un spec propio.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar. Hay un criterio que lo comprueba.          |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                               |
| Al reanudar, el juego da un salto de tiempo o ejecuta un salto de rana encolado.      | `dt` limitado a 50 ms; `lastTime = null`, `clearKeys()` y dirección pendiente descartada en `av:resume` y `av:restart`. |
| Columna fraccionaria tras el arrastre del río: la rana queda entre celdas.            | Se redondea al saltar a una fila que no es de río; en el río los saltos laterales parten de la columna actual.          |
| Muertes injustas por rozar el borde de un vehículo o de un tronco.                    | Caja de colisión de 0,7 celdas centrada contra vehículos; apoyo en el río por el centro de la rana.                     |
| En niveles altos la velocidad (×1,15 por nivel) hace el juego injugable.              | Es la curva de dificultad elegida; los huecos se mantienen porque el reparto es por ciclo, no por tiempo.               |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 4 aplica la migración antes de verificar el guardado.                                                           |
| `public/games/frogger/` y la página `/games` comparten prefijo.                       | No se crea `app/games/frogger`; `next build` confirma que no hay conflicto, como con los demás juegos.                  |

## Lo que **no** entra en este spec

- Skins y ajustes de móvil (los hacen `skin-designer` y `mobile-porte` después).
- Sonido.
- Animaciones de muerte elaboradas.
- Mosca bonus y cocodrilo.
- Estadísticas en vivo en la barra de la plataforma.
- Antitrampas avanzadas.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
