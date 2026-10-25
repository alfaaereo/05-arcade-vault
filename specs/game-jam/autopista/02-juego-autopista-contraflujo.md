# SPEC JAM — Juego real AUTOPISTA NEÓN embebido y con leaderboard (propuesta B: contraflujo)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-24
> **Tema:** AUTOPISTA NEÓN
> **Propuesta:** B — autopista de doble sentido con velocidad automática, contramano que triplica los puntos, nitro que gasta combustible y 10 tramos sin vidas, donde cada choque cuesta gasolina. Alternativa a `01-juego-autopista-resistencia.md`: implementar solo una.
> **Objetivo:** Crear el juego AUTOPISTA NEÓN y hacerlo jugable en `/juegos/autopista/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y varios ARCADE de tablero o cuadrícula (ARKANOID, SNAKE, FROGGER). Ninguno es un juego de conducción con scroll vertical continuo ni gestiona un recurso que se agota. AUTOPISTA NEÓN, sugerida por el game-planner (`autopista`, ARCADE · cyan, 2026-10-21), es una carrera cenital infinita: el jugador esquiva tráfico a velocidad creciente y vigila el combustible. Es el tercer juego cian, color que hasta ahora usan ASTEROIDS y ARKANOID.

Se parece a FROGGER en que hay coches en una carretera, pero se juega al revés: allí se cruza a pie por saltos de casilla; aquí se conduce, el movimiento es continuo y el peligro viene de la velocidad.

Encaja con el tema de la jam, AUTOPISTA NEÓN, en las tres capas: la mecánica es conducir y esquivar, la ambientación es una autopista synthwave de líneas cian y magenta sobre fondo oscuro, y los textos hablan de contramano, nitro, bidones y tramos. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de riesgo y recompensa. La autopista tiene dos sentidos: los carriles 1–2 van en tu dirección y los carriles 3–4 vienen de frente. No hay freno ni acelerador (la velocidad sube sola con los tramos): el jugador solo elige carril y cuándo gastar nitro. Conducir en contramano triplica los puntos por metro y es donde están los bidones, pero el tráfico llega a más de 700 px/s y algunos coches te buscan. No hay vidas: cada choque cuesta 30 de combustible y el fin llega al vaciar el depósito. Gana frente a la propuesta A (`01-juego-autopista-resistencia.md`) en novedad, en tensión por segundo y en diferencia entre jugadores (el multiplicador ×1 a ×6 abre mucho margen), y pierde en legibilidad (más reglas que explicar) y en riesgo de equilibrado (nitro y contramano son difíciles de calibrar).

En cuanto `autopista` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/autopista/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>AUTOPISTA NEÓN — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600 en vista cenital. La carretera ocupa `x = 200…600` (4 carriles de 100 px, centros en `x = 250, 350, 450, 550`) y cubre todo el alto. Una doble línea amarilla en `x = 400` separa los carriles 1–2 (tu sentido) de los 3–4 (contraflujo, con un resplandor magenta). A cada lado hay un panel de 200 px con el HUD y decorado neón (rejilla y postes de luz que se desplazan con la carretera). No hay HUD sobre la carretera.
  - El coche del jugador (deportivo cian de 44×76 px, hitbox 36×64) está fijo en `y = 470` mirando hacia arriba; solo se mueve en horizontal. La carretera y el tráfico se desplazan hacia abajo.
  - HUD (fuente "Press Start 2P"): panel izquierdo con `SCORE` (cian), `TRAMO n/10` (amarillo) y `KM x,x` (tinta); panel derecho con `KM/H` (tinta), barra vertical de combustible de 200 px (verde; amarilla por debajo de 50; magenta parpadeante por debajo de 25), el multiplicador `×N` grande (`×1`, `×2`, `×3` o `×6`; magenta cuando es contramano, cian con nitro) y el indicador `NITRO` (encendido mientras se usa).
  - Estado inicial: tramo 1, SCORE 0, combustible 100, velocidad 0, coche en el carril 2 (`x = 350`), sin tráfico y con el texto "PULSA UNA FLECHA". No se mueve nada hasta la primera flecha, WASD o Espacio.
  - Controles: `←`/`A` y `→`/`D` mueven el coche en horizontal a 360 px/s; `Espacio` mantenido activa el nitro. No hay freno ni acelerador. El coche no puede salir de la carretera (el centro queda entre `x = 218` y `x = 582`); rozar el borde no penaliza y cruzar la mediana es libre.
  - Velocidad `v` en px/s (se muestra en km/h como `round(v × 0,4)`): `420 + 30 × (tramo − 1)` (690 en el tramo 10). Al empezar acelera de 0 a `v` a 300 px/s².
  - Nitro: mientras se mantiene `Espacio` y el combustible es de 5 o más, `v` tiende a `1,45 × v` a 600 px/s² y se gastan 8 de combustible extra por segundo; el multiplicador de puntos se duplica. Al soltar o quedar por debajo de 5 de combustible vuelve a `v`. No se puede usar durante el derrape.
  - Distancia: 1 m = 10 px de carretera recorrida. Un tramo mide 2.000 m y el tramo es `min(10, 1 + floor(m / 2.000))`. La meta está en 20.000 m.
  - Combustible: depósito de 100, gasto base de 2,2 por segundo (más 8 con nitro). Un bidón da +30 (máximo 100) y +150 puntos. Con combustible 0 la partida acaba.
  - Contramano: si el centro del coche está en `x > 400`, el multiplicador de metros es ×3. Se acumula con el nitro: ×1, ×2 (nitro), ×3 (contramano) o ×6 (ambos).
  - Puntuación: 1 punto por cada 10 m recorridos, multiplicado por `tramo × multiplicador` en el momento de cada decena de metros; más los rasantes, más 150 por bidón, más 500 × `tramo` y +20 de combustible al completar cada tramo (con aviso "TRAMO n" de 1,5 s que no detiene el juego), más el bonus de meta de 50 por punto de combustible (entero).
  - Bidones: un bidón verde (círculo de radio 14 con rayo) aparece cada 450 m ±60 m, con un 70 % de probabilidad en un carril de contraflujo (3 o 4) y un 30 % en uno propio (1 o 2), siempre sin coche en una ventana de 200 px; se pierde si sale por debajo de la pantalla.
  - Tráfico (hitbox, velocidad respecto al suelo en px/s; en pantalla un coche del sentido propio se mueve a `v − 260` y uno de contraflujo a `v + 300`):
    - CIVIL (magenta, 40×68), solo en carriles 1–2, 260 px/s en tu sentido; mantiene su carril.
    - CONTRAMANO (cian oscuro con faros blancos, 40×68), solo en carriles 3–4, 300 px/s en sentido contrario; mantiene su carril.
    - KAMIKAZE (amarillo con faros magenta intermitentes, 40×66): desde el tramo 3, el 30 % de los coches de contraflujo. Mientras su centro esté entre `y = −80` y `y = 330`, se desplaza lateralmente hacia la `x` del jugador a 90 px/s (nunca sale de la carretera); por debajo de `y = 330` sigue recto.
  - Generación: cada vez que la carretera avanza `420 − 22 × (tramo − 1)` px desde la última fila (222 px en el tramo 10), aparece una fila a `y = −120` con 1 coche (tramos 1–4) o 2 (tramos 5–10) en carriles distintos; cada coche es de contraflujo con un 60 % de probabilidad. Nunca hay más de 2 coches en una fila, así que siempre queda al menos un carril libre. Los coches que salen por abajo (`y > 720`) se eliminan.
  - Colisión: solape de hitboxes en cada paso fijo. Choque: −30 de combustible, el coche contrario desaparece con una explosión de partículas, derrape de 1 s (dirección a la mitad, `v` al 65 % y recuperación lineal, nitro cortado) y el jugador es invulnerable 1 s (parpadea, sin colisiones ni rasantes). No hay vidas.
  - Rasante: cuando el centro de un coche contrario cruza la `y` del jugador, si el hueco lateral `|dx| − 18 − medio ancho de su hitbox` está entre 0 (sin tocar) y 22 px, suma 100 si el coche es de tu sentido y 250 si es de contraflujo. Cada coche da como mucho un rasante. Se muestra un destello "+250" junto al coche.
  - Fin de partida (todos por `endGame()`): combustible 0 (por gasto o por choque), con 1,2 s de animación (el coche decelera y se apaga), o completar el tramo 10 (20.000 m), con "¡META!" 2,5 s y el coche saliendo por arriba. Al entrar en la meta se suman 50 por punto de combustible.
  - Todo el dibujo con `shadowBlur` en pocas formas por frame: el decorado lateral y las líneas de carril se dibujan sin brillo o con un canvas fuera de pantalla.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s. Todos los temporizadores (derrape, invulnerabilidad, aviso de tramo, animaciones) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowLeft`, `ArrowRight` y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas (también el nitro).
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡META!" con la puntuación y Espacio reinicia solo tras el fin (durante la partida Espacio es nitro).
- Nueva entrada `autopista` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta con `ArrowLeft` y `ArrowRight` y un botón `Space` "NITRO".
- Portada nueva `cover-autopista` en `app/globals.css`, diseñada con `/frontend-design`: rejilla oscura, doble línea amarilla central y líneas de carril discontinuas en cian y magenta sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con el deportivo cian visto desde arriba en contramano, con una estela de nitro y un coche de frente con faros. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_autopista_to_games.sql` que inserta `autopista` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Puntuación, combustible o tramo en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Clima, noche o túneles, motos, patrullas y camiones.
- Gasolineras con repostaje, mejoras entre tramos y garaje.
- Acelerador, freno, puntos de integridad y cadena de rasantes (propuesta A).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "autopista",
  title: "AUTOPISTA NEÓN",
  short: "Conduce en contramano, usa el nitro y vigila la gasolina.",
  long: "Cambia de carril con ← → o A D por una autopista de doble sentido. Los carriles de la derecha vienen de frente: conducir por ellos triplica los puntos por metro y es donde están los bidones, pero el tráfico llega a toda velocidad y algunos coches te buscan. Mantén Espacio para el nitro: duplica los puntos y gasta combustible. Cada choque te cuesta 30 de gasolina y la partida acaba cuando el depósito se vacía o al completar diez tramos de 2 km.",
  cat: "ARCADE",
  cover: "cover-autopista",
  color: "cyan",
  src: "/games/autopista/index.html",
  controls: {
    pad: [
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
    ],
    buttons: [{ code: "Space", label: "NITRO" }],
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
  MEDIAN_X = 400,
  PLAYER_Y = 470;
const STEP = 1000 / 120; // paso fijo de simulación en ms
const TRAMO_M = 2000,
  META_M = 20000,
  MAX_TRAMO = 10;
const baseSpeed = () => 420 + 30 * (tramo - 1); // px/s; ×1,45 con nitro
const rowGap = () => 420 - 22 * (tramo - 1); // px entre filas de tráfico
const carsPerRow = () => (tramo >= 5 ? 2 : 1);
const BURN = 2.2,
  NITRO_BURN = 8,
  NITRO_MIN_FUEL = 5,
  CRASH_FUEL = 30,
  CAN_FUEL = 30,
  TRAMO_FUEL = 20;
const multiplier = () => (x > MEDIAN_X ? 3 : 1) * (nitro ? 2 : 1); // ×1, ×2, ×3 o ×6
const TRAFFIC = {
  civil: { w: 40, h: 68, speed: 260, lanes: [0, 1], color: C.magenta }, // mismo sentido
  contramano: { w: 40, h: 68, speed: -300, lanes: [2, 3], color: C.cyan }, // sentido contrario
  kamikaze: { w: 40, h: 66, speed: -300, lanes: [2, 3], color: C.yellow }, // se desvía hacia ti 90 px/s
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
// endGame(reason) — 'fuel' | 'win' | 'end'; 'win' suma 50 × floor(combustible) al entrar en 'finished'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: metros `1.200 × (1 + 2 + … + 10) = 66.000` (200 decenas por tramo × tramo × ×6), hasta 1.084 coches con un rasante de 250 cada uno (271.000), 44 bidones (6.600), premios de tramo `500 × 55 = 27.500` y bonus de meta con 100 de combustible (5.000): 376.100, cota inalcanzable en la práctica y muy por debajo de 10.000.000.
- Fin de partida: en `step()`, combustible ≤ 0 → estado `dying` y, a los 1,2 s, `endGame('fuel')`; distancia ≥ 20.000 m → bonus, estado `finished` y, a los 2,5 s, `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada.
- Teclas: `←`/`A` y `→`/`D` mueven; `Espacio` mantenido es nitro. `P` pausa y `Espacio` reinicia solo abierto directamente (y solo tras el fin).
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS). Jugador y líneas de carril en cian, mediana en amarillo, resplandor de contraflujo y CIVIL en magenta, KAMIKAZE en amarillo, bidones y combustible en verde.
- El iframe lleva `title="AUTOPISTA NEÓN"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (velocidades, gasto, multiplicadores, bidones) viven en un objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador de pasos fijos, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/autopista/` desde la plantilla de `/add-game`. Implementar la carretera de doble sentido con scroll y mediana, los paneles laterales con el HUD, el coche del jugador con movimiento lateral, el bucle de pasos fijos de 1/120 s, la velocidad por tramo, la distancia, el gasto de combustible, el nitro y la puntuación por metro con el multiplicador. Verificación: `/games/autopista/index.html` espera quieto con "PULSA UNA FLECHA", la primera tecla lo pone en marcha, cruzar la mediana cambia el multiplicador de ×1 a ×3 y mantener Espacio lo duplica y acelera el coche y el gasto de combustible. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir el tráfico (CIVIL, CONTRAMANO, KAMIKAZE), la generación de filas, las colisiones con pérdida de combustible, derrape e invulnerabilidad, los rasantes, los bidones, los premios de tramo, la meta con su bonus y los dos finales con `endGame()`. Verificación: abierto directamente, un choque resta 30 de combustible y provoca derrape de 1 s, un rasante a un coche de frente suma 250, un bidón da +30 y +150, completar un tramo suma `500 × tramo` y +20 de combustible, vaciar el depósito termina la partida tras 1,2 s y "GAME OVER" permite reiniciar con Espacio desde TRAMO 1.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` (tras el fin) no hacen nada y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con `ArrowLeft`, `ArrowRight` y `Space`. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `autopista` (con `controls`) al final de `GAMES` y la portada `cover-autopista` en `app/globals.css`. Verificación: `/games` muestra la tarjeta AUTOPISTA NEÓN con su portada, `/juegos/autopista` muestra el detalle con la misma portada y `/juegos/autopista/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_autopista_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_autopista_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `autopista`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña AUTOPISTA NEÓN de `/salon`.
6. Actualizar `CLAUDE.md`: `autopista` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de scroll continuo usa pasos fijos de 1/120 s sobre rAF, con el coche fijo y el mundo moviéndose, y que un botón mantenido (nitro) llega por `av:key` con `down` y `up`. Verificación: las dos secciones nombran `autopista`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/autopista` y `/juegos/autopista/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta AUTOPISTA NEÓN (ARCADE, cyan, portada `cover-autopista`) y el filtro ARCADE la incluye.
- [ ] `cover-autopista` se ve igual de bien en la tarjeta y en el detalle (las capas de `background-image` son válidas).

