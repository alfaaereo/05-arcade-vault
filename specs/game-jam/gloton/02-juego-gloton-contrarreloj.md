# SPEC JAM — Juego real GLOTÓN embebido y con leaderboard (propuesta B: contrarreloj con racha)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-22
> **Tema:** LABERINTO VORAZ
> **Propuesta:** B — sin vidas: un reloj que se gana limpiando laberintos y se pierde al ser atrapado, con racha multiplicadora y 8 rondas. Alternativa a `01-juego-gloton-clasico.md`: implementar solo una.
> **Objetivo:** Crear el juego GLOTÓN y hacerlo jugable en `/juegos/gloton/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene hoy ASTEROIDS (SHOOTER), TETRIS (PUZZLE), ARKANOID y SNAKE (ARCADE). Ninguno tiene enemigos con inteligencia propia ni un reloj como recurso. GLOTÓN, un juego de laberinto inspirado en los clásicos de comecocos, es el primero en el que el jugador huye de 4 perseguidores con comportamientos distintos, y el primero en amarillo, color que ningún juego real usa todavía.

Encaja con el tema de la jam, LABERINTO VORAZ, en las tres capas: la mecánica es devorar el laberinto contra el reloj, la ambientación es un laberinto de tubos neón y los textos hablan de un glotón con hambre y de espectros que lo cazan. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09).

El id `gloton` fue el de un juego simulado del prototipo (SPEC 01) que se retiró del catálogo; su URL da 404 hoy y vuelve como juego real. La portada `cover-glot` de aquel juego sigue en `app/globals.css` y se reutiliza.

Esta propuesta cambia la estructura del género: no hay vidas, hay un reloj. Ser atrapado cuesta 10 s, limpiar el laberinto da 20 s y comer puntos sin parar sube un multiplicador hasta ×5. Además, dos de los espectros persiguen de una forma que el género no suele usar: GUARDIÁN vigila los puntos que te quedan por comer y RASTRO sigue tu estela. La propuesta A (`01-juego-gloton-clasico.md`) es la versión clásica con vidas, dispersión/persecución y premios. Esta gana en novedad y en profundidad competitiva (elegir rutas para no romper la racha) y pierde en legibilidad y en riesgo de equilibrado del reloj.

En cuanto `gloton` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/gloton/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>GLOTÓN — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600: franja de HUD de 40 px arriba y laberinto de 27×22 casillas de 24 px (648×528 px) debajo, centrado: origen en `x = 76`, `y = 56`.
  - El laberinto es el mapa `MAP` del modelo de datos: 208 puntos, 4 píldoras de energía, casa de espectros de 7 casillas con puerta de 3 y un túnel en la fila 10 que conecta el borde izquierdo con el derecho. Es el mismo en todas las rondas.
  - HUD: `SCORE n` a la izquierda (cian), el multiplicador `×n` a su derecha (verde, solo si es ×2 o más), `RONDA n` en el centro (amarillo) y `TIEMPO n` a la derecha (magenta, segundos enteros redondeados hacia arriba, parpadea por debajo de 10).
  - Estado inicial: ronda 1, reloj a 90 s, SCORE 0, racha 0. El glotón espera en la casilla `P` (13, 16) mirando a la izquierda con el texto "PULSA UNA FLECHA" bajo la casa; ni él ni el reloj se mueven hasta la primera flecha o WASD.
  - Controles: flechas y WASD. La última dirección pulsada queda en memoria y se aplica en cuanto el pasillo lo permite; el giro de 180° se aplica al instante. Contra una pared, el glotón se detiene.
  - Reloj: baja en tiempo real solo en estado de juego (no durante "¡LISTO!", "¡ATRAPADO!", el parpadeo entre rondas ni la pausa). Nunca pasa de 180 s.
  - Racha: cada punto o píldora comido a menos de 0,6 s del anterior suma 1 a la racha; si pasan 0,6 s sin comer, al ser atrapado o al empezar ronda vuelve a 0. Multiplicador = `min(5, 1 + floor(racha / 20))`, calculado antes de sumar la pieza.
  - Puntuación: punto `10 × multiplicador`, píldora 50 (cuenta para la racha, no se multiplica), espectros comidos en una misma píldora 200, 400, 800 y 1.600, ronda limpia `1.000 × ronda` y, al completar la ronda 8, `100 × segundos restantes` (redondeados hacia abajo).
  - Espectros: 4, con IA propia (ver Modelo de datos) y siempre en persecución: no hay modo dispersión. En cada centro de casilla eligen, entre las salidas libres sin dar media vuelta, la que deja más cerca (distancia euclídea) su casilla objetivo; en empate, por orden arriba, izquierda, abajo, derecha.
  - GUARDIÁN apunta a la pieza restante (punto o píldora) más alejada del glotón; con 10 piezas o menos, persigue al glotón directamente.
  - RASTRO apunta a la casilla más antigua de las 16 últimas que ha pisado el glotón; con el historial vacío, al glotón.
  - Píldora: los espectros fuera de casa pasan a asustados (azul, huyen eligiendo al azar en cada cruce, 50 % de velocidad) durante `max(2,5; 6 − 0,5 × (ronda − 1))` s y parpadean en blanco el último segundo. Cada espectro comido suma además 2 s al reloj. Comer otra píldora reinicia el susto y la cadena de 200.
  - Espectro comido: queda como ojos, vuelve a la casa a 15 casillas/s, revive dentro y sale de nuevo persiguiendo.
  - Salidas de casa al empezar cada ronda y tras cada captura: ACECHO empieza fuera, en (13, 8); EMBOSCADA sale a 1 s, GUARDIÁN a 3 s y RASTRO a 5 s.
  - Velocidad (casillas/s): glotón `7,5 + 0,1 × (ronda − 1)`, espectros `6,5 + 0,4 × (ronda − 1)` (desde la ronda 5 son más rápidos que el glotón), a la mitad en las celdas del túnel (fila 10, columnas 0–5 y 21–26).
  - Colisión: distancia entre centros menor que 12 px, comprobada en cada paso fijo.
  - Al ser atrapado: −10 s de reloj (mínimo 0), racha a 0, 1 s de "¡ATRAPADO!" con el glotón encogiéndose, todos vuelven a su posición inicial con el historial de RASTRO vacío, "¡LISTO!" 1 s y sigue la ronda con los puntos que quedaban. Si el reloj quedó a 0, al acabar la animación termina la partida.
  - Ronda limpia al comer la última pieza: +20 s de reloj y `1.000 × ronda`, el laberinto parpadea 1,5 s y empieza la siguiente ronda con todas las piezas y "¡LISTO!" 1 s.
  - Fin de partida: el reloj llega a 0 (jugando o tras una captura) o se limpia la ronda 8 (con bonus de tiempo). Ambos pasan por `endGame()`.
  - Las paredes se dibujan una vez en un canvas fuera de pantalla con su brillo y se copian en cada frame.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. El reloj, la racha y todos los temporizadores avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibujan "TIEMPO AGOTADO" ni "¡LABERINTO DEVORADO!", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart` y `av:end`. Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "TIEMPO AGOTADO" o "¡LABERINTO DEVORADO!" con la puntuación y Espacio reinicia.
