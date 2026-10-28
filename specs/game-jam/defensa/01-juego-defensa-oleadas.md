# SPEC JAM — Juego real DEFENSA ORBITAL embebido y con leaderboard (propuesta A: oleadas)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-28
> **Tema:** DEFENSA ORBITAL
> **Propuesta:** A — 12 oleadas con munición limitada por silo (3 silos), misiles, carros multicabeza y drones bombarderos, puntuación con multiplicador por oleada y bonus por ciudades y munición sobrantes. Alternativa a `02-juego-defensa-cadena.md`: implementar solo una.
> **Objetivo:** Crear el juego DEFENSA ORBITAL y hacerlo jugable en `/juegos/defensa/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene un solo SHOOTER (ASTEROIDS, nave con rotación y empuje) y el resto son ARCADE o PUZZLE. DEFENSA ORBITAL, sugerida por el game-planner (`defensa`, SHOOTER · yellow, 2026-10-21), es un shooter de puntería pura: el jugador no pilota nada, apunta con una mira, adelanta el disparo a un enemigo que cae y gestiona munición para proteger seis ciudades. Es el segundo SHOOTER y el primer juego amarillo del catálogo, y el primero que se juega sobre todo con el ratón (con alternativa de teclado).

Encaja con el tema de la jam, DEFENSA ORBITAL, en las tres capas: la mecánica es interceptar misiles que caen sobre ciudades, la ambientación es una órbita baja de fondo oscuro con estelas magenta, ciudades cian y explosiones amarillas, y los textos hablan de silos, oleadas y carros multicabeza. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de oleadas: la partida se divide en 12 rondas con pantalla de recuento, cada silo tiene una reserva fija de interceptores que se repone al empezar cada oleada, y la puntuación premia llegar con ciudades y munición de sobra. Gana frente a la propuesta B (`02-juego-defensa-cadena.md`) en legibilidad (reglas conocidas, objetivo claro por oleada) y en riesgo de equilibrado; pierde en novedad y en espectáculo: B no limita la munición y puntúa las reacciones en cadena.

En cuanto `defensa` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/defensa/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>DEFENSA ORBITAL — Arcade Vault</title>` y `cursor: none` en el canvas (la mira se dibuja en el juego).
- Mecánica en `game.js`:
  - Lienzo 800×600. Franja de HUD de 36 px arriba (`y = 0…36`), cielo jugable de `y = 36…548` y franja de suelo de 52 px (`y = 548…600`). Fondo: degradado oscuro con unas 60 estrellas fijas y la curva del horizonte, pintado una vez en un canvas fuera de pantalla.
  - Seis ciudades (rectángulos-silueta cian de 44×20 px sobre el suelo) con centros en `x = 130, 215, 300, 500, 585, 670`. Tres silos (trapecios amarillos de 40×24 px) con centros en `x = 40, 400, 760`. Las ciudades y los silos son los 9 objetivos de los misiles.
  - HUD (fuente "Press Start 2P", 14 px): `SCORE` (cian) a la izquierda, `OLEADA n/12` (amarillo) en el centro y `×m` (magenta) a la derecha, con el multiplicador de la oleada. La munición de cada silo se ve como una fila de cuadraditos de 4 px bajo el silo, en la franja de suelo.
  - Estado inicial: oleada 1, SCORE 0, 6 ciudades en pie, 3 silos con 10 interceptores cada uno, mira en `(400, 300)` y el texto "HAZ CLIC O PULSA ESPACIO". No pasa nada hasta el primer clic o tecla del juego; ese primer clic o tecla solo inicia y no dispara.
  - Mira: con el ratón sigue al puntero (coordenadas escaladas con `getBoundingClientRect`: `(e.clientX - rect.left) * canvas.width / rect.width`). Con teclado, `←` `→` `↑` `↓` o `A` `D` `W` `S` la mueven a 420 px/s. Siempre queda dentro de `x = 8…792`, `y = 60…530`. La última entrada (ratón o teclado) manda.
  - Disparo: clic izquierdo o `Espacio` lanza un interceptor desde el silo más cercano en horizontal a la mira que esté en pie y tenga munición. `Z`, `X` y `C` disparan desde el silo izquierdo, central y derecho respectivamente (si ese silo no tiene munición, no hacen nada y el silo parpadea). Enfriamiento global de 0,12 s entre disparos. Si ningún silo tiene munición aparece el aviso "SIN MUNICIÓN" 0,8 s.
  - Interceptor: viaja en línea recta desde la boca del silo (`y = 524`) hasta el punto de la mira en el momento del disparo, a 520 px/s, dejando una estela amarilla, y estalla al llegar. La explosión crece de radio 0 a 44 px en 0,35 s, se mantiene 0,15 s y se contrae a 0 en 0,40 s (1,0 s en total). Todo enemigo cuyo centro quede dentro del radio actual muere. Las explosiones no dañan ciudades ni silos.
  - Enemigos (cada oleada `n` usa la velocidad base `vE = 45 + 6 × (n − 1)` px/s, de 45 a 111):
    - MISIL (magenta): aparece en `y = 36` con `x` al azar en `20…780` y baja en línea recta hacia un objetivo en pie elegido al azar entre los 9. Vale 25 puntos.
    - CARRO multicabeza (naranja, desde la oleada 3): baja como un misil y, a una altura al azar entre `y = 150` y `y = 260`, se parte en 3 CABEZAS que siguen en línea recta hacia 3 objetivos en pie distintos (si hay menos de 3 objetivos, se repiten). El carro vale 50 y cada cabeza 25. Hay `floor(n / 2)` carros por oleada (de 1 en la oleada 3 a 6 en la 12) y cuentan como lanzamientos.
    - DRON bombardero (verde, desde la oleada 5): entra por un lado a una altura al azar entre `y = 90` y `y = 150`, cruza la pantalla en horizontal a 90 px/s y suelta un MISIL cada 1,2 s hacia un objetivo en pie al azar; sale por el otro lado. Mide 28×14 px (radio de impacto 14). Vale 100. Hay 1 dron en las oleadas 5 a 8 (aparece a los 4 s de empezar la oleada) y 2 en las 9 a 12 (a los 4 s y a los 12 s). Los misiles que suelta no cuentan como lanzamientos.
  - Lanzamientos por oleada: `L(n) = 6 + 2n` (8 en la oleada 1, 30 en la 12), incluidos los carros. Intervalo entre lanzamientos `max(0,5 , 1,6 − 0,1 × (n − 1))` s; desde la oleada 7 cada lanzamiento sale por pares (2 enemigos a la vez, el segundo con `x` al menos 120 px de distancia del primero) mientras queden 2 por lanzar. Los lanzamientos pares cuentan como 2 del total.
  - Munición: al empezar cada oleada se repone a `10 + floor((n − 1) / 4)` interceptores por silo (10, 11 o 12). Un silo destruido pierde toda su munición hasta la siguiente oleada, en la que se reconstruye.
  - Impacto: un enemigo que llega al suelo en su objetivo destruye esa ciudad (queda en ruinas grises) o ese silo (sin munición), con una explosión de partículas naranja. Un objetivo en ruinas deja de ser elegible.
  - Fin de oleada: no quedan lanzamientos por hacer, ni enemigos, ni drones, ni explosiones activas. Entonces se pasa al recuento de 2,5 s: "OLEADA n SUPERADA" y el bonus `m × (100 × ciudades en pie + 5 × interceptores sobrantes)`, que se suma de golpe al SCORE al empezar el recuento. Al final de las oleadas 4 y 8 se reconstruye la ciudad en ruinas de menor índice (si hay alguna). Tras el recuento hay una cuenta de 1,5 s "OLEADA n+1" y empieza la siguiente.
  - Multiplicador de oleada `m = 1 + floor((n − 1) / 2)` (×1 en las oleadas 1–2, ×6 en las 11–12). Cada enemigo destruido suma su valor × `m`.
  - Final de la partida (todos por `endGame()`): (1) las 6 ciudades en ruinas; tras 1,5 s de animación (las ruinas arden), `endGame('cities')`; (2) superar la oleada 12: recuento y 3 s de "¡SISTEMA SALVADO!", con un bonus final de 2.000 por ciudad en pie que se suma al empezar, y `endGame('win')`; (3) FIN de la plataforma (`av:end`): `endGame('end')` en cualquier estado salvo `gameover`.
  - Estados: `'ready'` (espera la primera entrada) · `'intro'` · `'wave'` · `'tally'` · `'dying'` · `'victory'` · `'gameover'`.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Todos los temporizadores (enfriamiento, explosiones, intervalos de lanzamiento, parpadeos, recuento) avanzan solo dentro de esos pasos.
