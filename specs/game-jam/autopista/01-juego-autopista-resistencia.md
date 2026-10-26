# SPEC JAM — Juego real AUTOPISTA NEÓN embebido y con leaderboard (propuesta A: resistencia)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-24
> **Tema:** AUTOPISTA NEÓN
> **Propuesta:** A — carrera de resistencia por 10 niveles con acelerador y freno, 3 puntos de integridad, combustible que se gasta con la velocidad y cadena de rasantes (×1 a ×5). Alternativa a `02-juego-autopista-contraflujo.md`: implementar solo una.
> **Objetivo:** Crear el juego AUTOPISTA NEÓN y hacerlo jugable en `/juegos/autopista/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y varios ARCADE de tablero o cuadrícula (ARKANOID, SNAKE, FROGGER). Ninguno es un juego de conducción con scroll vertical continuo ni gestiona un recurso que se agota. AUTOPISTA NEÓN, sugerida por el game-planner (`autopista`, ARCADE · cyan, 2026-10-21), es una carrera cenital infinita: el jugador esquiva tráfico a velocidad creciente y vigila el combustible. Es el tercer juego cian, color que hasta ahora usan ASTEROIDS y ARKANOID.

Se parece a FROGGER en que hay coches en una carretera, pero se juega al revés: allí se cruza a pie por saltos de casilla; aquí se conduce, el movimiento es continuo y el peligro viene de la velocidad relativa.

Encaja con el tema de la jam, AUTOPISTA NEÓN, en las tres capas: la mecánica es conducir y esquivar, la ambientación es una autopista synthwave de líneas cian y magenta sobre fondo oscuro, y los textos hablan de rasantes, bidones y meta. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de resistencia: tú decides la velocidad (↑ acelera, ↓ frena), el combustible se gasta más cuanto más rápido vas, tienes 3 puntos de integridad y la puntuación premia rozar el tráfico encadenando rasantes. Gana frente a la propuesta B (`02-juego-autopista-contraflujo.md`) en legibilidad (un solo sentido, un solo recurso extra) y en control del jugador, y pierde en novedad y en tensión por segundo: B tiene contramano, nitro y no tiene freno.

En cuanto `autopista` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/autopista/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>AUTOPISTA NEÓN — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600 en vista cenital. La carretera ocupa `x = 200…600` (4 carriles de 100 px, centros en `x = 250, 350, 450, 550`) y cubre todo el alto. A cada lado hay un panel de 200 px con el HUD y decorado neón (rejilla y postes de luz magenta que se desplazan con la carretera). No hay HUD sobre la carretera.
  - El coche del jugador (deportivo cian de 44×76 px, hitbox 36×64) está fijo en `y = 470` mirando hacia arriba; solo se mueve en horizontal. La carretera y el tráfico se desplazan hacia abajo.
  - HUD (fuente "Press Start 2P"): panel izquierdo con `SCORE` (cian), `NIVEL n/10` (amarillo) y `KM x,x` (tinta); panel derecho con `KM/H` (tinta), barra vertical de combustible de 200 px (verde; amarilla por debajo de 50; magenta parpadeante por debajo de 25), 3 iconos de integridad (magenta, uno por punto) y el indicador `RASANTE ×k` con su barra de tiempo.
  - Estado inicial: nivel 1, SCORE 0, combustible 100, integridad 3, velocidad 0, coche en el carril 2 (`x = 350`), sin tráfico y con el texto "PULSA UNA FLECHA". No se mueve nada hasta la primera flecha o WASD.
  - Controles: `←`/`A` y `→`/`D` mueven el coche en horizontal a 320 px/s; `↑`/`W` acelera y `↓`/`S` frena. El coche no puede salir de la carretera (el centro queda entre `x = 218` y `x = 582`); rozar el borde no penaliza.
  - Velocidad `v` en px/s (se muestra en km/h como `round(v × 0,4)`). Máxima `vMax = min(760, 520 + 30 × (nivel − 1))`; mínima 200; de crucero `0,7 × vMax`. `↑` acelera 300 px/s², `↓` frena 480 px/s² y sin teclas `v` tiende al crucero a 140 px/s². Al empezar acelera de 0 al crucero a 300 px/s² sin teclas.
  - Distancia: 1 m = 10 px de carretera recorrida. Nivel = `min(10, 1 + floor(m / 1.500))`. La meta está en 15.000 m.
  - Combustible: depósito de 100. Gasto por segundo `1 + v / 400` (2,0 a 400 px/s; 2,9 a 760). Un bidón da +35 (máximo 100). Con combustible 0 el coche pierde por falta de gasolina.
  - Bidones: un bidón verde (círculo de radio 14 con rayo) aparece cada `min(1.100, 600 + 60 × (nivel − 1))` m, ±100 m al azar, en un carril al azar sin coche en una ventana de 200 px; da +200 puntos y se recoge al solaparse con el coche. Se pierde si sale por debajo de la pantalla.
  - Tráfico (hitbox, velocidad propia constante en px/s, siempre en el mismo sentido que el jugador; en pantalla se mueve a `v − velocidad propia`):
    - SEDÁN (magenta, 40×68, 230): mantiene su carril.
    - CAMIÓN (naranja, 50×140, 180): mantiene su carril; desde el nivel 2.
    - DEPORTIVO (amarillo, 40×64, 300): desde el nivel 3. Cuando su centro está entre `y = 150` y `y = 330` y el carril contiguo hacia el jugador está libre en 150 px, parpadea el intermitente 0,8 s y cambia a ese carril a 140 px/s (solo una vez por coche).
  - Generación: cada vez que la carretera avanza `max(240, 500 − 30 × (nivel − 1))` px desde la última fila, aparece una fila a `y = −120` con `1 + floor(nivel / 4)` coches (1 en los niveles 1–3, 2 en 4–7, 3 en 8–10) en carriles distintos. Invariante: en cualquier franja de 220 px de la parte alta de la pantalla siempre queda al menos un carril libre. Los coches que salen por abajo (`y > 720`) o por arriba (`y < −260`) se eliminan.
  - Colisión: solape de hitboxes en cada paso fijo. Choque: se pierde 1 punto de integridad, el coche contrario desaparece con una explosión de partículas, `v` baja a 200 y el jugador es invulnerable 1,5 s (parpadea, sin colisiones ni rasantes). Con integridad 0, final por choque.
  - Rasante: cuando el centro de un coche contrario cruza la `y` del jugador, si el hueco lateral `|dx| − 18 − medio ancho de su hitbox` está entre 0 (sin tocar) y 22 px, cuenta como rasante. Suma `50 × k` con `k = min(5, 1 + rasantes anteriores de la cadena)`; la cadena se rompe tras 5 s sin rasante o al chocar. Cada coche da como mucho un rasante. Se muestra un destello "+50 ×k" junto al coche.
  - Puntuación: `nivel` puntos por cada metro recorrido, más los rasantes, más 200 por bidón, más el bonus de meta.
  - Fin de partida (todos por `endGame()`): integridad 0, combustible 0 o llegar a la meta (15.000 m). Choque y falta de combustible hacen 1,2 s de animación (el coche decelera y se rompe o se apaga) antes de terminar; la meta muestra "¡META!" 2,5 s con el coche saliendo por arriba. Bonus de meta: 2.000 por punto de integridad y 50 por punto de combustible (enteros).
  - Todo el dibujo con `shadowBlur` en pocas formas por frame: el decorado lateral y las líneas de carril se dibujan sin brillo o con un canvas fuera de pantalla.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Todos los temporizadores (invulnerabilidad, cadena de rasantes, intermitentes, animaciones) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con las cuatro flechas). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡META!" con la puntuación y Espacio reinicia.
- Nueva entrada `autopista` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de 4 flechas y sin botones.
- Portada nueva `cover-autopista` en `app/globals.css`, diseñada con `/frontend-design`: rejilla oscura y líneas de carril discontinuas en cian y magenta sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con el deportivo cian visto desde arriba, su estela y dos coches de tráfico, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_autopista_to_games.sql` que inserta `autopista` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Puntuación, combustible o nivel en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Clima, noche o túneles, motos, ambulancias y tráfico en sentido contrario.
- Gasolineras con repostaje, mejoras entre niveles y garaje.
- Contramano, nitro y reloj por tramos (propuesta B).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "autopista",
  title: "AUTOPISTA NEÓN",
  short: "Esquiva el tráfico neón y no te quedes sin gasolina.",
  long: "Conduce tu deportivo por una autopista de cuatro carriles con las flechas o WASD: ↑ acelera, ↓ frena y ← → cambian de carril. Roza el tráfico sin tocarlo para encadenar rasantes de hasta ×5, recoge los bidones antes de quedarte sin combustible y llega a la meta, a 15 km, de una pieza. Cada metro vale más según el nivel y tienes tres puntos de integridad.",
  cat: "ARCADE",
  cover: "cover-autopista",
  color: "cyan",
  src: "/games/autopista/index.html",
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
-- supabase/migrations/<version>_add_autopista_to_games.sql
insert into public.games (id, title) values ('autopista', 'AUTOPISTA NEÓN');
```

```js
// public/games/autopista/game.js — constantes, bucle y modo embebido (resumen; protocolo completo en SPEC 05)
const ROAD_X = 200,
  LANE_W = 100,
  LANE_X = [250, 350, 450, 550],
  PLAYER_Y = 470,
  V_MIN = 200;
