# SPEC JAM — Juego real SALTO CÓSMICO embebido y con leaderboard (propuesta B: vacío)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-29
> **Tema:** SALTO CÓSMICO
> **Propuesta:** B — huida de un agujero negro que sube cada vez más rápido, con una sola vida, impulso aéreo con Espacio, racha de aterrizajes ascendentes y portal a 4.000 m. Alternativa a `01-juego-salto-ascenso.md`: implementar solo una.
> **Objetivo:** Crear el juego SALTO CÓSMICO y hacerlo jugable en `/juegos/salto/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y varios ARCADE de tablero, casillas o paleta (ARKANOID, SNAKE, FROGGER). Ninguno es un juego de plataformas con gravedad: aquí el jugador no controla la altura del salto, solo la posición horizontal, y la dificultad sale de dónde y cómo aterriza. Tampoco hay todavía ningún juego amarillo entre los reales: SALTO CÓSMICO, sugerido por el game-planner (`salto`, ARCADE · yellow, 2026-10-21), estrena el color.

Encaja con el tema de la jam, SALTO CÓSMICO, en las tres capas: la mecánica es saltar sin parar de plataforma en plataforma, la ambientación es una columna de balsas de neón flotando sobre un cielo de estrellas perseguida por un agujero negro, y los textos hablan de vacío, núcleos, racha y portal. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la del vacío: no hay zonas ni enemigos; la presión viene de un agujero negro que sube desde abajo, primero despacio y cada vez más deprisa, y de una sola vida. Se puede caer a plataformas más bajas mientras el vacío no las haya devorado. La puntuación premia la altura y, sobre todo, encadenar aterrizajes en plataformas cada vez más altas, y más aún hacerlo rozando el vacío. Un impulso aéreo con Espacio (uno por salto) permite corregir y llegar a plataformas difíciles. Gana frente a la propuesta A (`01-juego-salto-ascenso.md`) en tensión por segundo, rejugabilidad y diferenciación en el Salón (la racha y el riesgo separan mucho a los jugadores); pierde en legibilidad (hay que entender el vacío, la racha y el impulso) y en riesgo de equilibrado, porque la velocidad del vacío es la palanca de toda la dificultad.

En cuanto `salto` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/salto/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos y formas de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>SALTO CÓSMICO — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600 en vista lateral. La columna de juego ocupa `x = 160…640` (480 px) y cubre todo el alto. A cada lado hay un panel de 160 px con el HUD y decorado neón (estrellas en paralaje, que solo se redibujan desde un canvas fuera de pantalla). No hay HUD sobre la columna.
  - Mundo: la altura `h` crece hacia arriba en px; 1 m = 10 px. La base (suelo de salida) es `h = 0`. La cámara guarda `camH`, la altura del borde inferior de la pantalla (empieza en −60, así que la base se ve en `y = 540`). Una altura `h` se dibuja en `y = 600 − (h − camH)`. La cámara solo sube: cuando los pies del jugador quedan por encima de `y = 260`, `camH` sube lo necesario para dejarlos en `y = 260`; además `camH` nunca queda por debajo de `voidH − 60`, de modo que el vacío arrastra la cámara y siempre se ven al menos 60 px de él cuando ya ha entrado en pantalla.
  - Jugador: astronauta-cohete amarillo con visera cian de 28 px de ancho de hitbox y 36 px de alto, que se dibuja con `x` central. Solo se controla en horizontal, más el impulso.
  - Agujero negro (el vacío): una superficie horizontal de altura `voidH` que ocupa toda la pantalla por debajo (disco negro con borde magenta ondulado y partículas que son absorbidas). Empieza en `voidH = −200` (fuera de la pantalla) y sube a `vVoid = 40 + 0,9 × t` px/s, con `t` los segundos de partida jugados (sin tope, así que acaba alcanzando a cualquier jugador). Devora las plataformas cuyo borde superior queda por debajo de `voidH` (se descartan) y las estrellas.
  - HUD (fuente "Press Start 2P"): panel izquierdo con `SCORE` (cian), `ALTURA n M` (tinta) y `RACHA ×k` (amarillo, `×1` si no hay racha); panel derecho con `VACÍO −n M` (magenta; metros que hay entre los pies del jugador y el vacío, parpadea por debajo de 12 m), un indicador `IMPULSO ●` (amarillo, `○` apagado si ya se usó en este salto) y `NÚCLEOS n`.
  - Estado inicial: `ready`, SCORE 0, RACHA ×1, impulso disponible, jugador de pie en el centro de la base (`x = 400`), base de 480×16 px que ocupa toda la columna en `h = 0`, plataformas ya generadas hasta 800 px por encima de la pantalla y el texto "PULSA ← O →". No se mueve nada ni sube el vacío hasta la primera pulsación de `←`, `→`, `A`, `D` o `Espacio`; al pulsar, el jugador salta y empieza a contar `t`.
  - Controles: `←`/`A` y `→`/`D` mueven al jugador a 300 px/s (velocidad directa, sin inercia; sin tecla se queda en su `x`). Si sale por un lado de la columna entra por el otro (envuelve; el sprite se dibuja en ambos bordes mientras cruza). `Espacio` es el IMPULSO: estando en el aire y con el impulso disponible, pone `vy = max(vy, 520)` y gasta el impulso (llamarada bajo el jugador); el impulso se recarga cada vez que se aterriza. No se puede usar en el suelo ni dos veces en el mismo salto.
  - Física, en pasos fijos: gravedad `g = 1.500` px/s², velocidad vertical `vy` en px/s positiva hacia arriba, mínimo −1.000. Aterrizar en una plataforma da `vy = 780` (salto de 203 px de alto y 1,04 s de duración). Un resorte da `vy = 1.250` (521 px, 1,67 s). El jugador no puede saltar por sí mismo: rebota al aterrizar.
  - Aterrizaje: solo si `vy < 0`, si los pies pasan de estar por encima de la cara superior de una plataforma a estar por debajo en ese paso (comprobación por barrido, no por posición final) y si el centro del jugador está dentro del ancho de la plataforma ±14 px. Las plataformas no bloquean por los lados ni por abajo: se atraviesan subiendo.
  - Plataformas (todas de 14 px de grosor), con `a` la altura en metros a la que se genera: ancho `max(56, 80 − 0,006 × a)` (80 abajo, 56 a los 4.000 m). Cada plataforma nueva se genera sobre la anterior a una distancia vertical aleatoria uniforme entre 70 y 150 px, con una `x` aleatoria que nunca queda a más de 300 px en horizontal de la anterior. Tipos, decididos con una única tirada en este orden:
    - FRÁGIL (magenta `C.magenta` con grietas, probabilidad `min(0,37, 0,05 + 0,00008 × a)`): da el rebote normal y a continuación se rompe (cae y desaparece en 0,4 s). Nunca hay dos frágiles seguidas; la primera tras una frágil es siempre ESTÁTICA o MÓVIL.
    - MÓVIL (cian `C.cyan`, probabilidad `0,10 + 0,00005 × a`, máx. 0,30): se mueve horizontalmente ±70 px alrededor de su `x` a `60 + 0,02 × a` px/s, sin salir de la columna.
    - RESORTE (estática con un resorte amarillo de 24×12 px encima, probabilidad 0,06): aterrizar sobre el resorte (centro del jugador a ±12 px del centro de la plataforma) da `vy = 1.250`; si no, rebote normal.
    - ESTÁTICA (verde `C.green`): el resto.
  - Núcleos de energía: un núcleo amarillo (radio 12) cada 200 m, a 40 px sobre la plataforma más cercana a esa altura, desde los 200 m hasta los 3.800 m (19 núcleos). Al recogerlo suma 100 puntos, 1 al contador y hace retroceder el vacío 150 px (`voidH −= 150`) con un destello. Si el vacío o el borde inferior de la pantalla lo dejan atrás, se pierde.
  - Altura: `maxH` es la altura máxima alcanzada por los pies sobre la base; metros = `floor(maxH / 10)`. Cada metro nuevo suma 1 punto (sin zonas).
  - Racha y puntuación por aterrizaje: cada aterrizaje en una plataforma (frágil, móvil, resorte o estática) cuya cara superior queda al menos 1 px más alta que la del aterrizaje anterior aumenta la racha `k` (`k = min(8, k + 1)`; el primer aterrizaje de la partida deja `k = 1`) y suma `10 × k` puntos. Aterrizar en la misma plataforma que el aterrizaje anterior o en una más baja pone `k = 0` y no suma nada; el siguiente aterrizaje ascendente deja `k = 1`. El HUD muestra `RACHA ×max(1, k)`.
  - AL BORDE: si en el momento de aterrizar la distancia entre los pies y el vacío es de 120 px o menos, los puntos de ese aterrizaje se multiplican por 3 (y se muestra el destello "AL BORDE ×3"). Máximo por aterrizaje: `10 × 8 × 3 = 240`.
  - Impulso aéreo: no suma puntos por sí mismo; sirve para llegar más alto, corregir el aterrizaje (hasta unos 90 px más de altura en el punto más alto) y salvar un salto corto.
  - Portal: cuando `maxH` llega a 40.000 px (4.000 m) el estado pasa a `finished` durante 2,5 s con el texto "¡PORTAL!" y el jugador absorbido hacia arriba por un portal cian; el vacío se detiene. Bonus de portal: 5.000.
  - Fin de partida (todos por `endGame()`): el vacío alcanza al jugador (los pies quedan a `voidH` o por debajo) o el jugador cae más de 40 px por debajo del borde inferior de la pantalla (ambos con 1,0 s de animación `dying` en la que el jugador es engullido antes de terminar), llegar al portal (tras los 2,5 s de "¡PORTAL!") o FIN de la plataforma. Una sola vida: no hay balsa de rescate.
  - Generación: el mundo se genera por delante hasta 800 px por encima del borde superior de la pantalla y se descarta lo que queda por debajo del vacío o a más de 100 px por debajo del borde inferior. Se usa un generador con semilla aleatoria nueva por partida.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Todos los temporizadores (rotura de frágiles, destellos, partículas, `t` del vacío) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyA` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowLeft`, `ArrowRight` y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡PORTAL!" con la puntuación y, tras el fin, Espacio reinicia.
- Nueva entrada `salto` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de izquierda y derecha y un botón `Space` con la etiqueta `IMPULSO`.
- Portada nueva `cover-salto` en `app/globals.css`, diseñada con `/frontend-design`: cielo oscuro con degradado violeta a azul y puntos de estrellas amarillas sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con tres plataformas de neón (verde, cian y magenta), el astronauta-cohete amarillo en pleno salto y, abajo, un disco negro con borde magenta que sube, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_salto_to_games.sql` que inserta `salto` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Mando táctil más allá de la declaración `controls` de la entrada de `GAMES`; ajuste fino en móvil (lo hace después `mobile-porte`).
- Puntuación, altura o racha en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Meteoritos, enemigos, disparos, jetpacks, escudos y otros power-ups.
- Zonas por altitud, varias vidas y balsa de rescate (propuesta A).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "salto",
  title: "SALTO CÓSMICO",
  short: "Salta sin parar y huye del agujero negro que sube.",
  long: "Rebota de balsa en balsa con ← → o A D mientras un agujero negro sube cada vez más rápido. Una sola vida: usa Espacio para un impulso aéreo por salto, encadena aterrizajes en plataformas cada vez más altas para subir la racha hasta ×8, triplica los puntos si aterrizas rozando el vacío y recoge núcleos que lo hacen retroceder. Llega al portal, a 4.000 m, si puedes.",
  cat: "ARCADE",
  cover: "cover-salto",
  color: "yellow",
  src: "/games/salto/index.html",
  controls: {
    pad: [
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
    ],
    buttons: [{ code: "Space", label: "IMPULSO" }],
  },
}
```

```sql
-- supabase/migrations/<version>_add_salto_to_games.sql
insert into public.games (id, title) values ('salto', 'SALTO CÓSMICO');
```

```js
// public/games/salto/game.js — constantes, bucle y modo embebido (resumen; protocolo completo en SPEC 05)
const COL_X = 160,
  COL_W = 480,
  FEET_SCREEN_Y = 260,
  PORTAL_PX = 40000;