- Nueva entrada `gloton` al final de `GAMES` en `lib/games.ts`.
- Portada: reutiliza `cover-glot` de `app/globals.css`.
- Migración `supabase/migrations/<version>_add_gloton_to_games.sql` que inserta `gloton` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Controles táctiles.
- Puntuación, reloj o ronda en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Varios laberintos por ronda.
- Portada propia `cover-gloton`.
- Vidas, ciclo dispersión/persecución, premio de nivel y las IAs PINZA y ERRANTE (propuesta A).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "gloton",
  title: "GLOTÓN",
  short: "Devora el laberinto contra el reloj y no rompas la racha.",
  long: "Guía al glotón con las flechas o WASD y cómete los 208 puntos del laberinto antes de que se acabe el tiempo. Come sin parar para subir el multiplicador hasta ×5. Cuatro espectros te cazan a su manera: uno te persigue, otro te corta el paso, otro vigila los puntos que te faltan y el último sigue tu estela. Cada vez que te atrapan pierdes 10 segundos; cada laberinto limpio te da 20. Aguanta ocho rondas.",
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
// public/games/gloton/game.js — mapa, reloj, racha, IA, bucle y modo embebido (resumen; protocolo completo en SPEC 05)
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
const MAX_ROUND = 8;
const CLOCK_START = 90,
  CLOCK_MAX = 180,
  CAUGHT_PENALTY = 10,
  CLEAR_BONUS_S = 20,
  GHOST_BONUS_S = 2;