const STEP = 1000 / 120; // paso fijo de simulación en ms
const LEVEL_M = 1500,
  META_M = 15000,
  MAX_LEVEL = 10;
const vMax = () => Math.min(760, 520 + 30 * (level - 1)); // px/s
const vCruise = () => 0.7 * vMax();
const burnPerSec = () => 1 + v / 400; // combustible/s
const rowGap = () => Math.max(240, 500 - 30 * (level - 1)); // px entre filas de tráfico
const carsPerRow = () => 1 + Math.floor(level / 4);
const canisterEveryM = () => Math.min(1100, 600 + 60 * (level - 1));
const TRAFFIC = {
  sedan: { w: 40, h: 68, speed: 230, color: C.magenta },
  camion: { w: 50, h: 140, speed: 180, color: C.orange },
  deportivo: { w: 40, h: 64, speed: 300, color: C.yellow },
};
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // mueve, gasta combustible, colisiona, puntúa; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla) | 'racing' | 'dying' (1,2 s) | 'finished' (2,5 s) | 'gameover'
// endGame(reason) — 'crash' | 'fuel' | 'win' | 'end'; 'win' suma 2000 × integridad + 50 × floor(combustible) al entrar en 'finished'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: metros `1.500 × (1 + 2 + … + 10) = 82.500`, más hasta 931 coches con un rasante de 250 cada uno (232.750), 25 bidones (5.000) y el bonus de meta con integridad 3 y combustible 100 (11.000): 331.250, cota inalcanzable en la práctica y muy por debajo de 10.000.000.
- Fin de partida: en `step()`, integridad 0 → `endGame('crash')` al acabar la animación de 1,2 s; combustible 0 → `endGame('fuel')` igual; distancia ≥ 15.000 m → bonus y, al acabar los 2,5 s de "¡META!", `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada.
- Teclas: `←`/`A`, `→`/`D` mueven; `↑`/`W` acelera; `↓`/`S` frena. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS), con un añadido: `orange: "#ff7700"` (camión). Jugador y líneas de carril en cian, sedán y bordes de carretera en magenta, deportivo en amarillo, bidones y combustible en verde.
- El iframe lleva `title="AUTOPISTA NEÓN"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (velocidades, gasto, huecos, bidones) viven en un objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador de pasos fijos, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/autopista/` desde la plantilla de `/add-game`. Implementar la carretera con scroll, los paneles laterales con el HUD, el coche del jugador con movimiento lateral, acelerador y freno, el bucle de pasos fijos de 1/120 s, la distancia, el nivel, el gasto de combustible y la puntuación por metro. Verificación: `/games/autopista/index.html` espera quieto con "PULSA UNA FLECHA", la primera flecha lo pone en marcha, la velocidad sube al crucero, `↑`/`↓` la cambian, el combustible baja y el SCORE sube con los metros. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir el tráfico (SEDÁN, CAMIÓN, DEPORTIVO con su intermitente), la generación de filas con el invariante de carril libre, las colisiones con integridad e invulnerabilidad, los rasantes con su cadena, los bidones, la meta con su bonus y los tres finales con `endGame()`. Verificación: abierto directamente, un choque quita un punto de integridad y deja 1,5 s de invulnerabilidad, un rasante suma `50 × k`, un bidón da +35 de combustible y +200, vaciar el depósito termina la partida tras 1,2 s y perder los 3 puntos muestra "GAME OVER" y Espacio reinicia desde NIVEL 1.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con las cuatro flechas. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `autopista` (con `controls`) al final de `GAMES` y la portada `cover-autopista` en `app/globals.css`. Verificación: `/games` muestra la tarjeta AUTOPISTA NEÓN con su portada, `/juegos/autopista` muestra el detalle con la misma portada y `/juegos/autopista/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_autopista_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_autopista_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `autopista`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña AUTOPISTA NEÓN de `/salon`.
6. Actualizar `CLAUDE.md`: `autopista` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de scroll continuo usa pasos fijos de 1/120 s sobre rAF, con el coche fijo y el mundo moviéndose. Verificación: las dos secciones nombran `autopista`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/autopista` y `/juegos/autopista/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta AUTOPISTA NEÓN (ARCADE, cyan, portada `cover-autopista`) y el filtro ARCADE la incluye.
- [ ] `cover-autopista` se ve igual de bien en la tarjeta y en el detalle (las capas de `background-image` son válidas).