const STEP = 1000 / 120; // paso fijo de simulación en ms
const TUNING = {
  gravity: 1500,
  jumpV: 780,
  springV: 1250,
  boostV: 520,
  moveSpeed: 300,
  voidStartH: -200,
  voidBase: 40,
  voidRamp: 0.9,
  coreRetreat: 150,
  edgeDist: 120,
  maxCombo: 8,
};
const vVoid = (t) => TUNING.voidBase + TUNING.voidRamp * t; // px/s
const platWidth = (a) => Math.max(56, 80 - 0.006 * a);
const pFragile = (a) => Math.min(0.37, 0.05 + 0.00008 * a);
const pMoving = (a) => Math.min(0.3, 0.1 + 0.00005 * a);
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // sube el vacío, mueve, aterriza, recoge, puntúa; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla) | 'playing' | 'dying' (1,0 s) | 'finished' (2,5 s) | 'gameover'
// endGame(reason) — 'void' | 'portal' | 'end'; 'portal' suma 5000 al entrar en 'finished'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: 4.000 metros, hasta 571 aterrizajes ascendentes (`floor(40.000 / 70)`, con huecos de 70 px como mínimo) de 240 puntos cada uno (137.040), 19 núcleos (1.900) y bonus de portal (5.000): 147.940, cota inalcanzable en la práctica y muy por debajo de 10.000.000.
- Fin de partida: en `step()`, pies a `voidH` o por debajo, o a más de 40 px bajo la pantalla → `dying` 1,0 s y después `endGame('void')`; `maxH ≥ 40.000` → bonus y, al acabar los 2,5 s de "¡PORTAL!", `endGame('portal')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada (también antes de la primera tecla).
- Teclas: `←`/`A` y `→`/`D` mueven; `Espacio` es el impulso. `P` pausa y `Espacio` reinicia solo abierto directamente y solo tras el fin de la partida.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS). Jugador, núcleos y resortes en amarillo, plataformas estáticas en verde, móviles en cian, frágiles y vacío en magenta, portal en cian.
- El iframe lleva `title="SALTO CÓSMICO"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (gravedad, saltos, impulso, velocidad y rampa del vacío, probabilidades, anchos) viven en el objeto `TUNING` y en las funciones de curva al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/salto/` desde la plantilla de `/add-game`. Implementar la columna con paneles laterales y HUD, la cámara que solo sube, el jugador con movimiento horizontal, envoltura e impulso, la física en pasos fijos de 1/120 s con aterrizaje por barrido, la generación de plataformas con anchos y huecos por altura, y la puntuación por metro. Verificación: `/games/salto/index.html` espera quieto con "PULSA ← O →", la primera pulsación hace saltar, un salto normal mide unos 203 px y dura 1,04 s, el jugador envuelve por los bordes de la columna, `Espacio` en el aire da un impulso una sola vez por salto y el SCORE sube con los metros. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir el vacío ascendente con su dibujo, los tipos FRÁGIL, MÓVIL y RESORTE, los núcleos que lo hacen retroceder, la racha con AL BORDE, el portal con su bonus y los tres finales con `endGame()`. Verificación: abierto directamente, el vacío entra en pantalla poco después de empezar y sube cada vez más deprisa, un núcleo suma 100 y lo hace retroceder 150 px, aterrizar en una plataforma más alta sube la racha (`10 × k`), aterrizar en la misma o en una más baja la pone a 0, aterrizar a 120 px o menos del vacío triplica los puntos, ser alcanzado muestra "GAME OVER" tras 1,0 s y Espacio reinicia desde SCORE 0, y llegar a 4.000 m (se puede comprobar bajando temporalmente `PORTAL_PX` en local) muestra "¡PORTAL!" con el bonus.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` (como reinicio) no hacen nada y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con `ArrowLeft`, `ArrowRight` y `Space`. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `salto` (con `controls` y el botón `IMPULSO`) al final de `GAMES` y la portada `cover-salto` en `app/globals.css`. Verificación: `/games` muestra la tarjeta SALTO CÓSMICO con su portada, `/juegos/salto` muestra el detalle con la misma portada y `/juegos/salto/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_salto_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_salto_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `salto`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña SALTO CÓSMICO de `/salon`.
6. Actualizar `CLAUDE.md`: `salto` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de plataformas con gravedad usa pasos fijos de 1/120 s sobre rAF y aterrizaje por barrido. Verificación: las dos secciones nombran `salto`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/salto` y `/juegos/salto/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta SALTO CÓSMICO (ARCADE, yellow, portada `cover-salto`) y el filtro ARCADE la incluye.
- [ ] `cover-salto` se ve igual de bien en la tarjeta y en el detalle (las capas de `background-image` son válidas).

**Juego embebido**

- [ ] Al entrar en `/juegos/salto/jugar`, el jugador espera quieto sobre la base con "PULSA ← O →", el vacío no se mueve y la primera pulsación de `←`, `→`, `A`, `D` o `Espacio` lo hace saltar y arranca el vacío, sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] `←`/`A` y `→`/`D` mueven al jugador a 300 px/s en el aire y al salir por un lado de la columna entra por el otro; sin tecla se queda en su `x`.
- [ ] Un salto normal sube unos 203 px (±3) y dura unos 1,04 s; un resorte sube unos 521 px (±5).
- [ ] `Espacio` en el aire sube la velocidad vertical a 520 px/s si era menor, se puede usar una sola vez por salto, se recarga al aterrizar (el indicador `IMPULSO` pasa de `○` a `●`) y no hace nada en el suelo.
- [ ] Subir atravesando una plataforma no la hace rebotar ni bloquea; solo se rebota al caer sobre su cara superior, también a la velocidad máxima de caída (sin atravesarla).
- [ ] La cámara sube con el jugador y no baja nunca; el jugador queda a `y ≈ 260` cuando asciende.
- [ ] El vacío sube a `40 + 0,9 × t` px/s (unos 40 px/s al empezar y unos 130 px/s a los 100 s), devora las plataformas que deja por debajo y siempre se ven al menos 60 px de él cuando ya ha entrado en pantalla.
- [ ] El SCORE suma 1 punto por metro nuevo y el HUD muestra la ALTURA y `VACÍO −n M`, que parpadea por debajo de 12 m.
- [ ] Una plataforma FRÁGIL da un rebote y se rompe; nunca aparecen dos frágiles seguidas. Las MÓVILES oscilan ±70 px sin salir de la columna.
- [ ] Un núcleo recogido suma 100, suma 1 al contador y hace retroceder el vacío 150 px; los 19 núcleos están a 200, 400, … 3.800 m.
- [ ] Aterrizar en una plataforma más alta que la anterior sube la racha hasta ×8 y suma `10 × k`; aterrizar en la misma plataforma o en una más baja pone la racha a 0 y no suma.
- [ ] Aterrizar con el vacío a 120 px o menos de los pies triplica los puntos del aterrizaje y muestra "AL BORDE ×3".
- [ ] Ser alcanzado por el vacío o caer más de 40 px bajo la pantalla termina la partida tras 1,0 s con el jugador engullido; no hay balsa ni segunda vida.
- [ ] La distancia vertical entre plataformas consecutivas está entre 70 y 150 px (por debajo de los 203 px de salto) y el ancho baja de 80 a 56 px entre la base y los 4.000 m.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] PAUSA congela al jugador, el vacío, las plataformas móviles y todos los temporizadores, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos de posición, con la misma racha y con el vacío en la misma altura.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego (el `Espacio` del impulso sí actúa durante la partida).
- [ ] Al ser alcanzado por el vacío aparece, tras 1,0 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al llegar a 4.000 m se muestra "¡PORTAL!" 2,5 s con el vacío detenido y el modal trae la puntuación del HUD con el bonus de 5.000 incluido.
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja al jugador quieto sobre la base con "PULSA ← O →", SCORE 0, RACHA ×1, impulso disponible, 0 núcleos y el vacío en `voidH = −200`.

**Leaderboard**

- [ ] `games` contiene la fila `salto` / `SALTO CÓSMICO` y `list_migrations` muestra `add_salto_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'salto'` y la puntuación del HUD.
- [ ] La pestaña SALTO CÓSMICO de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/salto/jugar` ni en `/salon`.
- [ ] Abrir `/games/salto/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡PORTAL!" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) con el vacío animado, las plataformas móviles y las estrellas del fondo en paralaje.
- [ ] Una partida típica dura entre 1 y 4 minutos; el vacío acaba alcanzando al jugador aunque no cometa errores (su velocidad no tiene tope).
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `salto` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta B (vacío) como alternativa a la A (ascenso), por decisión del agente. Es más tensa y rejugable, pero depende de una curva de velocidad del vacío difícil de afinar y exige entender tres reglas (vacío, racha, impulso). Se recomienda la A.
- **Sí:** id `salto` y título `SALTO CÓSMICO`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/salto/` ni el id en `GAMES`.
- **Sí:** ARCADE y yellow, tal como los fija la sugerencia. Amarillo es hoy el único color sin ningún juego real; ARCADE ya tiene tres reales (ARKANOID, SNAKE y FROGGER) y este sería el cuarto, limitación asumida de la sugerencia.
- **Sí:** partida finita porque el vacío no tiene tope de velocidad, y portal a 4.000 m como cota de puntuación, por decisión del agente. La sugerencia dice "infinito", pero el spec exige partida finita; a `0,9 px/s²` de rampa, el vacío supera la velocidad media de ascenso (unos 140 px/s) hacia los 110 s y alcanza a cualquier jugador que no se apoye en núcleos, de modo que el portal es solo para los mejores.
- **Sí:** una sola vida y sin balsa de rescate, por decisión del agente. La presión del vacío ya hace de red de seguridad blanda (se puede caer a una plataforma más baja si el vacío no la ha devorado), y morir es siempre claro.
- **Sí:** racha de aterrizajes ascendentes (hasta ×8) y multiplicador ×3 AL BORDE como núcleo de la puntuación, por decisión del agente. Premian subir deprisa y asumir riesgo cerca del vacío, y la diferencia entre jugadores en el Salón es amplia.
- **Sí:** impulso aéreo con Espacio, uno por salto, por decisión del agente. Da al jugador una decisión activa además de moverse, con un máximo de unos 90 px extra, y tiene botón propio en el mando táctil.
- **Sí:** los núcleos hacen retroceder el vacío 150 px, por decisión del agente. Son el incentivo para desviarse de la ruta más corta y alargan las partidas buenas.
- **Sí:** columna de juego de 480 px con HUD en paneles laterales de 160 px, por decisión del agente. El HUD no tapa nada y una columna estrecha acerca el estilo vertical clásico dentro de un lienzo 4:3.
- **Sí:** pasos fijos de 1/120 s y aterrizaje por barrido, por decisión del agente. A la velocidad de caída máxima (1.000 px/s) cada paso mueve 8,3 px, menos que el grosor de plataforma de 14 px, y el barrido evita atravesarlas aunque el paso cambie.
- **Sí:** el jugador espera a la primera tecla y el vacío no sube hasta entonces, por decisión del agente. Evita perder antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** en modo embebido se desactivan `P`, el reinicio con `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. La animación de "¡PORTAL!" sí se dibuja, porque forma parte de la partida.
- **No:** sonido, skins, meteoritos, zonas ni varias vidas, por decisión del agente. Son la identidad de la propuesta A.
- **No:** usar assets de `references/`, por decisión del agente. Personaje, plataformas y vacío son formas de canvas con brillo neón, sin riesgo de licencia.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                  | Mitigación                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                              | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el jugador espera a la primera tecla. Hay un criterio.                 |
| `av:gameover` se envía dos veces en la misma partida.                                   | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                             |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.      | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                 |
| El vacío o los temporizadores siguen corriendo durante la pausa.                        | `t` y todos los temporizadores avanzan solo dentro de `step()`, que no se ejecuta en pausa; hay un criterio.                                          |
| El jugador atraviesa una plataforma en una caída rápida.                                | Aterrizaje por barrido entre la posición anterior y la nueva de los pies, `vy` mínimo −1.000 y paso fijo de 1/120 s (8,3 px).                         |
| Una plataforma queda fuera de alcance y la partida es injusta.                          | Hueco máximo de 150 px frente a 203 px de salto; distancia horizontal máxima de 300 px entre consecutivas (alcance de 312 px); sin frágiles seguidas. |
| El vacío sube demasiado rápido al principio o demasiado despacio y la partida no acaba. | La curva `40 + 0,9 × t` sin tope y todas las cifras en `TUNING`; un criterio fija la duración típica (1–4 min) y que el vacío alcanza siempre.        |
| La racha se explota rebotando entre dos plataformas casi a la misma altura.             | Solo puntúa un aterrizaje al menos 1 px más alto que el anterior en una plataforma distinta; el vacío sube sin parar y limita cualquier granja.       |
| El multiplicador AL BORDE empuja a esperar al vacío a propósito y es injusto.           | Máximo ×3 solo en el aterrizaje; la racha ya exige subir, y el vacío acelera, así que esperar cuesta más de lo que da.                                |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.   | El paso 5 aplica la migración antes de verificar el guardado.                                                                                         |
| La puntuación supera 10.000.000.                                                        | Máximo teórico de 147.940; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                          |
| El dibujo del vacío (ondas y partículas con `shadowBlur`) baja los FPS.                 | El borde ondulado con trazo simple sin brillo por frame; el brillo prerenderizado en un canvas fuera de pantalla y pocas partículas (máx. 40).        |
| A 375px de ancho el HUD de los paneles laterales (160 px) queda muy pequeño.            | Valores a 16–18 px y etiquetas a 10 px; hay un criterio a 375px.                                                                                      |
| Se confunde con AUTOPISTA NEÓN o FROGGER por ser un ARCADE de esquivar.                 | Vista lateral, gravedad y control solo horizontal; la portada y los textos lo dejan claro.                                                            |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Meteoritos, disparos, jetpacks, escudos y otros power-ups.
- Zonas por altitud, varias vidas y balsa de rescate (propuesta A).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
