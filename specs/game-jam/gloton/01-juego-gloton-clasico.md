# SPEC JAM — Juego real GLOTÓN embebido y con leaderboard (propuesta A: clásico por niveles)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-22
> **Tema:** LABERINTO VORAZ
> **Propuesta:** A — laberinto clásico por niveles con 3 vidas, ciclo dispersión/persecución y píldoras de energía. Alternativa a `02-juego-gloton-contrarreloj.md`: implementar solo una.
> **Objetivo:** Crear el juego GLOTÓN y hacerlo jugable en `/juegos/gloton/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene hoy ASTEROIDS (SHOOTER), TETRIS (PUZZLE), ARKANOID y SNAKE (ARCADE). Ninguno tiene enemigos con inteligencia propia: las rocas de ASTEROIDS derivan y SNAKE no tiene rivales. GLOTÓN, un juego de laberinto inspirado en los clásicos de comecocos, es el primero en el que el jugador huye de 4 perseguidores, cada uno con un comportamiento distinto, y el primero en amarillo, color que ningún juego real usa todavía.

Encaja con el tema de la jam, LABERINTO VORAZ, en las tres capas: la mecánica es comer todos los puntos de un laberinto, la ambientación es un laberinto de tubos neón y los textos hablan de un glotón que devora y de espectros que lo cazan. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09).

El id `gloton` fue el de un juego simulado del prototipo (SPEC 01) que se retiró del catálogo; su URL da 404 hoy y vuelve como juego real. La portada `cover-glot` de aquel juego sigue en `app/globals.css` y se reutiliza.

Esta propuesta es la versión clásica: 10 niveles, 3 vidas, los espectros alternan dispersión y persecución, y las píldoras de energía permiten comérselos en cadena. La propuesta B (`02-juego-gloton-contrarreloj.md`) cambia vidas por un reloj, añade una racha multiplicadora y usa otras dos IAs. Esta gana en legibilidad y en riesgo técnico bajo (el género se entiende sin instrucciones) y pierde en novedad.

En cuanto `gloton` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/gloton/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>GLOTÓN — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600: franja de HUD de 40 px arriba y laberinto de 27×22 casillas de 24 px (648×528 px) debajo, centrado: origen en `x = 76`, `y = 56`.
  - El laberinto es el mapa `MAP` del modelo de datos: 208 puntos, 4 píldoras de energía, casa de espectros de 7 casillas con puerta de 3 y un túnel en la fila 10 que conecta el borde izquierdo con el derecho.
  - HUD: `SCORE n` a la izquierda (cian), `NIVEL n` en el centro (amarillo) y una silueta del glotón por vida restante a la derecha (amarillo).
  - Estado inicial: nivel 1, 3 vidas, SCORE 0. El glotón espera en la casilla `P` (13, 16) mirando a la izquierda con el texto "PULSA UNA FLECHA" bajo la casa, y no se mueve hasta la primera flecha o WASD.
  - Controles: flechas y WASD. La última dirección pulsada queda en memoria y se aplica en cuanto el pasillo lo permite; el giro de 180° se aplica al instante. Contra una pared, el glotón se detiene.
  - Puntuación: punto 10, píldora 50, espectros comidos en una misma píldora 200, 400, 800 y 1.600, y premio de nivel según la tabla de dificultad. Al completar el nivel 10, bonus de victoria de 5.000 por vida restante.
  - Premio: un cristal neón aparece en la casilla (13, 12) al comer el punto 70 y el punto 140 de cada nivel y dura 9 s.
  - Espectros: 4, con IA propia (ver Modelo de datos). En cada centro de casilla eligen, entre las salidas libres sin dar media vuelta, la que deja más cerca (distancia euclídea) su casilla objetivo; en empate, por orden arriba, izquierda, abajo, derecha.
  - Ciclo de modos por nivel: niveles 1–4: dispersión 7 s, persecución 20 s, dispersión 7 s, persecución 20 s, dispersión 5 s, persecución 20 s, dispersión 5 s y persecución indefinida. Niveles 5–10: 5, 20, 5, 20, 3, 20, 1 s y persecución indefinida. En cada cambio de modo, los espectros fuera de casa dan media vuelta. El reloj de modos se detiene mientras dura el susto.
  - Píldora: los espectros fuera de casa pasan a asustados (azul, huyen eligiendo al azar en cada cruce, 50 % de velocidad) durante `max(2, 6,5 − 0,5 × nivel)` s y parpadean en blanco el último segundo. Comer otra píldora reinicia el susto y la cadena de 200.
  - Espectro comido: queda como ojos, vuelve a la casa a 15 casillas/s, revive dentro y sale de nuevo con el modo actual.
  - Salidas de casa al empezar cada vida y cada nivel: ACECHO empieza fuera, en (13, 8); EMBOSCADA sale a los 2 s, PINZA a los 5 s y ERRANTE a los 8 s.
  - Velocidad (casillas/s): glotón `7,5 + 0,15 × (nivel − 1)`, espectros `7 + 0,25 × (nivel − 1)`, a la mitad en las celdas del túnel (fila 10, columnas 0–5 y 21–26).
  - Colisión: distancia entre centros menor que 12 px, comprobada en cada paso fijo.
  - Al ser atrapado: 1 s de animación (el glotón se encoge) y se pierde una vida. Con vidas, todos vuelven a su posición inicial, se muestra "¡LISTO!" 1,5 s y sigue el nivel con los puntos que quedaban.
  - Nivel completado al comer el último punto o píldora: el laberinto parpadea 2 s y empieza el siguiente nivel con todos los puntos, "¡LISTO!" 1,5 s y la tabla de dificultad del nivel nuevo.
  - Fin de partida: perder la última vida (tras su animación de 1 s) o completar el nivel 10 (con bonus de victoria). Ambos pasan por `endGame()`.
  - Las paredes se dibujan una vez en un canvas fuera de pantalla con su brillo y se copian en cada frame.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Los temporizadores (modos, susto, premio, "¡LISTO!", animaciones) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibujan "GAME OVER" ni "¡VICTORIA!", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart` y `av:end`. Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡VICTORIA!" con la puntuación y Espacio reinicia.