- Rendimiento: el fondo estático se pinta una vez en un canvas fuera de pantalla; `shadowBlur` solo en explosiones, estelas y mira (nunca en las estrellas ni en las siluetas del suelo).
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS`, `KeyD`, `KeyZ`, `KeyX` y `KeyC`; `contextmenu` también se cancela dentro del canvas.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con las cuatro flechas y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas. Durante la pausa los clics no disparan.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡SISTEMA SALVADO!" con la puntuación y Espacio reinicia.
- Nueva entrada `defensa` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de 4 flechas para mover la mira y un botón `DISPARO` (`Space`).
- Portada nueva `cover-defensa` en `app/globals.css`, diseñada con `/frontend-design`: cielo oscuro con rejilla tenue y un horizonte curvo en amarillo sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con la silueta de tres ciudades cian, tres estelas magenta que caen y dos explosiones amarillas con su mira, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_defensa_to_games.sql` que inserta `defensa` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Puntuación, oleada o munición en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Aviones, misiles inteligentes que esquivan, escudos, mejoras entre oleadas y tienda.
- Reacciones en cadena puntuadas, reloj por sectores y blindaje de ciudades (propuesta B).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "defensa",
  title: "DEFENSA ORBITAL",
  short: "Intercepta la lluvia de misiles y salva tus seis ciudades.",
  long: "Seis ciudades, tres silos y un cielo lleno de misiles. Apunta con el ratón (o con las flechas y WASD) y dispara con clic o Espacio: tus interceptores estallan en una esfera que destruye todo lo que toque. Aguanta 12 oleadas con carros multicabeza y drones bombarderos; la munición es limitada, cada oleada puntúa más y las ciudades y los interceptores que te sobren dan bonus.",
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
const MAX_WAVE = 12;
const mult = () => 1 + Math.floor((wave - 1) / 2);
const enemySpeed = () => 45 + 6 * (wave - 1); // px/s
const launches = () => 6 + 2 * wave;
const launchGap = () => Math.max(0.5, 1.6 - 0.1 * (wave - 1)); // s
const ammoPerSilo = () => 10 + Math.floor((wave - 1) / 4);
const BLAST = { r: 44, grow: 0.35, hold: 0.15, shrink: 0.4 }; // s
const INTERCEPTOR_SPEED = 520; // px/s
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
      step(STEP / 1000); // mira, interceptores, enemigos, explosiones, impactos; puede llamar a endGame()
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
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico (todo destruido, 6 ciudades en pie y toda la munición sobrante en cada oleada, imposible a la vez): las 12 oleadas suman 87.770 (destrucciones `m × (25 × misiles + 125 × carros + 275 × drones)` con 7 misiles soltados por dron, más el bonus de oleada `m × (600 + 5 × munición total)`) y el bonus final de victoria añade 12.000: 99.770, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, la última ciudad destruida → `'dying'` y, a los 1,5 s, `endGame('cities')`; recuento de la oleada 12 → `'victory'` y, a los 3 s, `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada.
- Teclas: ratón (movimiento y clic izquierdo) o `←` `→` `↑` `↓` / `A` `D` `W` `S` para la mira; clic o `Espacio` disparan desde el silo más cercano; `Z` `X` `C` desde el silo izquierdo, central y derecho. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS), con un añadido: `orange: "#ff7700"` (carro y partículas de impacto). Interceptores, explosiones, mira y silos en amarillo, ciudades en cian, misiles en magenta, drones y munición disponible en verde.
- El iframe lleva `title="DEFENSA ORBITAL"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (velocidades, intervalos, radios, munición) viven en un objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador, `public/games/arkanoid/game.js` como referencia del ratón escalado con `getBoundingClientRect`, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/defensa/` desde la plantilla de `/add-game`. Implementar el fondo en canvas fuera de pantalla, las 6 ciudades y los 3 silos, el HUD, la mira (ratón y teclado), el disparo con enfriamiento, los interceptores y sus explosiones, el estado `'ready'` y el bucle de pasos fijos de 1/120 s. Verificación: `/games/defensa/index.html` espera con "HAZ CLIC O PULSA ESPACIO", el primer clic solo inicia, la mira sigue al ratón y a las flechas dentro de sus límites, cada clic gasta un interceptor del silo más cercano y la explosión crece y se contrae en 1,0 s. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir los enemigos (MISIL, CARRO con su partición en 3 CABEZAS, DRON), el calendario de lanzamientos por oleada, los impactos, el multiplicador, el recuento con sus bonus, la reconstrucción de ciudades tras las oleadas 4 y 8, la reposición de munición y los tres finales con `endGame()`. Verificación: abierto directamente, un misil destruido suma 25 × m, un carro parte en 3 cabezas entre `y = 150` y `y = 260`, un impacto deja la ciudad en ruinas, el recuento suma `m × (100 × ciudades + 5 × munición)`, perder las 6 ciudades muestra "GAME OVER" tras 1,5 s, superar la oleada 12 muestra "¡SISTEMA SALVADO!" y Espacio reinicia desde la oleada 1.
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
- [ ] Las flechas, WASD, `Z` `X` `C` y Espacio no hacen scroll en la página, y el clic derecho no abre el menú contextual sobre el canvas.
- [ ] La mira sigue al ratón con precisión a 1280px y a 375px de ancho (coordenadas escaladas) y no sale de `x = 8…792`, `y = 60…530`; con el teclado se mueve a unos 420 px/s.
- [ ] Un clic o Espacio lanza un interceptor desde el silo más cercano a la mira que tenga munición; `Z` `X` `C` lo lanzan desde el silo elegido; el silo gasta un cuadradito de munición por disparo y no se puede disparar más de una vez cada 0,12 s.
- [ ] El interceptor estalla en el punto donde estaba la mira al disparar; la explosión llega a 44 px de radio en 0,35 s y desaparece a los 1,0 s; un enemigo dentro de su radio muere y suma su valor × `m`.
- [ ] Cada silo empieza la oleada 1 con 10 interceptores; en la oleada 5 con 11 y en la 9 con 12. Sin munición en ningún silo aparece "SIN MUNICIÓN".
- [ ] La oleada 1 lanza 8 misiles a una velocidad de 45 px/s y la 12 lanza 30 lanzamientos a 111 px/s.
- [ ] Desde la oleada 3 aparece un CARRO naranja que se parte en 3 CABEZAS entre `y = 150` y `y = 260`; desde la 5 cruza un DRON verde que suelta un misil cada 1,2 s.
- [ ] Un enemigo que llega al suelo destruye su ciudad (ruinas grises) o su silo (sin munición hasta la siguiente oleada); un objetivo en ruinas ya no recibe misiles.
- [ ] Al acabar la oleada aparece el recuento "OLEADA n SUPERADA" 2,5 s y el SCORE sube en `m × (100 × ciudades en pie + 5 × interceptores sobrantes)`; tras las oleadas 4 y 8 una ciudad en ruinas se reconstruye.
- [ ] El multiplicador del HUD es ×1 en las oleadas 1–2, ×2 en 3–4 y ×6 en 11–12.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] En pantalla táctil, la cruceta mueve la mira y el botón DISPARO dispara desde el silo más cercano.
- [ ] PAUSA congela enemigos, interceptores, explosiones y temporizadores, muestra "EN PAUSA" y cambia a REANUDAR; los clics durante la pausa no disparan. REANUDAR continúa sin saltos de posición y con las mismas explosiones y munición que quedaban.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder las 6 ciudades aparece, tras 1,5 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al superar la oleada 12 se muestra "¡SISTEMA SALVADO!" 3 s y el modal trae la puntuación del HUD con el bonus de 2.000 por ciudad en pie incluido.
- [ ] FIN durante la partida (también antes del primer clic o en pleno recuento) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego y los clics no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja la oleada 1 en espera con "HAZ CLIC O PULSA ESPACIO", SCORE 0, 6 ciudades en pie, 3 silos con 10 interceptores, mira en el centro y sin enemigos.

**Leaderboard**

- [ ] `games` contiene la fila `defensa` / `DEFENSA ORBITAL` y `list_migrations` muestra `add_defensa_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'defensa'` y la puntuación del HUD.
- [ ] La pestaña DEFENSA ORBITAL de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/defensa/jugar` ni en `/salon`.
- [ ] Abrir `/games/defensa/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡SISTEMA SALVADO!" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) en la oleada 12, con hasta unos 40 enemigos y 10 explosiones a la vez.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `defensa` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta A (oleadas) como recomendada frente a la B (cadena), por decisión del agente. Es más legible (reglas conocidas, objetivo claro por oleada, bonus por ciudades y munición que premian jugar con cabeza), la fórmula separa bien a los jugadores en el Salón y tiene menos riesgo de equilibrado que las cadenas puntuadas con esquivadores. B queda como alternativa si se prefiere una partida más espectacular y sin límite de munición.
- **Sí:** id `defensa` y título `DEFENSA ORBITAL`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/defensa/`.
- **Sí:** SHOOTER y yellow, tal como los fija la sugerencia. Es el segundo SHOOTER y el primer amarillo del catálogo, lo que equilibra categorías y colores.
- **Sí:** partida finita de 12 oleadas con victoria, por decisión del agente. La inspiración clásica es infinita, pero el spec exige partida finita y un techo de puntuación conocido; las oleadas finales son el reto de los mejores.
- **Sí:** ratón como control principal y teclado como alternativa completa (mira por flechas/WASD, disparo con Espacio y `Z` `X` `C`), por decisión del agente. La sugerencia lo pide y además permite jugar con el mando táctil de SPEC 10.
- **Sí:** 3 silos con munición propia limitada y reposición por oleada, por decisión del agente. Obliga a elegir desde qué silo disparar y a defender los silos como objetivos.
- **Sí:** el disparo explota donde estaba la mira, no donde está el enemigo, por decisión del agente. La habilidad es adelantarse al enemigo, como en el clásico.
- **Sí:** 25 puntos por misil con multiplicador `m` por oleada y bonus de 100 por ciudad y 5 por interceptor sobrante, por decisión del agente. Recompensa defender bien y no malgastar munición, y da un techo de 99.770.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. A 520 px/s el interceptor avanza 4,3 px por paso, menos que cualquier radio de impacto, así que ninguna explosión se salta a un enemigo.
- **Sí:** el primer clic o tecla solo inicia la partida, por decisión del agente. Evita disparar un interceptor antes de que el iframe tenga el foco y que la oleada 1 empiece sin que el jugador mire, como en SNAKE.
- **Sí:** las explosiones no dañan ciudades ni silos, por decisión del agente. Mantiene las reglas simples y evita castigar apuntar bajo.
- **Sí:** los carros y los drones son las dos únicas amenazas especiales, por decisión del agente. Mantiene el esfuerzo en M; una IA sencilla (trayectorias rectas con objetivos al azar) se lee bien por las estelas.
- **No:** sonido, skins, misiles que esquivan, mejoras y tienda, por decisión del agente. Los misiles esquivadores y las cadenas son la identidad de la propuesta B.
- **No:** usar assets de `references/`, por decisión del agente. Todo son formas de canvas con brillo neón, sin riesgo de licencia.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. El recuento y "¡SISTEMA SALVADO!" sí se dibujan, porque forman parte de la partida.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                                  |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el juego espera al primer clic o tecla. Hay un criterio que lo comprueba.    |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                                   |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                       |
| Los temporizadores o explosiones siguen corriendo durante la pausa.                   | Todos avanzan solo dentro de `step()`, que no se ejecuta en pausa; los clics se ignoran con `paused`.                                                       |
| Las coordenadas del ratón se desvían porque el canvas se escala con CSS.              | `toCanvas()` usa `getBoundingClientRect()`; un criterio comprueba la precisión a 1280px y a 375px.                                                          |
| La mira del teclado y la del ratón se pelean cuando se usan a la vez.                 | La última entrada manda: el movimiento del ratón fija la mira y las teclas la mueven desde su posición actual.                                              |
| La oleada 12 es imposible o trivial.                                                  | Todas las cifras en `TUNING`; 36 interceptores contra 30 lanzamientos con carros y drones exige multi-impactos, y la reconstrucción tras la 4 y la 8 ayuda. |
| Un clic en el iframe para dar foco dispara un interceptor sin querer.                 | El primer clic o tecla en `'ready'` solo inicia la partida.                                                                                                 |
| Una oleada no termina nunca (un dron o enemigo queda fuera de pantalla).              | El dron sale por el borde opuesto y se elimina; los enemigos siempre acaban en el suelo; un criterio comprueba que el recuento llega.                       |
| La puntuación se cuenta dos veces al destruir una cabeza que ya impactó.              | Cada enemigo se marca `dead` al morir o impactar y se filtra al final del paso.                                                                             |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 5 aplica la migración antes de verificar el guardado.                                                                                               |
| La puntuación supera 10.000.000.                                                      | Máximo teórico de 99.770; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                                 |
| `shadowBlur` en decenas de estelas y explosiones por frame baja los FPS.              | Fondo y siluetas prerenderizados; brillo solo en explosiones, estelas y mira; hay un criterio de fluidez en la oleada 12.                                   |
| Sin ratón y sin teclado cómodo (táctil) la puntería es poco precisa.                  | La cruceta del mando táctil mueve la mira a 420 px/s y `Z` `X` `C` quedan fuera del mando; la precisión táctil se deja a la skin móvil (`mobile-porte`).    |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Misiles que esquivan, escudos, mejoras entre oleadas y tienda.
- Reacciones en cadena puntuadas, sectores cronometrados y blindaje de ciudades (propuesta B).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
