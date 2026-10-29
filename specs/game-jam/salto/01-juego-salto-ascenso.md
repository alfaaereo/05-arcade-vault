# SPEC JAM — Juego real SALTO CÓSMICO embebido y con leaderboard (propuesta A: ascenso)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-29
> **Tema:** SALTO CÓSMICO
> **Propuesta:** A — ascenso por 10 zonas hasta la cima a 5.000 m, con 3 vidas, plataformas estáticas, móviles, frágiles y con resorte, meteoritos y estrellas. Alternativa a `02-juego-salto-vacio.md`: implementar solo una.
> **Objetivo:** Crear el juego SALTO CÓSMICO y hacerlo jugable en `/juegos/salto/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y varios ARCADE de tablero, casillas o paleta (ARKANOID, SNAKE, FROGGER). Ninguno es un juego de plataformas con gravedad: aquí el jugador no controla la altura del salto, solo la posición horizontal, y la dificultad sale de dónde y cómo aterriza. Tampoco hay todavía ningún juego amarillo entre los reales: SALTO CÓSMICO, sugerido por el game-planner (`salto`, ARCADE · yellow, 2026-10-21), estrena el color.

Encaja con el tema de la jam, SALTO CÓSMICO, en las tres capas: la mecánica es saltar sin parar de plataforma en plataforma, la ambientación es una columna de asteroides y balsas de neón flotando sobre un cielo de estrellas, y los textos hablan de zonas, estrellas, meteoritos y cima. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de ascenso: partida con principio, zonas y final. Subes por 10 zonas de 500 m cuya dificultad sube por pasos; tienes 3 vidas (una caída o un meteorito cuesta una vida) y llegar a la cima a 5.000 m es la victoria. La puntuación premia la altura (cada metro vale más cuanto más alta la zona), las estrellas y terminar con vidas de sobra. Gana frente a la propuesta B (`02-juego-salto-vacio.md`) en legibilidad (reglas conocidas, errores perdonables, objetivo claro) y en menor riesgo de equilibrado; pierde en tensión por segundo y en novedad: B tiene un agujero negro que sube sin parar, una sola vida e impulso aéreo.

En cuanto `salto` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/salto/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos y formas de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>SALTO CÓSMICO — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600 en vista lateral. La columna de juego ocupa `x = 160…640` (480 px) y cubre todo el alto. A cada lado hay un panel de 160 px con el HUD y decorado neón (estrellas en paralaje, que solo se redibujan desde un canvas fuera de pantalla). No hay HUD sobre la columna.
  - Mundo: la altura `h` crece hacia arriba en px; 1 m = 10 px. La base (suelo de salida) es `h = 0`. La cámara guarda `camH`, la altura del borde inferior de la pantalla (empieza en −60, así que la base se ve en `y = 540`). Una altura `h` se dibuja en `y = 600 − (h − camH)`. La cámara solo sube: cuando los pies del jugador quedan por encima de `y = 260`, `camH` sube lo necesario para dejarlos en `y = 260`. Nunca baja.
  - Jugador: astronauta-cohete amarillo con visera cian de 28 px de ancho de hitbox y 36 px de alto, que se dibuja con `x` central. Solo se controla en horizontal.
  - HUD (fuente "Press Start 2P"): panel izquierdo con `SCORE` (cian), `ALTURA n M` (tinta) y `ZONA n/10` (amarillo); panel derecho con 3 iconos de vida (magenta, uno por vida), `ESTRELLAS n` (amarillo) y una barra vertical de progreso hacia la cima de 200 px con una marca en cada zona.
  - Estado inicial: `ready`, ZONA 1, SCORE 0, 3 vidas, 0 estrellas, jugador de pie en el centro de la base (`x = 400`), base de 480×16 px que ocupa toda la columna en `h = 0`, plataformas ya generadas hasta 800 px por encima de la pantalla y el texto "PULSA ← O →". No se mueve nada hasta la primera pulsación de `←`, `→`, `A` o `D`; al pulsar, el jugador salta.
  - Controles: `←`/`A` y `→`/`D` mueven al jugador a 300 px/s (velocidad directa, sin inercia; sin tecla se queda en su `x`). Si sale por un lado de la columna entra por el otro (envuelve; el sprite se dibuja en ambos bordes mientras cruza). `Espacio` no hace nada en esta propuesta.
  - Física, en pasos fijos: gravedad `g = 1.500` px/s², velocidad vertical `vy` en px/s positiva hacia arriba, mínimo −1.000. Aterrizar en una plataforma da `vy = 780` (salto de 203 px de alto y 1,04 s de duración). Un resorte da `vy = 1.250` (521 px, 1,67 s). El jugador no puede saltar por sí mismo: rebota solo al aterrizar.
  - Aterrizaje: solo si `vy < 0`, si los pies pasan de estar por encima de la cara superior de una plataforma a estar por debajo en ese paso (comprobación por barrido, no por posición final) y si el centro del jugador está dentro del ancho de la plataforma ±14 px. Las plataformas no bloquean por los lados ni por abajo: se atraviesan subiendo.
  - Altura y puntuación: `maxH` es la altura máxima alcanzada por los pies sobre la base; metros = `floor(maxH / 10)`. Cada metro nuevo suma `zona` puntos, con `zona = min(10, 1 + floor(m / 500))` y `m` el metro que se acaba de alcanzar (los metros 1–499 valen 1; 500–999, 2; … 4.500–5.000, 10). Al pasar de zona el HUD lo muestra y aparece un destello "ZONA n" 1,5 s.
  - Plataformas (todas de 14 px de grosor): ancho `88 − 3 × (zona − 1)` (88 en la zona 1, 61 en la 10). Cada plataforma nueva se genera sobre la anterior a una distancia vertical aleatoria uniforme entre 70 y `110 + 6 × zona` px (116 en la zona 1, 170 en la 10, siempre por debajo de los 203 px de salto) y con una `x` aleatoria que nunca queda a más de 300 px en horizontal de la anterior. Tipos:
    - ESTÁTICA (verde `C.green`): fija.
    - MÓVIL (cian `C.cyan`, desde la zona 3, probabilidad `0,15 + 0,02 × (zona − 3)`): se mueve horizontalmente ±70 px alrededor de su `x` a `70 + 10 × zona` px/s, sin salir de la columna.
    - FRÁGIL (magenta `C.magenta` con grietas, desde la zona 2, probabilidad `0,20 + 0,02 × (zona − 2)`): da el rebote normal y a continuación se rompe (cae y desaparece en 0,4 s). Nunca hay dos frágiles seguidas; la primera tras una frágil es siempre ESTÁTICA o MÓVIL.
    - RESORTE (estática con un resorte amarillo de 24×12 px encima, probabilidad 0,07 en cualquier zona): aterrizar sobre el resorte (centro del jugador a ±12 px del centro de la plataforma) da `vy = 1.250`; si no, rebote normal.
    - El resto son ESTÁTICAS. El tipo se decide con una única tirada en este orden: frágil, móvil, resorte, estática.
  - Estrellas: una estrella amarilla (radio 12) cada 100 m, a 40 px sobre la plataforma más cercana a esa altura, desde los 100 m hasta los 4.900 m (49 estrellas). Se recoge al tocarla y suma `50 × zona` puntos (la zona de la altura de la estrella) y 1 al contador del HUD. Si se queda por debajo del borde inferior de la pantalla se pierde.
  - Meteoritos (desde la zona 2): uno cada `max(350, 700 − 40 × zona)` px de ascenso (620 en la zona 2, 350 desde la 9), a media altura entre dos plataformas consecutivas y a más de 60 px de cada una. Es un círculo naranja `C.orange` de radio 14 con estela que cruza la columna en horizontal a `90 + 15 × zona` px/s y rebota en los bordes de la columna. Al tocar al jugador (círculo de radio 14 del jugador contra el del meteorito) y sin invulnerabilidad, el jugador pierde 1 vida, el meteorito explota con partículas y el jugador es invulnerable 1,5 s (parpadea y no recibe más daño). Los meteoritos no atacan a un jugador invulnerable y desaparecen al salir por debajo de la pantalla.
  - Caída: si los pies quedan a más de 30 px por debajo del borde inferior de la pantalla, el jugador pierde 1 vida. Si le quedan vidas, aparece una BALSA (plataforma ESTÁTICA de 120 px de ancho) en `y = 470` bajo su posición horizontal (limitada a la columna), el jugador queda de pie sobre ella con `vy = 780` y es invulnerable 1,5 s. Las plataformas por encima de la cámara siguen donde estaban; las de debajo se descartan.
  - Cima: cuando `maxH` llega a 50.000 px (5.000 m) el estado pasa a `finished` durante 2,5 s con el texto "¡CIMA!" y el jugador subiendo hacia un portal. Bonus de cima: 5.000 más 2.000 por vida restante.
  - Fin de partida (todos por `endGame()`): quedarse sin vidas (por caída o por meteorito, con 1,0 s de animación `dying` antes de terminar), llegar a la cima (tras los 2,5 s de "¡CIMA!") o FIN de la plataforma.
  - Generación: el mundo se genera por delante hasta 800 px por encima del borde superior de la pantalla y se descarta lo que queda a más de 100 px por debajo del borde inferior. Se usa un generador con semilla aleatoria nueva por partida.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Todos los temporizadores (invulnerabilidad, rotura de frágiles, destellos, partículas) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyA` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowLeft` y `ArrowRight`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡CIMA!" con la puntuación y Espacio reinicia.
- Nueva entrada `salto` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de izquierda y derecha y sin botones.
- Portada nueva `cover-salto` en `app/globals.css`, diseñada con `/frontend-design`: cielo oscuro con degradado violeta a azul y puntos de estrellas amarillas sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con tres plataformas de neón (verde, cian y magenta) y el astronauta-cohete amarillo en pleno salto con su estela, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_salto_to_games.sql` que inserta `salto` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Mando táctil más allá de la declaración `controls` de la entrada de `GAMES`; ajuste fino en móvil (lo hace después `mobile-porte`).
- Puntuación, altura o vidas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Disparos, enemigos que se pisan, jetpacks, escudos y otros power-ups.
- Agujero negro ascendente, impulso aéreo y una sola vida (propuesta B).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "salto",
  title: "SALTO CÓSMICO",
  short: "Salta de plataforma en plataforma hasta la cima del cosmos.",
  long: "Rebota sin parar de balsa en balsa con ← → o A D: tú solo eliges dónde caer. Esquiva meteoritos, evita las plataformas frágiles que se rompen y las móviles que se escapan, usa los resortes para dar saltos enormes y recoge estrellas. Sube por 10 zonas hasta la cima, a 5.000 m, con tres vidas: cuanto más alta la zona, más vale cada metro.",
  cat: "ARCADE",
  cover: "cover-salto",
  color: "yellow",
  src: "/games/salto/index.html",
  controls: {
    pad: [
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
    ],
    buttons: [],
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
  SUMMIT_PX = 50000;
const STEP = 1000 / 120; // paso fijo de simulación en ms
const TUNING = {
  gravity: 1500,
  jumpV: 780,
  springV: 1250,
  moveSpeed: 300,
  invulnS: 1.5,
};
const zoneOf = (m) => Math.min(10, 1 + Math.floor(m / 500));
const platWidth = (z) => 88 - 3 * (z - 1);
const gapMax = (z) => 110 + 6 * z; // el mínimo es 70
const meteorEveryPx = (z) => Math.max(350, 700 - 40 * z);
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // mueve, aterriza, recoge, puntúa; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla) | 'playing' | 'dying' (1,0 s) | 'finished' (2,5 s) | 'gameover'
// endGame(reason) — 'lives' | 'summit' | 'end'; 'summit' suma 5000 + 2000 × vidas al entrar en 'finished'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: metros `499 × 1 + 500 × (2 + … + 9) + 501 × 10 = 27.509`, estrellas `4 × 50 + 5 × 50 × (2 + … + 10) = 13.700` y bonus de cima con 3 vidas `5.000 + 6.000 = 11.000`: 52.209, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, vidas 0 → `dying` 1,0 s y después `endGame('lives')`; `maxH ≥ 50.000` → bonus y, al acabar los 2,5 s de "¡CIMA!", `endGame('summit')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada (también antes de la primera tecla).
- Teclas: `←`/`A` y `→`/`D` mueven. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS), con un añadido: `orange: "#ff7700"` (meteoritos). Jugador, estrellas y resortes en amarillo, plataformas estáticas en verde, móviles en cian, frágiles en magenta, meteoritos en naranja.
- El iframe lleva `title="SALTO CÓSMICO"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (gravedad, saltos, anchos, huecos, probabilidades, meteoritos) viven en el objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/salto/` desde la plantilla de `/add-game`. Implementar la columna con paneles laterales y HUD, la cámara que solo sube, el jugador con movimiento horizontal y envoltura, la física en pasos fijos de 1/120 s con aterrizaje por barrido, la generación de plataformas ESTÁTICAS con anchos y huecos por zona, y la puntuación por metro con las zonas. Verificación: `/games/salto/index.html` espera quieto con "PULSA ← O →", la primera pulsación hace saltar, un salto normal mide unos 203 px y dura 1,04 s, el jugador envuelve por los bordes de la columna, el SCORE sube con los metros y el HUD pasa a ZONA 2 a los 500 m. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir los tipos MÓVIL, FRÁGIL y RESORTE, las estrellas, los meteoritos, las 3 vidas con la invulnerabilidad, la caída con la balsa, la cima con su bonus y los tres finales con `endGame()`. Verificación: abierto directamente, una frágil se rompe tras el rebote, un resorte da un salto de unos 521 px, una estrella suma `50 × zona`, un meteorito quita una vida y da 1,5 s de invulnerabilidad, caer con vidas deja una balsa y rebota, perder las 3 vidas muestra "GAME OVER" tras 1,0 s y Espacio reinicia desde ZONA 1, y llegar a 5.000 m (se puede comprobar bajando temporalmente `SUMMIT_PX` en local) muestra "¡CIMA!" con el bonus.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con `ArrowLeft` y `ArrowRight`. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `salto` (con `controls`) al final de `GAMES` y la portada `cover-salto` en `app/globals.css`. Verificación: `/games` muestra la tarjeta SALTO CÓSMICO con su portada, `/juegos/salto` muestra el detalle con la misma portada y `/juegos/salto/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_salto_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_salto_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `salto`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña SALTO CÓSMICO de `/salon`.
6. Actualizar `CLAUDE.md`: `salto` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de plataformas con gravedad usa pasos fijos de 1/120 s sobre rAF y aterrizaje por barrido. Verificación: las dos secciones nombran `salto`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/salto` y `/juegos/salto/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta SALTO CÓSMICO (ARCADE, yellow, portada `cover-salto`) y el filtro ARCADE la incluye.
- [ ] `cover-salto` se ve igual de bien en la tarjeta y en el detalle (las capas de `background-image` son válidas).

**Juego embebido**

- [ ] Al entrar en `/juegos/salto/jugar`, el jugador espera quieto sobre la base con "PULSA ← O →" y la primera pulsación de `←`, `→`, `A` o `D` lo hace saltar sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] `←`/`A` y `→`/`D` mueven al jugador a 300 px/s en el aire y al salir por un lado de la columna entra por el otro; sin tecla se queda en su `x`.
- [ ] Un salto normal sube unos 203 px (±3) y dura unos 1,04 s; un resorte sube unos 521 px (±5).
- [ ] Subir atravesando una plataforma no la hace rebotar ni bloquea; solo se rebota al caer sobre su cara superior, también a la velocidad máxima de caída (sin atravesarla).
- [ ] La cámara sube con el jugador y no baja nunca; el jugador queda a `y ≈ 260` cuando asciende.
- [ ] El SCORE suma `zona` puntos por cada metro nuevo; el HUD pasa a ZONA 2 a los 500 m, con destello "ZONA 2", y el metro 500 vale 2.
- [ ] Una plataforma FRÁGIL (desde la zona 2) da un rebote y se rompe; nunca aparecen dos frágiles seguidas.
- [ ] Una plataforma MÓVIL (desde la zona 3) oscila ±70 px sin salir de la columna.
- [ ] Una estrella recogida suma `50 × zona` y 1 en el contador; las 49 estrellas están a 100, 200, … 4.900 m.
- [ ] A partir de la zona 2 aparece un meteorito naranja que cruza la columna; tocarlo quita 1 vida, lo hace explotar y deja 1,5 s de parpadeo sin más daño.
- [ ] Caer por debajo de la pantalla con vidas restantes quita 1 vida, coloca una balsa de 120 px bajo el jugador y lo hace rebotar, con 1,5 s de invulnerabilidad.
- [ ] La distancia vertical entre plataformas consecutivas nunca supera `110 + 6 × zona` px (por debajo de los 203 px de salto) y el ancho baja de 88 a 61 px entre la zona 1 y la 10.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] PAUSA congela al jugador, las plataformas móviles, los meteoritos y todos los temporizadores, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos de posición y con la misma invulnerabilidad que quedaba.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder la última vida aparece, tras 1,0 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al llegar a 5.000 m se muestra "¡CIMA!" 2,5 s y el modal trae la puntuación del HUD con el bonus de 5.000 más 2.000 por vida restante incluido.
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja al jugador quieto sobre la base con "PULSA ← O →", SCORE 0, ZONA 1, 3 vidas, 0 estrellas y sin meteoritos.

**Leaderboard**

- [ ] `games` contiene la fila `salto` / `SALTO CÓSMICO` y `list_migrations` muestra `add_salto_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'salto'` y la puntuación del HUD.
- [ ] La pestaña SALTO CÓSMICO de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/salto/jugar` ni en `/salon`.
- [ ] Abrir `/games/salto/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡CIMA!" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) en la zona 10 con meteorito, plataformas móviles y las estrellas del fondo en paralaje.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `salto` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta A (ascenso) como recomendada frente a la B (vacío), por decisión del agente. Es más legible (reglas conocidas, errores perdonables con vidas, objetivo claro en la cima), tiene menos riesgo de equilibrado que un agujero negro cuya velocidad crece con el tiempo, y las zonas con metros más valiosos separan bien a los jugadores en el Salón. B queda como alternativa si se prefiere una partida más tensa y corta.
- **Sí:** id `salto` y título `SALTO CÓSMICO`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/salto/` ni el id en `GAMES`.
- **Sí:** ARCADE y yellow, tal como los fija la sugerencia. Amarillo es hoy el único color sin ningún juego real; ARCADE ya tiene tres reales (ARKANOID, SNAKE y FROGGER) y este sería el cuarto, limitación asumida de la sugerencia.
- **Sí:** partida finita con cima a 5.000 m y 3 vidas, por decisión del agente. La sugerencia dice "infinito", pero el spec exige partida finita y un techo de puntuación conocido; la dificultad de la zona 10 hace que llegar a la cima sea el reto de los mejores.
- **Sí:** columna de juego de 480 px con HUD en paneles laterales de 160 px, por decisión del agente. El HUD no tapa nada y una columna estrecha acerca el estilo vertical clásico dentro de un lienzo 4:3.
- **Sí:** solo se controla la posición horizontal; el salto es automático al aterrizar, por decisión del agente. Es el rasgo del género y deja los controles en dos teclas, aptas para el mando táctil.
- **Sí:** pasos fijos de 1/120 s y aterrizaje por barrido, por decisión del agente. A la velocidad de caída máxima (1.000 px/s) cada paso mueve 8,3 px, menos que el grosor de plataforma de 14 px, y el barrido evita atravesarlas aunque el paso cambie.
- **Sí:** el jugador espera a la primera tecla, por decisión del agente. Evita caer antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** el metro vale `zona` puntos, las estrellas `50 × zona` y la cima da 5.000 más 2.000 por vida, por decisión del agente. La altura domina la puntuación, y conservar vidas y llegar arriba separa a los mejores.
- **Sí:** una caída cuesta una vida y deja una balsa, por decisión del agente. No se pierde el progreso y el jugador nunca queda atascado sin plataforma bajo los pies.
- **Sí:** distancia vertical máxima entre plataformas de `110 + 6 × zona` (170 como mucho) frente a 203 px de salto, por decisión del agente. Garantiza que cada plataforma es alcanzable aunque la anterior sea frágil o móvil.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. La animación de "¡CIMA!" sí se dibuja, porque forma parte de la partida.
- **No:** sonido, skins, impulso aéreo ni agujero negro, por decisión del agente. Los dos últimos son la identidad de la propuesta B.
- **No:** usar assets de `references/`, por decisión del agente. Personaje, plataformas y meteoritos son formas de canvas con brillo neón, sin riesgo de licencia.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                    |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el jugador espera a la primera tecla. Hay un criterio.         |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                     |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                         |
| Los temporizadores de invulnerabilidad o de rotura siguen corriendo durante la pausa. | Todos avanzan solo dentro de `step()`, que no se ejecuta en pausa.                                                                            |
| El jugador atraviesa una plataforma en una caída rápida.                              | Aterrizaje por barrido entre la posición anterior y la nueva de los pies, `vy` mínimo −1.000 y paso fijo de 1/120 s (8,3 px).                 |
| Una plataforma queda fuera de alcance y la partida es injusta.                        | Hueco máximo `110 + 6 × zona` ≤ 170 frente a 203 px de salto; distancia horizontal máxima de 300 px entre consecutivas (alcance de 312 px).   |
| Un meteorito aparece justo encima del jugador o de una plataforma y no se puede ver.  | Aparece a más de 60 px de las plataformas y por encima de la pantalla, y cruza en horizontal a una velocidad que deja tiempo para esquivarlo. |
| Quedarse sin plataformas tras varias frágiles seguidas.                               | Nunca hay dos frágiles seguidas; la siguiente a una frágil es ESTÁTICA o MÓVIL.                                                               |
| Una balsa de respawn aparece sobre un meteorito o una plataforma y se solapa.         | La balsa es una plataforma más; el jugador es invulnerable 1,5 s y los solapes de plataformas son inocuos.                                    |
| El equilibrado de zonas queda demasiado fácil o difícil.                              | Todas las cifras en un objeto `TUNING`; la cima a 5.000 m es una cota de dificultad, no de duración mínima.                                   |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 5 aplica la migración antes de verificar el guardado.                                                                                 |
| La puntuación supera 10.000.000.                                                      | Máximo teórico de 52.209; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                   |
| El paralaje de estrellas con `shadowBlur` baja los FPS en equipos modestos.           | El fondo se prerenderiza en un canvas fuera de pantalla; el brillo solo en jugador, estrellas recogibles y meteoritos visibles.               |
| A 375px de ancho el HUD de los paneles laterales (160 px) queda muy pequeño.          | Valores a 16–18 px y etiquetas a 10 px; hay un criterio a 375px.                                                                              |
| Se confunde con AUTOPISTA NEÓN o FROGGER por ser un ARCADE de esquivar.               | Vista lateral, gravedad y control solo horizontal; la portada y los textos lo dejan claro.                                                    |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Disparos, jetpacks, escudos y otros power-ups.
- Agujero negro ascendente, impulso aéreo y una sola vida (propuesta B).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