**Juego embebido**

- [ ] Al entrar en `/juegos/autopista/jugar`, el coche espera quieto en el carril 2 con "PULSA UNA FLECHA" y la primera flecha, WASD o Espacio lo pone en marcha sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] `←`/`→` mueven el coche por los 4 carriles sin salirse de la carretera y se puede cruzar la mediana; la velocidad en el tramo 1 es de 168 km/h (420 px/s) y no depende de ninguna tecla.
- [ ] Con el centro del coche a la derecha de la mediana el multiplicador del HUD es ×3; con Espacio mantenido pasa a ×2 (o ×6 en contramano) y el coche acelera hasta 1,45 veces la velocidad.
- [ ] El SCORE suma 1 punto por cada 10 m multiplicado por `tramo × multiplicador`, y el panel izquierdo muestra TRAMO y KM.
- [ ] El nitro gasta 8 de combustible por segundo extra y se corta con menos de 5 de combustible y durante el derrape.
- [ ] Un bidón verde recogido suma 30 al combustible (máximo 100) y 150 al SCORE, y el 70 % aparece en los carriles 3–4.
- [ ] Rozar un coche sin tocarlo (hueco de 0 a 22 px) suma 100 si es de tu sentido y 250 si viene de frente.
- [ ] Un choque resta 30 de combustible, hace parpadear el coche 1 s sin más colisiones y deja 1 s de derrape con la dirección a la mitad.
- [ ] Desde el tramo 3, algunos coches de frente con faros magenta intermitentes (KAMIKAZE) se desvían hacia la posición del jugador hasta `y = 330` y después siguen recto.
- [ ] Al pasar 2 km el HUD pasa a TRAMO 2, aparece "TRAMO 2" 1,5 s, se suman 500 puntos y 20 de combustible y el juego no se detiene.
- [ ] En ningún momento hay una fila de tráfico con más de 2 coches ni que cierre los 4 carriles.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] PAUSA congela la carretera, el tráfico y todos los temporizadores, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos de posición, con el mismo derrape y con el nitro suelto aunque Espacio estuviera pulsado.
- [ ] En modo embebido, `P` y `Espacio` (fuera del nitro) no pausan ni reinician el juego.
- [ ] Al vaciarse el combustible aparece, tras 1,2 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Un choque con combustible bajo (menos de 30) termina la partida por el mismo camino, con una sola llamada a `av:gameover`.
- [ ] Al llegar a los 20.000 m se muestra "¡META!" 2,5 s y el modal trae la puntuación del HUD con el bonus de 50 por punto de combustible incluido.
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el coche quieto en el carril 2 con "PULSA UNA FLECHA", SCORE 0, TRAMO 1, combustible 100 y sin tráfico.