**Juego embebido**

- [ ] Al entrar en `/juegos/autopista/jugar`, el coche espera quieto en el carril 2 con "PULSA UNA FLECHA" y la primera flecha o WASD lo pone en marcha sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] `←`/`→` mueven el coche entre los 4 carriles sin salirse de la carretera; `↑` acelera hasta `vMax` del nivel, `↓` frena hasta 200 y sin teclas la velocidad vuelve al crucero.
- [ ] El panel derecho muestra KM/H, la barra de combustible baja más rápido a mayor velocidad y las tres marcas de integridad.
- [ ] El SCORE suma `nivel` puntos por metro y el panel izquierdo muestra NIVEL y KM; al pasar 1,5 km el HUD pasa a NIVEL 2.
- [ ] Sin recoger bidones, el depósito inicial dura unos 52 s a velocidad de crucero del nivel 1 y unos 34 s a 760 px/s.
- [ ] Un bidón verde recogido suma 35 al combustible (máximo 100) y 200 al SCORE.
- [ ] Rozar un coche sin tocarlo (hueco de 0 a 22 px) suma 50 y un segundo rasante en menos de 5 s suma 100; la cadena llega a ×5 y se rompe tras 5 s sin rasantes o al chocar.
- [ ] Un choque quita un punto de integridad, hace parpadear el coche 1,5 s sin más colisiones y baja la velocidad a 200.
- [ ] A partir del nivel 3, un DEPORTIVO parpadea el intermitente 0,8 s antes de cambiar al carril contiguo del jugador.
- [ ] En ningún momento hay una fila de tráfico que cierre los 4 carriles a la vez.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] PAUSA congela la carretera, el tráfico y todos los temporizadores, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos de posición y con la misma invulnerabilidad y cadena que quedaban.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder los 3 puntos de integridad aparece, tras 1,2 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al quedarse sin combustible aparece igualmente el modal tras 1,2 s con la puntuación del HUD.
- [ ] Al llegar a los 15.000 m se muestra "¡META!" 2,5 s y el modal trae la puntuación del HUD con el bonus de 2.000 por integridad y 50 por combustible incluido.
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el coche quieto en el carril 2 con "PULSA UNA FLECHA", SCORE 0, NIVEL 1, combustible 100, integridad 3 y sin tráfico.

