# SPEC JAM — Juego real DEFENSA ORBITAL embebido y con leaderboard (propuesta B: cadena)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-28
> **Tema:** DEFENSA ORBITAL
> **Propuesta:** B — 8 sectores cronometrados de 40 s sin límite de munición (solo cargas que se recuperan), ciudades con 2 puntos de blindaje, racimos y misiles esquivadores, y puntuación por reacciones en cadena (cada eslabón duplica el valor). Alternativa a `01-juego-defensa-oleadas.md`: implementar solo una.
> **Objetivo:** Crear el juego DEFENSA ORBITAL y hacerlo jugable en `/juegos/defensa/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene un solo SHOOTER (ASTEROIDS, nave con rotación y empuje) y el resto son ARCADE o PUZZLE. DEFENSA ORBITAL, sugerida por el game-planner (`defensa`, SHOOTER · yellow, 2026-10-21), es un shooter de puntería pura: el jugador no pilota nada, apunta con una mira y adelanta el disparo a un enemigo que cae para proteger seis ciudades. Es el segundo SHOOTER y el primer juego amarillo del catálogo, y el primero que se juega sobre todo con el ratón (con alternativa de teclado).

Encaja con el tema de la jam, DEFENSA ORBITAL, en las tres capas: la mecánica es interceptar misiles que caen sobre ciudades, la ambientación es una órbita baja de fondo oscuro con estelas magenta, ciudades cian y explosiones amarillas, y los textos hablan de sectores, cargas y blindaje. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de cadena: no hay reserva de munición sino un cargador de 6 cargas que se rellena solo, así que el jugador dispara casi sin parar y el reto es hacer que cada explosión valga más. Un enemigo destruido deja una explosión secundaria que puede destruir a otro, y cada eslabón de la cadena duplica los puntos. Las ciudades aguantan un impacto (2 de blindaje) y se reparan entre sectores. Gana frente a la propuesta A (`01-juego-defensa-oleadas.md`) en espectáculo, en rejugabilidad (un techo de habilidad muy alto: buscar las cadenas) y en ritmo continuo sin pantallas de recuento largas; pierde en legibilidad (la puntuación depende de una mecánica que hay que descubrir) y en riesgo de equilibrado (esquivadores y cadenas son más difíciles de afinar).

En cuanto `defensa` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/defensa/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>DEFENSA ORBITAL — Arcade Vault</title>` y `cursor: none` en el canvas (la mira se dibuja en el juego).
- Mecánica en `game.js`:
  - Lienzo 800×600. Franja de HUD de 36 px arriba (`y = 0…36`), cielo jugable de `y = 36…548` y franja de suelo de 52 px (`y = 548…600`). Fondo: degradado oscuro con unas 60 estrellas fijas y la curva del horizonte, pintado una vez en un canvas fuera de pantalla.
  - Seis ciudades (siluetas cian de 44×20 px sobre el suelo) con centros en `x = 130, 215, 300, 500, 585, 670`. Tres silos de lanzamiento (trapecios amarillos de 40×24 px) con centros en `x = 40, 400, 760`. Solo las ciudades son objetivo de los misiles; los silos son indestructibles y solo sirven de origen de los disparos.
  - Blindaje: cada ciudad tiene 2 puntos. Con 2 se dibuja cian; con 1, amarilla y con grietas; con 0, ruinas grises (ya no es objetivo).
  - HUD (fuente "Press Start 2P", 14 px): `SCORE` (cian) a la izquierda, `ÓRBITA n/8` (amarillo) en el centro con el tiempo restante del sector (`m:ss`) debajo en tinta, y a la derecha las 6 `CARGAS` como cuadraditos verdes (los vacíos en gris, el siguiente en recarga parpadea).
  - Estado inicial: sector 1, SCORE 0, 6 ciudades con 2 de blindaje, 6 cargas, mira en `(400, 300)` y el texto "HAZ CLIC O PULSA ESPACIO". No pasa nada hasta el primer clic o tecla del juego; ese primer clic o tecla solo inicia y no dispara.
  - Mira: con el ratón sigue al puntero (coordenadas escaladas con `getBoundingClientRect`: `(e.clientX - rect.left) * canvas.width / rect.width`). Con teclado, `←` `→` `↑` `↓` o `A` `D` `W` `S` la mueven a 420 px/s. Siempre queda dentro de `x = 8…792`, `y = 60…530`. La última entrada (ratón o teclado) manda.
  - Disparo: clic izquierdo o `Espacio` lanza un interceptor desde el silo más cercano en horizontal a la mira y gasta 1 carga. Enfriamiento de 0,10 s entre disparos. Las cargas máximas son 6 y se recupera 1 cada 0,9 s mientras haya menos de 6 (el temporizador de recarga solo corre con el cargador incompleto). Sin cargas aparece "SIN CARGA" 0,6 s y el cargador parpadea.
  - Interceptor: viaja en línea recta desde la boca del silo (`y = 524`) hasta el punto de la mira en el momento del disparo, a 600 px/s, con estela amarilla, y estalla al llegar. Explosión primaria (profundidad 0): radio máximo 42 px, crece en 0,30 s, se mantiene 0,15 s y se contrae en 0,35 s (0,80 s en total).
  - Reacción en cadena: cuando una explosión de profundidad `d` destruye un enemigo, suma `20 × 2^d` puntos (20, 40, 80, 160 o 320) y, si `d < 4`, deja en el centro del enemigo una explosión secundaria de profundidad `d + 1` con radio máximo 30 px, que crece en 0,15 s, se mantiene 0,10 s y se contrae en 0,25 s (0,50 s en total). Las explosiones de profundidad 4 puntúan 320 y no generan más. Sobre el enemigo destruido flota el texto "+80" (con el valor) y, desde profundidad 2, "×4 CADENA" (`2^d`) durante 0,8 s. Una explosión mata a cada enemigo como mucho una vez y las explosiones no dañan ciudades.
  - Enemigos (el sector `s` usa la velocidad base `vE = 42 + 5 × (s − 1)` px/s, de 42 a 77; todos aparecen en `y = 36` con `x` al azar en `20…780` y bajan en línea recta hacia una ciudad con blindaje > 0 elegida al azar):
    - MISIL (magenta): 20 puntos base según la fórmula de cadena.
    - RACIMO (naranja, desde el sector 3; cada 6.º lanzamiento): al llegar a una altura al azar entre `y = 160` y `y = 240` se parte en 4 MISILES que siguen en línea recta hacia 4 ciudades distintas con blindaje > 0 (si hay menos de 4, se repiten). El racimo puntúa como un misil y cada hijo también.
    - ESQUIVADOR (verde, desde el sector 4; cada 5.º lanzamiento que no sea racimo): baja como un misil, pero si hay una explosión con radio actual mayor que 0 a menos de 70 px de su centro, se desvía en horizontal alejándose de ella a 110 px/s mientras dure esa proximidad (nunca sale de `x = 8…792`); después retoma el rumbo directo hacia su ciudad. Puntúa como un misil. Las explosiones secundarias que nacen encima de él lo alcanzan igualmente, porque el desvío no es instantáneo (110 px/s es menos que el crecimiento del radio).
  - Lanzamientos: el sector dura 40 s de lanzamientos. Intervalo `max(0,5 , 1,5 − 0,12 × (s − 1))` s (1,50 en el sector 1; 0,66 en el 8), es decir, 26, 28, 31, 35, 39, 44, 51 y 60 lanzamientos por sector (314 en total). A partir del sector 6 cada lanzamiento sale en grupo de 2 enemigos (el segundo con `x` al menos 120 px del primero) uno de cada 3 lanzamientos; el segundo no cuenta como lanzamiento de calendario ni cambia el intervalo.
  - Impacto: un enemigo que llega al suelo quita 1 punto de blindaje a su ciudad, con una explosión de partículas naranja; un enemigo que impacta no puntúa ni deja cadena.
  - Fin de sector: pasados los 40 s no hay más lanzamientos y el sector acaba cuando no quedan enemigos ni explosiones activas (como mucho unos 13 s después, el tiempo de caída más lento). Entonces hay un recuento de 2 s: "ÓRBITA n LIMPIA", el bonus `150 × n × (ciudades con blindaje > 0)` que se suma de golpe al empezar el recuento y una reparación: la ciudad con menos blindaje (y, a igualdad, la de menor índice) sube 1 punto, incluidas las ruinas, que reviven con 1. Tras el recuento hay una cuenta de 1,5 s "ÓRBITA n+1" y las cargas se rellenan.
  - Final de la partida (todos por `endGame()`): (1) las 6 ciudades en ruinas; tras 1,5 s de animación, `endGame('cities')`; (2) limpiar el sector 8: recuento y 3 s de "¡ÓRBITA ASEGURADA!", con un bonus final de 1.500 por punto de blindaje restante (como mucho 12 puntos) que se suma al empezar, y `endGame('win')`; (3) FIN de la plataforma (`av:end`): `endGame('end')` en cualquier estado salvo `gameover`.
  - Estados: `'ready'` (espera la primera entrada) · `'intro'` · `'sector'` · `'clearing'` (sin más lanzamientos, esperando a limpiar) · `'tally'` · `'dying'` · `'victory'` · `'gameover'`.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Todos los temporizadores (recarga, enfriamiento, explosiones, lanzamientos, textos flotantes, recuento) avanzan solo dentro de esos pasos.