- Nueva entrada `gloton` al final de `GAMES` en `lib/games.ts`.
- Portada: reutiliza `cover-glot` de `app/globals.css`.
- Migración `supabase/migrations/<version>_add_gloton_to_games.sql` que inserta `gloton` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Controles táctiles.
- Puntuación, vidas o nivel en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Vida extra por puntos, varios laberintos y escenas entre niveles.
- Portada propia `cover-gloton`.
- Reloj, racha multiplicadora y las IAs GUARDIÁN y RASTRO (propuesta B).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "gloton",
  title: "GLOTÓN",
  short: "Devora el laberinto y escapa de cuatro espectros.",
  long: "Guía al glotón con las flechas o WASD y cómete los 208 puntos del laberinto. Cuatro espectros te cazan, cada uno a su manera: uno te persigue, otro te corta el paso, otro te encierra en pinza y el último se lo piensa. Las píldoras de energía los vuelven azules durante unos segundos: cómetelos en cadena por 200, 400, 800 y 1.600 puntos. Tienes tres vidas para superar diez niveles cada vez más rápidos.",
  cat: "ARCADE",
  cover: "cover-glot",
  color: "yellow",
  src: "/games/gloton/index.html",
}
```

```sql
-- supabase/migrations/<version>_add_gloton_to_games.sql
insert into public.games (id, title) values ('gloton', 'GLOTÓN');
```

```js
// public/games/gloton/game.js — mapa, dificultad, IA, bucle y modo embebido (resumen; protocolo completo en SPEC 05)
// # pared · . punto · o píldora · _ pasillo vacío · - puerta · G casa · P salida del glotón
const MAP = [
  "###########################",
  "#............#............#",
  "#.####.#####.#.#####.####.#",
  "#o####.#####.#.#####.####o#",
  "#.........................#",
  "#.####.#.#########.#.####.#",
  "#......#.....#.....#......#",
  "######.#####_#_#####.######",
  "######.#___________#.######",
  "######.#_###---###_#.######",
  "______.__#GGGGGGG#__.______",
  "######.#_#########_#.######",
  "######.#___________#.######",
  "######.#_#########_#.######",
  "#............#............#",
  "#.####.#####.#.#####.####.#",
  "#o...#.......P.......#...o#",
  "####.#.#.#########.#.#.####",
  "#......#.....#.....#......#",
  "#.##########.#.##########.#",
  "#.........................#",
  "###########################",
];
const COLS = 27,
  ROWS = 22,
  CELL = 24,
  OX = 76,
  OY = 56,
  HUD_H = 40;