**Leaderboard**

- [ ] `games` contiene la fila `autopista` / `AUTOPISTA NEÓN` y `list_migrations` muestra `add_autopista_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'autopista'` y la puntuación del HUD.
- [ ] La pestaña AUTOPISTA NEÓN de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/autopista/jugar` ni en `/salon`.
- [ ] Abrir `/games/autopista/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "¡META!" al ganar, y reinicia con Espacio solo después del fin.
- [ ] La partida se mantiene fluida (sin tirones apreciables) con 2 coches por fila, nitro y el decorado lateral en movimiento.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `autopista` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta B (contraflujo) como alternativa a la A, por decisión del agente. Aporta más identidad y más margen entre jugadores, pero tiene más reglas que explicar y un equilibrado más delicado; por eso la recomendada es A.
- **Sí:** id `autopista` y título `AUTOPISTA NEÓN`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/autopista/` ni el id en `GAMES`.
- **Sí:** ARCADE y cyan, tal como los fija la sugerencia. ARCADE ya tiene tres juegos reales (ARKANOID, SNAKE y FROGGER) y este sería el cuarto; PUZZLE, SHOOTER y VERSUS siguen pendientes de equilibrar. Cian pasa a tres juegos: es una limitación asumida de la sugerencia.
- **Sí:** partida finita con meta a 20.000 m y 10 tramos de 2 km, por decisión del agente. La sugerencia dice "infinita", pero el spec exige partida finita y un techo de puntuación conocido; el combustible acaba la mayoría de partidas antes.
- **Sí:** velocidad automática por tramo, sin freno ni acelerador, por decisión del agente. Reduce el control a carril y nitro, hace el juego jugable con una mano y deja el riesgo en la decisión de dónde conducir.
- **Sí:** multiplicador de contramano ×3 y nitro ×2, que se multiplican (×6), por decisión del agente. Es la palanca que separa a los jugadores en el Salón: el que se atreve a vivir en el contraflujo puntúa mucho más.
- **Sí:** sin vidas; el choque cuesta 30 de combustible, por decisión del agente. Un solo recurso (gasolina) une choque, nitro y bidones, y evita un HUD de vidas.
- **Sí:** el nitro se corta por debajo de 5 de combustible, por decisión del agente. Impide vaciar el depósito a propósito para terminar antes de tiempo y obliga a decidir cuándo parar.
- **Sí:** tres IAs de tráfico (CIVIL y CONTRAMANO de carril fijo, KAMIKAZE que se desvía hacia ti hasta `y = 330`), por decisión del agente. El KAMIKAZE se distingue por los faros intermitentes y castiga quedarse en contramano sin vigilar.
- **Sí:** el 70 % de los bidones aparece en contraflujo, por decisión del agente. Obliga a asumir el riesgo de contramano para sostener el nitro.
- **Sí:** coche fijo en `y = 470` y mundo que se desplaza, y movimiento lateral continuo, por decisión del agente. Simplifica la cámara y hace posibles los rasantes de 0 a 22 px.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. A la velocidad relativa máxima (unos 1.300 px/s: nitro del tramo 10 más tráfico de frente) cada paso mueve unos 11 px, menos que la hitbox más pequeña (36 px), así que ningún coche atraviesa a otro.
- **Sí:** el jugador espera a la primera tecla, por decisión del agente. Evita perder antes de que el iframe tenga el foco, como en SNAKE.
- **No:** sonido, skins, acelerador, freno, integridad y cadena de rasantes, por decisión del agente. Los tres últimos son la identidad de la propuesta A.
- **No:** usar assets de `references/`, por decisión del agente. Coches y bidones son formas de canvas con brillo neón, sin riesgo de licencia.
- **Sí:** en modo embebido se desactivan `P`, el reinicio con Espacio y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. La animación de "¡META!" sí se dibuja, porque forma parte de la partida.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El iframe no tiene el foco y el teclado no llega al juego.                                    | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el coche espera a la primera tecla. Hay un criterio que lo comprueba.         |
| `av:gameover` se envía dos veces en la misma partida (p. ej. choque letal y `av:end`).        | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`; un choque con combustible 0 pasa a `dying` una sola vez.           |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.            | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                                        |
| El nitro queda activo tras pausar o perder el foco (se pierde el `keyup` de Espacio).         | `clearKeys()` en `blur`, `av:resume` y `av:restart`; el mando táctil suelta las teclas al pausar.                                                            |
| El contramano con nitro hace la partida demasiado fácil de inflar (×6) o demasiado letal.     | Todas las cifras en un objeto `TUNING`; el KAMIKAZE y la velocidad relativa de hasta 1.300 px/s equilibran el riesgo; revisar con partidas de prueba.        |
| Una fila de tráfico deja al jugador sin salida y la partida es injusta.                       | Máximo 2 coches por fila y filas a más de 220 px de distancia: siempre queda un carril libre. El KAMIKAZE deja de seguir al jugador por debajo de `y = 330`. |
| Un bidón aparece encima de un coche o fuera del alcance del jugador.                          | Solo se genera en un carril sin coche en una ventana de 200 px; con 4 carriles siempre hay ruta para llegar a él.                                            |
| Un coche atraviesa al jugador a alta velocidad relativa.                                      | Pasos fijos de 1/120 s: unos 11 px por paso como máximo frente a una hitbox mínima de 36 px.                                                                 |
| El rasante se cuenta dos veces o con un coche que ya chocó.                                   | Bandera por coche (`passed`) y los coches que chocan se eliminan; no hay rasantes durante la invulnerabilidad.                                               |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.         | El paso 5 aplica la migración antes de verificar el guardado.                                                                                                |
| La puntuación supera 10.000.000.                                                              | Máximo teórico de 376.100; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                                 |
| `shadowBlur` en decenas de formas por frame baja los FPS en equipos modestos.                 | Brillo solo en coche, tráfico visible y bidones; decorado y líneas sin brillo o prerenderizados en un canvas fuera de pantalla.                              |
| A 375px de ancho el HUD de los paneles laterales (200 px) y el multiplicador quedan pequeños. | Valores a 16–18 px y el multiplicador a 28 px; hay un criterio a 375px.                                                                                      |
| Se confunde con FROGGER por tener coches en una carretera.                                    | Perspectiva, control y objetivo distintos (conducción continua, combustible, contramano); la portada y los textos lo dejan claro.                            |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Clima, túneles, motos, patrullas y camiones.
- Gasolineras, mejoras y garaje.
- Acelerador, freno, integridad y cadena de rasantes (propuesta A).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