- Rendimiento: el fondo estático se pinta una vez en un canvas fuera de pantalla; `shadowBlur` solo en explosiones, estelas y mira (nunca en las estrellas ni en las siluetas del suelo); las cadenas largas (hasta unas 15 explosiones a la vez) usan relleno semitransparente sin `shadowBlur` para las secundarias.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`; `contextmenu` también se cancela dentro del canvas.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con las cuatro flechas y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas. Durante la pausa los clics no disparan.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡ÓRBITA ASEGURADA!" con la puntuación y Espacio reinicia.
- Nueva entrada `defensa` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de 4 flechas para mover la mira y un botón `DISPARO` (`Space`).
- Portada nueva `cover-defensa` en `app/globals.css`, diseñada con `/frontend-design`: cielo oscuro con rejilla tenue y un horizonte curvo en amarillo sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con la silueta de tres ciudades cian, dos estelas magenta y una explosión amarilla grande con dos explosiones menores encadenadas a su alrededor, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_defensa_to_games.sql` que inserta `defensa` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Puntuación, sector o cargas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Mejoras entre sectores, tienda y armas especiales.
- Munición limitada por silo, oleadas con recuento por munición sobrante, carros multicabeza y drones bombarderos (propuesta A).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "defensa",
  title: "DEFENSA ORBITAL",
  short: "Dispara, encadena explosiones y salva tus seis ciudades.",
  long: "Seis ciudades blindadas bajo una lluvia de misiles. Apunta con el ratón (o con las flechas y WASD) y dispara con clic o Espacio: tienes seis cargas que se recuperan solas. Cada misil que destruyes deja una explosión menor que puede llevarse al siguiente, y cada eslabón de la cadena duplica los puntos, hasta ×16. Aguanta 8 sectores de 40 segundos con racimos y misiles esquivadores; entre sectores se repara una ciudad.",
  cat: "SHOOTER",
  cover: "cover-defensa",
  color: "yellow",
  src: "/games/defensa/index.html",
  controls: {
    pad: [
      { code: "ArrowUp", dir: "up" },
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
      { code: "ArrowDown", dir: "down" },
    ],
    buttons: [{ code: "Space", label: "DISPARO" }],
  },
}
```

```sql
-- supabase/migrations/<version>_add_defensa_to_games.sql
insert into public.games (id, title) values ('defensa', 'DEFENSA ORBITAL');
```

```js
// public/games/defensa/game.js — constantes, bucle y modo embebido (resumen; protocolo completo en SPEC 05)
const GROUND_Y = 548,
  SKY_TOP = 36,
  SILO_X = [40, 400, 760],
  CITY_X = [130, 215, 300, 500, 585, 670];