**Leaderboard**

- [ ] `games` contiene la fila `autopista` / `AUTOPISTA NEÓN` y `list_migrations` muestra `add_autopista_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'autopista'` y la puntuación del HUD.
- [ ] La pestaña AUTOPISTA NEÓN de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/autopista/jugar` ni en `/salon`.
- [ ] Abrir `/games/autopista/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡META!" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) con 3 coches por fila y el decorado lateral en movimiento.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `autopista` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta A (resistencia) como recomendada frente a la B (contraflujo), por decisión del agente. Es más legible (un sentido, freno y acelerador conocidos), la cadena de rasantes y la integridad separan bien a los jugadores en el Salón y tiene menos riesgo de equilibrado que el contramano con nitro. B queda como alternativa si se prefiere una partida más arriesgada.
- **Sí:** id `autopista` y título `AUTOPISTA NEÓN`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/autopista/` ni el id en `GAMES`.
- **Sí:** ARCADE y cyan, tal como los fija la sugerencia. ARCADE ya tiene tres juegos reales (ARKANOID, SNAKE y FROGGER) y este sería el cuarto; PUZZLE, SHOOTER y VERSUS siguen pendientes de equilibrar. Cian pasa a tres juegos: es una limitación asumida de la sugerencia.
- **Sí:** partida finita con meta a 15.000 m y 10 niveles, por decisión del agente. La sugerencia dice "infinita", pero el spec exige partida finita y un techo de puntuación conocido; el combustible ya acaba la mayoría de partidas antes y la meta es el reto de los mejores.
- **Sí:** carretera de 4 carriles en el centro y HUD en paneles laterales de 200 px, por decisión del agente. El HUD no tapa el tráfico y el 4:3 de 800×600 deja una carretera de 400 px, suficiente para esquivar.
- **Sí:** coche fijo en `y = 470` y mundo que se desplaza, por decisión del agente. Simplifica la cámara y las colisiones.
- **Sí:** movimiento lateral continuo y no por carriles, por decisión del agente. Hace posibles los rasantes de 0 a 22 px, que son el núcleo de la puntuación.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. A la velocidad relativa máxima (unos 760 px/s) cada paso mueve 6,3 px, menos que la hitbox más pequeña (36 px), así que ningún coche atraviesa a otro.
- **Sí:** el gasto de combustible crece con la velocidad (`1 + v / 400` por segundo) y los bidones se espacian más con el nivel, por decisión del agente. Obliga a decidir entre ir rápido y vivir más; en el nivel 10 el depósito pierde unos 7 puntos por bidón, de modo que la meta pide haber guardado combustible antes.
- **Sí:** el jugador espera a la primera tecla, por decisión del agente. Evita chocar antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** tráfico solo en el sentido del jugador con tres IAs sencillas (carril fijo y DEPORTIVO que avisa y cambia), por decisión del agente. Mantiene el esfuerzo en M y es legible por el intermitente.
- **Sí:** el tráfico choca y desaparece en lugar de bloquear, por decisión del agente. El jugador nunca queda atascado detrás de un coche.
- **No:** sonido, skins, contramano, nitro y reloj por tramos, por decisión del agente. Los dos últimos son la identidad de la propuesta B.
- **No:** usar assets de `references/`, por decisión del agente. Coches y bidones son formas de canvas con brillo neón, sin riesgo de licencia.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. La animación de "¡META!" sí se dibuja, porque forma parte de la partida.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                            |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el coche espera a la primera tecla. Hay un criterio que lo comprueba.  |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                             |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                 |
| Los temporizadores de invulnerabilidad o cadena siguen corriendo durante la pausa.    | Todos avanzan solo dentro de `step()`, que no se ejecuta en pausa.                                                                                    |
| Una fila de tráfico deja al jugador sin salida y la partida es injusta.               | Invariante de al menos un carril libre en cada franja de 220 px, comprobado al generar; el DEPORTIVO solo cambia de carril si el contiguo está libre. |
| Un bidón aparece encima de un coche o fuera del alcance del jugador.                  | Solo se genera en un carril sin coche en una ventana de 200 px; con 4 carriles siempre hay ruta para llegar a él.                                     |
| Un coche atraviesa al jugador a alta velocidad relativa.                              | Pasos fijos de 1/120 s: máximo 6,3 px por paso frente a una hitbox mínima de 36 px.                                                                   |
| El rasante se cuenta dos veces o con un coche que ya chocó.                           | Bandera por coche (`passed`) y los coches que chocan se eliminan; no hay rasantes durante la invulnerabilidad.                                        |
| El equilibrado de combustible, velocidad y densidad queda demasiado fácil o difícil.  | Todas las cifras en un objeto `TUNING`; un criterio fija cuánto dura el depósito inicial sin bidones (52 s y 34 s).                                   |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 5 aplica la migración antes de verificar el guardado.                                                                                         |
| La puntuación supera 10.000.000.                                                      | Máximo teórico de 331.250; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                          |
| `shadowBlur` en decenas de formas por frame baja los FPS en equipos modestos.         | Brillo solo en coche, tráfico visible y bidones; decorado y líneas sin brillo o prerenderizados en un canvas fuera de pantalla.                       |
| A 375px de ancho el HUD de los paneles laterales (200 px) queda muy pequeño.          | Valores a 16–18 px y etiquetas a 10 px; hay un criterio a 375px.                                                                                      |
| Se confunde con FROGGER por tener coches en una carretera.                            | Perspectiva, control y objetivo distintos (conducción continua, combustible y rasantes); la portada y los textos lo dejan claro.                      |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Clima, túneles, motos y tráfico en sentido contrario.
- Gasolineras, mejoras y garaje.
- Contramano, nitro y reloj por tramos (propuesta B).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