const STEP = 1000 / 120; // paso fijo de simulación en ms
const MAX_LEVEL = 10;
const playerSpeed = () => 7.5 + 0.15 * (level - 1); // casillas/s
const ghostSpeed = () => 7 + 0.25 * (level - 1); // ×0,5 en túnel y asustados; ojos 15
const frightSecs = () => Math.max(2, 6.5 - 0.5 * level);
const BONUS = [100, 300, 500, 700, 1000, 2000, 3000, 3000, 5000, 5000]; // premio por nivel
const MODES_1_4 = [7, 20, 7, 20, 5, 20, 5, Infinity]; // dispersión, persecución, …
const MODES_5_10 = [5, 20, 5, 20, 3, 20, 1, Infinity];
const RELEASE = { acecho: 0, emboscada: 2, pinza: 5, errante: 8 }; // s desde "¡LISTO!"
// Espectros: casilla objetivo en persecución y esquina de dispersión
const GHOSTS = {
  acecho: { color: C.magenta, corner: { c: 26, r: 0 }, chase: () => pTile }, // te persigue
  emboscada: {
    color: C.cyan,
    corner: { c: 0, r: 0 },
    chase: () => ahead(pTile, pDir, 4),
  }, // te corta el paso
  pinza: {
    color: C.green,
    corner: { c: 26, r: 21 },
    chase: () => mirror(acechoTile, ahead(pTile, pDir, 2)),
  }, // 2 × (casilla 2 delante − ACECHO)
  errante: {
    color: C.orange,
    corner: { c: 0, r: 21 },
    chase: (g) => (dist(g.tile, pTile) > 8 ? pTile : g.corner),
  }, // se lo piensa
};
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // mueve, come, colisiona y avanza temporizadores; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla) | 'starting' (¡LISTO! 1,5 s) | 'playing' | 'dying' (1 s) | 'cleared' (2 s) | 'gameover'
// endGame(reason) — 'gameover' | 'win'; con 'win' suma 5000 × lives antes de enviar
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('gameover')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: 10 niveles × (208 × 10 + 4 × 50 + 4 × 3.000 de espectros) = 142.800, más 2 premios por nivel (41.200) y el bonus de victoria con 3 vidas (15.000): 199.000, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, al terminar la animación de 1 s con `lives === 0` → `endGame('gameover')`; al vaciar el nivel 10 → `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('gameover')`.
- Teclas: `↑`/`W`, `↓`/`S`, `←`/`A`, `→`/`D` dirigen al glotón. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS), con dos añadidos: `orange: "#ff7700"` (ERRANTE) y `blue: "#3a5bff"` (asustados). Glotón y premio en amarillo, paredes en cian con brillo, puerta en magenta, puntos en `C.ink`, píldoras en amarillo con pulso.
- El iframe lleva `title="GLOTÓN"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador de pasos fijos, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/gloton/` desde la plantilla de `/add-game`. Implementar el mapa y su dibujo (paredes prerenderizadas, puntos, píldoras, puerta), el glotón con su memoria de dirección, el bucle de pasos fijos de 1/120 s, puntos y píldoras, HUD y paso de nivel. Verificación: `/games/gloton/index.html` muestra el laberinto entero y centrado, el glotón come los 208 puntos y las 4 píldoras, cruza el túnel de un lado a otro y al vaciar el laberinto pasa a NIVEL 2. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir los 4 espectros: salida de casa, elección de casilla en cada cruce, las 4 IAs, ciclo dispersión/persecución con media vuelta, susto, ojos que vuelven a casa, cadena 200–1.600, premio, vidas con animación y "¡LISTO!", y los dos finales con `endGame()`. Verificación: abierto directamente, cada espectro se comporta según su IA, P pausa con overlay, al perder las 3 vidas aparece "GAME OVER" y Espacio reinicia desde NIVEL 1 con 3 vidas.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni "PAUSA" ni "GAME OVER" ni "¡VICTORIA!". Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `gloton` al final de `GAMES`. Verificación: `/games` muestra la tarjeta GLOTÓN con `cover-glot`, `/juegos/gloton` muestra el detalle y `/juegos/gloton/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_gloton_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_gloton_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `gloton`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña GLOTÓN de `/salon`.
6. Actualizar `CLAUDE.md`: `gloton` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego con movimiento continuo por casillas usa pasos fijos de 1/120 s sobre rAF y que sus espectros eligen casilla en cada cruce. Verificación: las dos secciones nombran `gloton`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/gloton` y `/juegos/gloton/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta GLOTÓN (ARCADE, yellow, portada `cover-glot`) y el filtro ARCADE la incluye.

**Juego embebido**

- [ ] Al entrar en `/juegos/gloton/jugar`, el glotón espera quieto con "PULSA UNA FLECHA" y la primera flecha o WASD lo pone en marcha sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] Pulsar `↑` antes de llegar a un cruce hace que el glotón gire en ese cruce; pulsar la dirección contraria lo da la vuelta al instante; contra una pared se detiene.
- [ ] Cada punto suma 10 y cada píldora 50; el HUD lo refleja al instante.
- [ ] Al salir por el túnel de la fila 10 por la izquierda, el glotón entra por la derecha (y al revés).
- [ ] ACECHO sale de casa al empezar y EMBOSCADA, PINZA y ERRANTE salen a los 2, 5 y 8 s.
- [ ] En persecución, ACECHO sigue al glotón, EMBOSCADA se adelanta a su dirección y ERRANTE, a menos de 8 casillas, se retira a la esquina inferior izquierda.
- [ ] Al comer una píldora en el nivel 1, los espectros se vuelven azules 6 s, parpadean el último segundo y comerlos en cadena suma 200, 400, 800 y 1.600; los ojos vuelven a la casa y el espectro sale de nuevo.
- [ ] Al comer el punto 70 aparece el cristal en (13, 12); comerlo en el nivel 1 suma 100 y, si no se come, desaparece a los 9 s.
- [ ] Al vaciar el laberinto, parpadea 2 s y empieza NIVEL 2 con todos los puntos y los espectros visiblemente más rápidos.
- [ ] Al ser atrapado con vidas, el glotón se encoge, se pierde una silueta del HUD, todos vuelven a su sitio, aparece "¡LISTO!" y siguen los puntos que quedaban.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela al glotón, los espectros y todos los temporizadores (susto, premio, modos), muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin que nadie avance de golpe y con el mismo tiempo de susto que quedaba.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder la última vida aparece, tras la animación de 1 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al completar el nivel 10 aparece el modal con la puntuación del HUD más 5.000 por vida restante, y el canvas no dibuja "¡VICTORIA!".
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el glotón quieto en su salida con "PULSA UNA FLECHA", los 208 puntos y 4 píldoras, SCORE 0, NIVEL 1 y 3 vidas.

**Leaderboard**

- [ ] `games` contiene la fila `gloton` / `GLOTÓN` y `list_migrations` muestra `add_gloton_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'gloton'` y la puntuación del HUD.
- [ ] La pestaña GLOTÓN de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/gloton/jugar` ni en `/salon`.
- [ ] Abrir `/games/gloton/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡VICTORIA!" al ganar, y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS, ARKANOID y SNAKE siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `gloton` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta A (clásica) como recomendada frente a la B (contrarreloj), por decisión del agente. El género se entiende sin instrucciones, el ciclo dispersión/persecución da respiros legibles y la cadena de espectros separa bien a los jugadores en el Salón. Además tiene menos riesgo de equilibrado que un reloj con penalizaciones.
- **Sí:** id `gloton` y título `GLOTÓN`, por decisión del agente. Es el nombre propio en español del juego simulado del prototipo, que se retiró del catálogo, así que su URL vuelve como juego real. `laberinto` lo tiene reservado la sugerencia del game-planner.
- **Sí:** ARCADE y yellow, por decisión del agente. Es un arcade puro (VERSUS exige un rival, no perseguidores) y estrena el amarillo, sin uso en los juegos reales. Queda como tercer ARCADE; PUZZLE, SHOOTER y VERSUS siguen pendientes de equilibrar.
- **Sí:** portada `cover-glot` reutilizada, por decisión del agente. Ya dibuja un glotón amarillo con puntos y se ve igual en tarjeta y detalle; una portada propia queda fuera.
- **Sí:** laberinto propio de 27×22 casillas de 24 px, simétrico y con un túnel, por decisión del agente. Cabe en 648×528 bajo el HUD de 40 px y se lee bien a 375px; no copia el mapa de ningún juego comercial.
- **Sí:** espectros con nombres propios (ACECHO, EMBOSCADA, PINZA, ERRANTE) y comportamientos inspirados en los clásicos, por decisión del agente. Cada uno se distingue al jugar y no hay marcas registradas.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. A la velocidad máxima (15 casillas/s de los ojos) cada paso mueve 3 px, así que nadie se salta un cruce ni atraviesa a otro.
- **Sí:** el glotón espera a la primera tecla, por decisión del agente. Evita perder antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** 10 niveles con victoria y bonus de 5.000 por vida, por decisión del agente. La partida siempre termina y la puntuación tiene un techo conocido de 199.000.
- **No:** vida extra por puntos, por decisión del agente. Simplifica el techo de puntuación y el HUD.
- **No:** usar los sprites de frutas de `references/souce-assets/snake-assets/` para el premio, por decisión del agente. Pesan 586 KB, tienen una licencia dudosa y un cristal neón dibujado encaja mejor con el estilo.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                            | Mitigación                                                                                                                                            |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                                        | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el glotón espera a la primera tecla. Hay un criterio que lo comprueba. |
| `av:gameover` se envía dos veces en la misma partida.                                             | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                             |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos y todos saltan. | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                 |
| Los temporizadores de susto o modos siguen corriendo durante la pausa.                            | Todos avanzan solo dentro de `step()`, que no se ejecuta en pausa.                                                                                    |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.             | El paso 5 aplica la migración antes de verificar el guardado.                                                                                         |
| La puntuación supera 10.000.000.                                                                  | Máximo teórico de 199.000; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                          |
| El glotón o un espectro se pasa del centro de una casilla y no gira, o se mete en la pared.       | Al llegar al centro se ajusta a él, decide la dirección y gasta el resto del movimiento del paso en la nueva.                                         |
| Un espectro se queda atascado en la casa o entra por la puerta sin ser ojos.                      | La puerta solo es transitable al salir de casa y para los ojos; al salir, el espectro va a la columna 13 y sube hasta (13, 8).                        |
| `shadowBlur` en cientos de formas por frame baja los FPS en equipos modestos.                     | Paredes prerenderizadas una vez en un canvas fuera de pantalla; el brillo en vivo solo para glotón, espectros y píldoras.                             |
| El parecido con el clásico comercial plantea dudas de propiedad intelectual.                      | Nombre, laberinto, nombres de espectros y estética son propios; solo se toma la idea general del género.                                              |
| Con 375px de ancho las casillas de 24 px quedan en unos 11 px y los puntos apenas se ven.         | Puntos de 4 px y píldoras de 10 px con brillo; hay un criterio a 375px.                                                                               |

## Lo que **no** entra en este spec

- Sonido.
- Controles táctiles.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Vida extra, varios laberintos y escenas entre niveles.
- Portada propia `cover-gloton`.
- Reloj, racha y las IAs de la propuesta B.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