const STREAK_GAP = 0.6; // s máximos entre dos piezas para mantener la racha
const multiplier = () => Math.min(5, 1 + Math.floor(streak / 20));
const playerSpeed = () => 7.5 + 0.1 * (round - 1); // casillas/s
const ghostSpeed = () => 6.5 + 0.4 * (round - 1); // ×0,5 en túnel y asustados; ojos 15
const frightSecs = () => Math.max(2.5, 6 - 0.5 * (round - 1));
const RELEASE = { acecho: 0, emboscada: 1, guardian: 3, rastro: 5 }; // s desde "¡LISTO!"
// Espectros: casilla objetivo, siempre en persecución
const GHOSTS = {
  acecho: { color: C.magenta, chase: () => pTile }, // te persigue
  emboscada: { color: C.cyan, chase: () => ahead(pTile, pDir, 4) }, // te corta el paso
  guardian: {
    color: C.green,
    chase: () => (piecesLeft <= 10 ? pTile : farthestPiece(pTile)),
  }, // vigila lo que te falta
  rastro: { color: C.orange, chase: () => trail[0] ?? pTile }, // trail: últimas 16 casillas del glotón, la más antigua primero
};
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // mueve, come, colisiona, baja el reloj y avanza temporizadores; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla) | 'starting' (¡LISTO! 1 s) | 'playing' | 'caught' (1 s) | 'cleared' (1,5 s) | 'gameover'
// endGame(reason) — 'tiempo' | 'completa'; con 'completa' suma 100 × floor(clock) antes de enviar
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('tiempo')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico (cota superior) por ronda: 208 puntos con la mejor racha posible (8.560), 4 píldoras (200) y 4 cadenas completas de espectros (12.000). En 8 rondas son 166.080, más los bonus de ronda (36.000) y el de tiempo con el reloj al máximo (18.000): 220.080, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, cuando el reloj llega a 0 jugando o al acabar la animación de captura con el reloj a 0 → `endGame('tiempo')`; al limpiar la ronda 8 → `endGame('completa')`. FIN de la plataforma (`av:end`) → `endGame('tiempo')`, sin bonus.
- Teclas: `↑`/`W`, `↓`/`S`, `←`/`A`, `→`/`D` dirigen al glotón. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS), con dos añadidos: `orange: "#ff7700"` (RASTRO) y `blue: "#3a5bff"` (asustados). Glotón en amarillo, paredes en cian con brillo, puerta en magenta, puntos en `C.ink`, píldoras en amarillo con pulso, multiplicador en verde.
- El iframe lleva `title="GLOTÓN"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador de pasos fijos, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/gloton/` desde la plantilla de `/add-game`. Implementar el mapa y su dibujo (paredes prerenderizadas, puntos, píldoras, puerta), el glotón con su memoria de dirección, el bucle de pasos fijos de 1/120 s, puntos, píldoras, racha y multiplicador, reloj, HUD y paso de ronda con sus bonus. Verificación: `/games/gloton/index.html` muestra el laberinto entero y centrado, el reloj no baja hasta la primera tecla, comer 20 piezas seguidas muestra ×2 en el HUD, detenerse 0,6 s lo quita, cruzar el túnel funciona y limpiar el laberinto suma 20 s y pasa a RONDA 2. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir los 4 espectros: salida de casa, elección de casilla en cada cruce, las 4 IAs con el historial de 16 casillas de RASTRO, susto con +2 s por espectro, ojos que vuelven a casa, cadena 200–1.600, captura con −10 s, "¡ATRAPADO!" y "¡LISTO!", y los dos finales con `endGame()`. Verificación: abierto directamente, cada espectro se comporta según su IA, P pausa con overlay, al agotar el reloj aparece "TIEMPO AGOTADO" y Espacio reinicia con 90 s en RONDA 1.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni "PAUSA" ni "TIEMPO AGOTADO" ni "¡LABERINTO DEVORADO!". Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `gloton` al final de `GAMES`. Verificación: `/games` muestra la tarjeta GLOTÓN con `cover-glot`, `/juegos/gloton` muestra el detalle y `/juegos/gloton/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_gloton_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_gloton_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `gloton`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña GLOTÓN de `/salon`.
6. Actualizar `CLAUDE.md`: `gloton` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego con movimiento continuo por casillas usa pasos fijos de 1/120 s sobre rAF, y que su reloj de partida solo avanza dentro de esos pasos, así que la pausa de la plataforma lo congela. Verificación: las dos secciones nombran `gloton`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/gloton` y `/juegos/gloton/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta GLOTÓN (ARCADE, yellow, portada `cover-glot`) y el filtro ARCADE la incluye.

**Juego embebido**

- [ ] Al entrar en `/juegos/gloton/jugar`, el glotón espera quieto con "PULSA UNA FLECHA", el HUD marca `TIEMPO 90` sin bajar, y la primera flecha o WASD pone en marcha al glotón y al reloj sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] Pulsar `↑` antes de llegar a un cruce hace que el glotón gire en ese cruce; pulsar la dirección contraria lo da la vuelta al instante; contra una pared se detiene.
- [ ] Las 20 primeras piezas seguidas suman 10 cada punto; a partir de la 21.ª el HUD muestra `×2` y cada punto suma 20; con 80 seguidas muestra `×5` y no sube más.
- [ ] Quedarse 0,6 s sin comer (p. ej. en el pasillo vacío bajo la casa) quita el multiplicador del HUD y el siguiente punto vuelve a sumar 10.
- [ ] Al salir por el túnel de la fila 10 por la izquierda, el glotón entra por la derecha (y al revés).
- [ ] ACECHO sale de casa al empezar y EMBOSCADA, GUARDIÁN y RASTRO salen a 1, 3 y 5 s.
- [ ] GUARDIÁN se dirige a la zona del laberinto con piezas más alejada del glotón y, con 10 piezas o menos, persigue al glotón; RASTRO recorre las casillas por las que acaba de pasar el glotón.
- [ ] Al comer una píldora en la ronda 1, los espectros se vuelven azules 6 s, parpadean el último segundo y comerlos en cadena suma 200, 400, 800 y 1.600 y 2 s de reloj cada uno.
- [ ] Al ser atrapado, el reloj baja 10 s, se pierde el multiplicador, aparece "¡ATRAPADO!" 1 s con el reloj parado, todos vuelven a su sitio, aparece "¡LISTO!" y siguen las piezas que quedaban.
- [ ] Al limpiar el laberinto, el reloj sube 20 s (sin pasar de 180), SCORE sube `1.000 × ronda`, el laberinto parpadea 1,5 s y empieza la ronda siguiente con todas las piezas y espectros visiblemente más rápidos.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela al glotón, los espectros, el reloj, la racha y el susto, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin que nadie avance de golpe, con los mismos segundos de reloj y sin perder el multiplicador.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al llegar el reloj a 0 aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "TIEMPO AGOTADO".
- [ ] Ser atrapado con menos de 10 s en el reloj lo deja a 0 y, al acabar "¡ATRAPADO!", abre el modal.
- [ ] Al limpiar la ronda 8 aparece el modal con la puntuación del HUD más 100 por segundo restante, y el canvas no dibuja "¡LABERINTO DEVORADO!".
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el glotón quieto en su salida con "PULSA UNA FLECHA", las 208 piezas y 4 píldoras, SCORE 0, RONDA 1, `TIEMPO 90` y sin multiplicador.

**Leaderboard**

- [ ] `games` contiene la fila `gloton` / `GLOTÓN` y `list_migrations` muestra `add_gloton_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'gloton'` y la puntuación del HUD.
- [ ] La pestaña GLOTÓN de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/gloton/jugar` ni en `/salon`.
- [ ] Abrir `/games/gloton/index.html` directamente permite pausar con `P`, muestra "TIEMPO AGOTADO" al acabarse el reloj y "¡LABERINTO DEVORADO!" al completar la ronda 8, y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS, ARKANOID y SNAKE siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `gloton` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta B (contrarreloj) como alternativa, no como recomendada, por decisión del agente. Aporta más novedad y más profundidad competitiva (rutas para no romper la racha, cuándo arriesgar 10 s), pero el reloj y las penalizaciones necesitan más ajuste y el jugador tarda más en entender por qué gana o pierde. La A es más legible y tiene menos riesgo.
- **Sí:** id `gloton` y título `GLOTÓN`, por decisión del agente. Es el nombre propio en español del juego simulado del prototipo, que se retiró del catálogo, así que su URL vuelve como juego real. `laberinto` lo tiene reservado la sugerencia del game-planner.
- **Sí:** ARCADE y yellow, por decisión del agente. Es un arcade puro (VERSUS exige un rival, no perseguidores) y estrena el amarillo, sin uso en los juegos reales. Queda como tercer ARCADE; PUZZLE, SHOOTER y VERSUS siguen pendientes de equilibrar.
- **Sí:** portada `cover-glot` reutilizada, por decisión del agente. Ya dibuja un glotón amarillo con puntos y se ve igual en tarjeta y detalle; una portada propia queda fuera.
- **Sí:** laberinto propio de 27×22 casillas de 24 px, simétrico y con un túnel, el mismo en las 8 rondas, por decisión del agente. Cabe en 648×528 bajo el HUD de 40 px, se lee bien a 375px y no copia el mapa de ningún juego comercial. Sus pasillos vacíos (bajo y sobre la casa, túnel) son los que obligan a elegir ruta para no romper la racha.
- **Sí:** reloj en lugar de vidas, empezando en 90 s, con −10 s por captura, +20 s por ronda, +2 s por espectro comido y tope de 180 s, por decisión del agente. Un jugador medio limpia la ronda 1 en unos 40 s, así que el reloj aprieta sin cortar la partida al primer error.
- **Sí:** racha con hueco de 0,6 s y multiplicador hasta ×5 cada 20 piezas, por decisión del agente. A 7,5 casillas/s el glotón tarda 0,13 s por casilla, así que solo rompe la racha al cruzar pasillos vacíos o al dudar.
- **Sí:** espectros siempre en persecución, sin dispersión, por decisión del agente. La presión es constante, y los respiros vienen del túnel, de las píldoras y de sus velocidades más bajas en las primeras rondas.
- **Sí:** GUARDIÁN y RASTRO en lugar de dos IAs clásicas, por decisión del agente. GUARDIÁN castiga dejar puntos sueltos y RASTRO castiga volver sobre tus pasos: las dos refuerzan el contrarreloj. Con 10 piezas o menos, GUARDIÁN deja de vigilar y persigue, para que no se quede parado sobre el último punto.
- **Sí:** pasos fijos de 1/120 s sobre rAF, con el reloj dentro de esos pasos, por decisión del agente. A la velocidad máxima (15 casillas/s de los ojos) cada paso mueve 3 px, así que nadie se salta un cruce, y la pausa congela el reloj sin código aparte.
- **Sí:** el glotón y el reloj esperan a la primera tecla, por decisión del agente. Evita perder segundos antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** 8 rondas con bonus final de 100 por segundo, por decisión del agente. La partida siempre termina y la puntuación tiene un techo conocido de 220.080.
- **Sí:** FIN de la plataforma termina sin bonus de tiempo, por decisión del agente. El bonus solo premia completar las 8 rondas.
- **No:** usar los sprites de frutas de `references/souce-assets/snake-assets/`, por decisión del agente. No hay premio en esta propuesta, y pesan 586 KB y tienen una licencia dudosa.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                            | Mitigación                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                                        | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el glotón y el reloj esperan a la primera tecla. Hay un criterio que lo comprueba. |
| `av:gameover` se envía dos veces en la misma partida (p. ej. reloj a 0 y FIN casi a la vez).      | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                                         |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos y todos saltan. | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                             |
| El reloj o la racha siguen corriendo durante la pausa y el jugador pierde tiempo o multiplicador. | Reloj, racha y temporizadores avanzan solo dentro de `step()`, que no se ejecuta en pausa.                                                                        |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.             | El paso 5 aplica la migración antes de verificar el guardado.                                                                                                     |
| La puntuación supera 10.000.000.                                                                  | Máximo teórico de 220.080; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                                      |
| El reloj queda mal equilibrado: la partida dura demasiado poco o casi nunca se agota.             | Todos los valores están en constantes (`CLOCK_START`, `CAUGHT_PENALTY`, `CLEAR_BONUS_S`…); se prueban 3 partidas en la verificación del paso 2 y se ajustan ahí.  |
| GUARDIÁN se queda vigilando el último punto y la ronda no se puede cerrar.                        | Con 10 piezas o menos pasa a perseguir al glotón y se aleja de ese punto.                                                                                         |
| Buscar la pieza más alejada en cada cruce cuesta demasiado.                                       | Son como mucho 212 piezas y se recalcula solo en los centros de casilla de GUARDIÁN, unas 8 veces por segundo.                                                    |
| El glotón o un espectro se pasa del centro de una casilla y no gira, o se mete en la pared.       | Al llegar al centro se ajusta a él, decide la dirección y gasta el resto del movimiento del paso en la nueva.                                                     |
| Un espectro se queda atascado en la casa o entra por la puerta sin ser ojos.                      | La puerta solo es transitable al salir de casa y para los ojos; al salir, el espectro va a la columna 13 y sube hasta (13, 8).                                    |
| `shadowBlur` en cientos de formas por frame baja los FPS en equipos modestos.                     | Paredes prerenderizadas una vez en un canvas fuera de pantalla; el brillo en vivo solo para glotón, espectros y píldoras.                                         |
| El parecido con el clásico comercial plantea dudas de propiedad intelectual.                      | Nombre, laberinto, nombres de espectros, reloj y racha son propios; solo se toma la idea general del género.                                                      |
| Con 375px de ancho las casillas de 24 px quedan en unos 11 px y los puntos apenas se ven.         | Puntos de 4 px y píldoras de 10 px con brillo; hay un criterio a 375px.                                                                                           |

## Lo que **no** entra en este spec

- Sonido.
- Controles táctiles.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Varios laberintos por ronda.
- Portada propia `cover-gloton`.
- Vidas, dispersión, premio y las IAs de la propuesta A.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