const STEP = 1000 / 120; // paso fijo de simulación en ms
const MAX_SECTOR = 8,
  SECTOR_S = 40,
  MAX_CHARGES = 6,
  RECHARGE_S = 0.9,
  MAX_DEPTH = 4;
const enemySpeed = () => 42 + 5 * (sector - 1); // px/s
const spawnGap = () => Math.max(0.5, 1.5 - 0.12 * (sector - 1)); // s
const killPoints = (depth) => 20 * 2 ** depth; // 20, 40, 80, 160, 320
const BLAST = [
  { r: 42, grow: 0.3, hold: 0.15, shrink: 0.35 }, // primaria
  { r: 30, grow: 0.15, hold: 0.1, shrink: 0.25 }, // secundarias
];
const INTERCEPTOR_SPEED = 600; // px/s
function toCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height,
  };
}
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // mira, recarga, interceptores, enemigos, explosiones en cadena, impactos; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// endGame(reason) — 'cities' | 'win' | 'end'; el bonus de victoria se suma al entrar en 'victory'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: 314 lanzamientos más 41 racimos de 4 hijos (164 hijos) son 478 destrucciones, todas a 320 puntos (152.960, cota imposible porque cada cadena necesita un primer eslabón de solo 20), más el bonus de sector `150 × (1 + … + 8) × 6` (32.400) y el bonus final de 12 puntos de blindaje (18.000): 203.360, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, la última ciudad en ruinas → `'dying'` y, a los 1,5 s, `endGame('cities')`; recuento del sector 8 → `'victory'` y, a los 3 s, `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada.
- Teclas: ratón (movimiento y clic izquierdo) o `←` `→` `↑` `↓` / `A` `D` `W` `S` para la mira; clic o `Espacio` disparan. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS), con un añadido: `orange: "#ff7700"` (racimo y partículas de impacto). Interceptores, explosiones y mira en amarillo, ciudades sanas en cian, misiles en magenta, esquivadores y cargas en verde.
- El iframe lleva `title="DEFENSA ORBITAL"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (velocidades, intervalos, radios, recarga, desvío del esquivador) viven en un objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador, `public/games/arkanoid/game.js` como referencia del ratón escalado con `getBoundingClientRect`, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/defensa/` desde la plantilla de `/add-game`. Implementar el fondo en canvas fuera de pantalla, las 6 ciudades con su blindaje y los 3 silos, el HUD, la mira (ratón y teclado), el disparo con cargas y recarga, los interceptores, las explosiones primaria y secundaria, el estado `'ready'` y el bucle de pasos fijos de 1/120 s. Verificación: `/games/defensa/index.html` espera con "HAZ CLIC O PULSA ESPACIO", el primer clic solo inicia, la mira sigue al ratón y a las flechas dentro de sus límites, cada disparo gasta una carga y esta se recupera 0,9 s después, y la explosión primaria dura 0,80 s. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir los enemigos (MISIL, RACIMO con su partición en 4, ESQUIVADOR con su desvío), el calendario de lanzamientos por sector, el blindaje y los impactos, la cadena con su puntuación `20 × 2^d` y los textos flotantes, el recuento con bonus y reparación, y los tres finales con `endGame()`. Verificación: abierto directamente, un misil destruido por la explosión primaria suma 20, uno destruido por la secundaria suma 40 y el siguiente eslabón 80, un impacto quita 1 de blindaje, entre sectores se repara una ciudad, perder las 6 ciudades muestra "GAME OVER" tras 1,5 s, limpiar el sector 8 muestra "¡ÓRBITA ASEGURADA!" y Espacio reinicia desde el sector 1.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con las cuatro flechas y `Space`; clics ignorados en pausa. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `defensa` (con `controls`) al final de `GAMES` y la portada `cover-defensa` en `app/globals.css`. Verificación: `/games` muestra la tarjeta DEFENSA ORBITAL con su portada, `/juegos/defensa` muestra el detalle con la misma portada y `/juegos/defensa/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_defensa_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_defensa_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `defensa`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña DEFENSA ORBITAL de `/salon`.
6. Actualizar `CLAUDE.md`: `defensa` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de puntería con ratón escala las coordenadas con `getBoundingClientRect` y usa pasos fijos de 1/120 s sobre rAF. Verificación: las dos secciones nombran `defensa`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/defensa` y `/juegos/defensa/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta DEFENSA ORBITAL (SHOOTER, yellow, portada `cover-defensa`) y el filtro SHOOTER la incluye.
- [ ] `cover-defensa` se ve igual de bien en la tarjeta y en el detalle (las capas de `background-image` son válidas).

**Juego embebido**

- [ ] Al entrar en `/juegos/defensa/jugar`, el juego espera con "HAZ CLIC O PULSA ESPACIO"; el primer clic o tecla lo inicia sin disparar y sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página, y el clic derecho no abre el menú contextual sobre el canvas.
- [ ] La mira sigue al ratón con precisión a 1280px y a 375px de ancho (coordenadas escaladas) y no sale de `x = 8…792`, `y = 60…530`; con el teclado se mueve a unos 420 px/s.
- [ ] El juego empieza con 6 cargas; cada clic o Espacio gasta una y no se puede disparar más de una vez cada 0,10 s; con el cargador incompleto se recupera 1 carga cada 0,9 s hasta 6; sin cargas aparece "SIN CARGA".
- [ ] La explosión primaria llega a 42 px de radio y dura 0,80 s; cada enemigo que destruye deja una explosión secundaria de 30 px (0,50 s) hasta la profundidad 4.
- [ ] La puntuación por destrucción es 20, 40, 80, 160 y 320 según la profundidad de la explosión, y el texto flotante muestra el valor y, desde profundidad 2, "×4 CADENA", "×8 CADENA" o "×16 CADENA".
- [ ] El sector 1 lanza 26 misiles a 42 px/s en 40 s y el sector 8 lanza 60 lanzamientos a 77 px/s; el sector acaba cuando ya no quedan enemigos ni explosiones activas.
- [ ] Desde el sector 3 un RACIMO naranja se parte en 4 misiles entre `y = 160` y `y = 240`; desde el sector 4 un ESQUIVADOR verde se aparta en horizontal de una explosión cercana (menos de 70 px) y después retoma el rumbo.
- [ ] Un impacto quita 1 de blindaje: la ciudad pasa de cian a amarilla con grietas y, con el segundo impacto, a ruinas grises; una ciudad en ruinas ya no recibe misiles.
- [ ] Al acabar el sector aparece el recuento "ÓRBITA n LIMPIA" 2 s, el SCORE sube en `150 × n × (ciudades con blindaje > 0)` y se repara 1 punto en la ciudad con menos blindaje (las ruinas reviven con 1).
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] En pantalla táctil, la cruceta mueve la mira y el botón DISPARO dispara.
- [ ] PAUSA congela enemigos, interceptores, explosiones, recarga y el reloj del sector, muestra "EN PAUSA" y cambia a REANUDAR; los clics durante la pausa no disparan. REANUDAR continúa sin saltos de posición y con las mismas cargas, explosiones y tiempo que quedaban.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder las 6 ciudades aparece, tras 1,5 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al limpiar el sector 8 se muestra "¡ÓRBITA ASEGURADA!" 3 s y el modal trae la puntuación del HUD con el bonus de 1.500 por punto de blindaje incluido.
- [ ] FIN durante la partida (también antes del primer clic o en pleno recuento) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego y los clics no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el sector 1 en espera con "HAZ CLIC O PULSA ESPACIO", SCORE 0, 6 ciudades con 2 de blindaje, 6 cargas, mira en el centro y sin enemigos.

**Leaderboard**

- [ ] `games` contiene la fila `defensa` / `DEFENSA ORBITAL` y `list_migrations` muestra `add_defensa_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'defensa'` y la puntuación del HUD.
- [ ] La pestaña DEFENSA ORBITAL de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/defensa/jugar` ni en `/salon`.
- [ ] Abrir `/games/defensa/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡ÓRBITA ASEGURADA!" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) en el sector 8, con una cadena de 15 explosiones a la vez y unos 30 enemigos en pantalla.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `defensa` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta B (cadena) como alternativa a la A (oleadas), por decisión del agente. La recomendada es la A: más legible y con menos riesgo de equilibrado. B es la elección si se quiere un juego más espectacular y con más techo de habilidad.
- **Sí:** id `defensa` y título `DEFENSA ORBITAL`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/defensa/`.
- **Sí:** SHOOTER y yellow, tal como los fija la sugerencia. Es el segundo SHOOTER y el primer amarillo del catálogo, lo que equilibra categorías y colores.
- **Sí:** partida finita de 8 sectores con victoria, por decisión del agente. La inspiración clásica es infinita, pero el spec exige partida finita y un techo de puntuación conocido.
- **Sí:** ratón como control principal y teclado como alternativa completa (mira por flechas/WASD, disparo con Espacio), por decisión del agente. La sugerencia lo pide y permite jugar con el mando táctil de SPEC 10.
- **Sí:** cargador de 6 cargas que se rellena solo en lugar de munición por silo, por decisión del agente. Elimina la gestión de reservas y fomenta disparar con ritmo, que es lo que alimenta las cadenas; los silos son solo el origen visual del disparo y no son objetivo.
- **Sí:** cadena `20 × 2^d` con profundidad máxima 4, por decisión del agente. El jugador que coloca una explosión en un grupo denso de misiles gana hasta 16 veces más; el tope evita que un solo racimo dispare el marcador.
- **Sí:** ciudades con 2 de blindaje y una reparación por sector, por decisión del agente. Con un cargador sin munición limitada, el castigo ya no puede ser "perder munición", así que el error se paga en blindaje.
- **Sí:** ESQUIVADOR que se aparta de explosiones cercanas, por decisión del agente. Es la IA distinta frente a los drones de la propuesta A: obliga a anticipar y a usar las cadenas para alcanzarlo.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. A 600 px/s el interceptor avanza 5 px por paso, menos que el radio de la explosión más pequeña (30 px), así que ninguna explosión se salta a un enemigo.
- **Sí:** el sector acaba cuando se limpia la pantalla tras los 40 s de lanzamientos, por decisión del agente. El jugador no pierde puntos por tiempo y la partida dura entre 5 y 6 minutos.
- **Sí:** el primer clic o tecla solo inicia la partida, por decisión del agente. Evita disparar antes de que el iframe tenga el foco, como en SNAKE.
- **No:** sonido, skins, mejoras y tienda, por decisión del agente. Los carros multicabeza, los drones y la munición por silo son la identidad de la propuesta A.
- **No:** usar assets de `references/`, por decisión del agente. Todo son formas de canvas con brillo neón, sin riesgo de licencia.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. El recuento y "¡ÓRBITA ASEGURADA!" sí se dibujan, porque forman parte de la partida.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                                     |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el juego espera al primer clic o tecla. Hay un criterio que lo comprueba.       |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                                      |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                          |
| Los temporizadores, la recarga o las explosiones siguen corriendo durante la pausa.   | Todos avanzan solo dentro de `step()`, que no se ejecuta en pausa; los clics se ignoran con `paused`.                                                          |
| Las coordenadas del ratón se desvían porque el canvas se escala con CSS.              | `toCanvas()` usa `getBoundingClientRect()`; un criterio comprueba la precisión a 1280px y a 375px.                                                             |
| La mira del teclado y la del ratón se pelean cuando se usan a la vez.                 | La última entrada manda: el movimiento del ratón fija la mira y las teclas la mueven desde su posición actual.                                                 |
| Una cadena larga dispara la puntuación o crea un bucle de explosiones infinito.       | Profundidad máxima 4: las explosiones de profundidad 4 puntúan y no generan más; cada explosión mata a cada enemigo una sola vez.                              |
| El ESQUIVADOR es imposible de alcanzar o irrelevante.                                 | Desvío de solo 110 px/s y solo mientras haya una explosión a menos de 70 px; todas las cifras en `TUNING`.                                                     |
| El equilibrado de cargas, densidad y blindaje queda demasiado fácil o difícil.        | Todas las cifras en `TUNING`; 6 cargas y 1 recarga cada 0,9 s dan unos 44 disparos por sector contra 26 a 60 lanzamientos, y las cadenas cubren la diferencia. |
| Un sector no termina nunca (un enemigo o una explosión queda activo).                 | Los enemigos siempre acaban en el suelo y las explosiones duran como mucho 0,80 s; un criterio comprueba que el recuento llega.                                |
| Un clic en el iframe para dar foco dispara un interceptor sin querer.                 | El primer clic o tecla en `'ready'` solo inicia la partida.                                                                                                    |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 5 aplica la migración antes de verificar el guardado.                                                                                                  |
| La puntuación supera 10.000.000.                                                      | Máximo teórico de 203.360; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                                   |
| Hasta 15 explosiones y 30 enemigos con `shadowBlur` bajan los FPS.                    | Fondo y siluetas prerenderizados; brillo solo en explosiones primarias, estelas y mira; secundarias con relleno semitransparente.                              |
| La puntuación por cadena no se entiende y el jugador no ve por qué puntúa distinto.   | Texto flotante con el valor y "×N CADENA"; la descripción del catálogo lo explica.                                                                             |
| Sin ratón y sin teclado cómodo (táctil) la puntería es poco precisa.                  | La cruceta del mando táctil mueve la mira a 420 px/s; la precisión táctil se deja a la skin móvil (`mobile-porte`).                                            |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Mejoras entre sectores, tienda y armas especiales.
- Munición por silo, carros multicabeza y drones bombarderos (propuesta A).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
