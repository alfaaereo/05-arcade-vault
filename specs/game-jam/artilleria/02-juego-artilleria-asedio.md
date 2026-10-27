# SPEC JAM — Juego real DUELO DE CAÑONES embebido y con leaderboard (propuesta B: asedio)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-27
> **Tema:** DUELO DE CAÑONES
> **Propuesta:** B — asedio de 10 tanques enemigos de cuatro tipos sobre un único terreno que acumula cráteres, con arsenal de tres armas, reloj de 12 s por turno y viento nuevo en cada turno. Alternativa a `01-juego-artilleria-rondas.md`: implementar solo una.
> **Objetivo:** Crear el juego DUELO DE CAÑONES y hacerlo jugable en `/juegos/artilleria/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y ARKANOID, SNAKE y FROGGER (ARCADE). No hay ningún juego VERSUS ni ninguno por turnos, y ninguno se juega con el cálculo en lugar de los reflejos. DUELO DE CAÑONES, sugerido por el game-planner (`artilleria`, VERSUS · yellow, 2026-10-21), es artillería clásica: dos tanques sobre un terreno, cada uno elige ángulo y potencia, el viento desvía el proyectil y cada cráter cambia el terreno. Es el primer juego VERSUS (solo contra la CPU: la plataforma no tiene multijugador) y el primero con color amarillo en el catálogo real.

Encaja con el tema de la jam en las tres capas: la mecánica es el duelo de cañones, la ambientación es un campo de batalla neón con el terreno amarillo, y los textos hablan de obuses, triples, perforantes y blindaje. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de asedio: el jugador defiende su posición fija contra una sucesión de 10 enemigos con comportamientos distintos (artillero, mortero, francotirador y un coloso final), dispone de tres armas con munición limitada y un reloj de turno que premia la rapidez. El terreno no se regenera: los cráteres de cada duelo condicionan los siguientes, y el blindaje apenas se repone. Gana frente a la propuesta A (`01-juego-artilleria-rondas.md`) en variedad, tensión y rejugabilidad (decisiones de arma, gestión de munición y de blindaje), y pierde en legibilidad, esfuerzo (tres armas, cuatro IA y reloj) y riesgo de equilibrado: hay más números que ajustar.

En cuanto `artilleria` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/artilleria/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>DUELO DE CAÑONES — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600. Franja de HUD de 56 px arriba (`y = 0…56`): panel izquierdo con la barra de blindaje del jugador (cian, 200×12 en `y = 12`) y `SCORE` (`y = 34`); centro con `ENEMIGO n/10` y el tipo (`y = 12`) y el viento (`y = 34`, flecha `◀`/`▶` y valor de 0 a 9); panel derecho con la barra de blindaje del enemigo (magenta, escalada a su máximo) y el reloj `12 s` del turno con una barra de 120×6 que se vacía. Una franja inferior (`y = 576`) sobre el terreno muestra `ÁNG 045  POT 050` y las armas `1 OBÚS ∞   2 TRIPLE ×2   3 PERFORANTE ×1`, con la seleccionada en amarillo y las agotadas atenuadas. El campo de batalla ocupa `y = 56…600`; un proyectil que sube por encima de `y = 56` pasa por detrás del HUD y se marca con un triángulo amarillo en el borde superior a su `x`.
  - Terreno: mapa de alturas `ground[x]` para `x = 0…799` (entero, `y` de la superficie; debajo todo es tierra hasta `y = 600`). Se genera una sola vez por partida: `ground[x] = clamp(420 + 90·sin(2πx/800 + f1) + 54·sin(2πx/400 + f2) + 27·sin(2πx/170 + f3), 220, 540)` con fases `f1…f3` al azar. No se regenera nunca: los cráteres se acumulan durante todo el asedio. Se pinta en un canvas fuera de pantalla (`terrainLayer`) que se redibuja solo al abrir un cráter; la superficie lleva un trazo amarillo neón de 3 px y la tierra un degradado oscuro con rejilla tenue.
  - Tanques: el del jugador (cian) en `x` entero al azar entre 60 y 200, fijo toda la partida; cada enemigo (magenta) aparece en `x` entero al azar entre 480 y 740 con un destello de 0,5 s. Cuerpo de 28×12 px y cúpula de radio 8; cañón de 24 px desde el pivote `(x, y − 14)` (el del COLOSO, de 40×16 y cañón de 32 px). La `y` de apoyo es el mínimo de `ground` en `x − 10…x + 10` (el punto más alto bajo el tanque). Su centro de impacto es `(x, y − 8)` y su radio de impacto es 14 (22 el COLOSO). Cuando un cráter baja el terreno, el tanque cae a 240 px/s hasta su nueva `y`; la caída no hace daño. Los tanques no se mueven en horizontal.
  - Ángulo `a` en grados, 0 = derecha, 90 = arriba, 180 = izquierda, rango 0…180. Potencia `p` de 0 a 100. El proyectil sale de la punta del cañón con velocidad `6 × p` px/s en la dirección `a`, gravedad `G = 420` px/s² y aceleración horizontal del viento `6 × viento` px/s² (viento de −9 a +9; positivo empuja a la derecha). Ejemplo: a 45° y `p = 76` en llano y sin viento, el proyectil alcanza unos 495 px.
  - Controles (turno del jugador): `←`/`A` aumenta el ángulo (gira el cañón hacia la izquierda) y `→`/`D` lo reduce; `↑`/`W` sube la potencia y `↓`/`S` la baja; `Espacio` dispara; `E` rota de arma (OBÚS → TRIPLE → PERFORANTE → OBÚS) y `1`, `2`, `3` eligen arma directamente. Cada pulsación de ángulo o potencia suma o resta 1 unidad; si se mantiene más de 0,3 s, el cambio continúa a 30 unidades/s. Se dispara con los valores redondeados mostrados. Ángulo, potencia y arma se conservan de un turno a otro. Disparar un arma agotada no dispara: el contador parpadea y el reloj sigue corriendo. Fuera de su turno el jugador no puede disparar ni cambiar la mira.
  - Armas del jugador (`R` = radio del cráter, `D` = daño máximo; el daño de un tanque a distancia `d` del centro de la explosión es `round(D × (1 − d / (R + radio del tanque)))` si `d < R + radio del tanque`, y 0 si no):
    - OBÚS: infinito, `R = 36`, `D = 45`.
    - TRIPLE: tres proyectiles a la vez con ángulos `a − 5`, `a` y `a + 5` y la misma potencia, `R = 26`, `D = 30` cada uno. Cuenta como un solo disparo.
    - PERFORANTE: `R = 44`, `D = 55`. Si choca con el terreno, explota 36 px más adentro, en la dirección de su velocidad; si choca con un tanque, explota en el acto.
  - Munición: se empieza con TRIPLE ×2 y PERFORANTE ×1. Cada enemigo derribado da TRIPLE +1 (máximo 5) y, en los derribos pares (2.º, 4.º, …), PERFORANTE +1 (máximo 3).
  - Colisión: el proyectil choca con el terreno (`y ≥ ground[floor(x)]` para `0 ≤ x < 800`) o con un tanque (distancia al centro de impacto ≤ su radio, ignorando al tanque que dispara durante los primeros 0,2 s de vuelo). Si sale por `x < −40`, `x > 840` o `y > 640`, es un fallo sin cráter. Los proyectiles de un mismo disparo vuelan a la vez y el turno no termina hasta que todos se resuelven.
  - Explosión: se anima un anillo de 0,5 s. Daña a todo tanque dentro del radio, incluido el que disparó. Luego el terreno se carva: para cada `x` con `|x − cx| ≤ R`, sea `b = cy + sqrt(R² − (x − cx)²)`; si `ground[x] < b`, entonces `ground[x] = min(b, 599)`.
  - Blindaje: el jugador empieza con 100 y recupera 25 (máximo 100) al derribar a un enemigo. Cada enemigo tiene el suyo (tabla siguiente).
  - Viento: un entero al azar entre `−W` y `+W` con `W = min(9, 4 + floor(n / 2))` (`n` = número del enemigo) que se vuelve a sortear al comenzar cada turno de cualquiera de los dos bandos.
  - Reloj de turno: el jugador tiene 12,0 s para disparar; se muestra con barra y cifra y se congela con PAUSA. Al llegar a 0 se dispara automáticamente con los valores actuales (OBÚS si el arma elegida está agotada) y ese disparo no da bonus de tiempo. El reloj de la CPU no existe: su turno es `pensar` 0,9 s con `CPU APUNTA…`, giro del cañón 0,6 s y disparo.
  - Fases del turno (todas con temporizadores en pasos fijos): `apuntar` (jugador, 12 s) → `vuelo` → `explosión` (0,6 s) → `asentar` (hasta que los tanques dejan de caer) → turno del otro. Siempre empieza el jugador en cada duelo.
  - Tipos de enemigo (daño `D` y radio `R` propios; el jugador recibe `round(D × (1 − d / (R + 14)))`):

    | Enemigos | Tipo          | Blindaje | Proyectil                      | R   | D   | Elevación `e` de la CPU | Ruido de ángulo ± (°)  | Ruido de potencia ± (%) | Conoce el viento |
    | -------- | ------------- | -------- | ------------------------------ | --- | --- | ----------------------- | ---------------------- | ----------------------- | ---------------- |
    | 1–3      | ARTILLERO     | 70       | obús                           | 36  | 40  | 40–65                   | `9 − 1,5 × (n − 1)`    | `8 − 1,5 × (n − 1)`     | Desde el 2.º     |
    | 4–6      | MORTERO       | 90       | obús de arco alto              | 52  | 45  | 68–80                   | `4 − 0,5 × (n − 4)`    | `6 − 1 × (n − 4)`       | Sí               |
    | 7–9      | FRANCOTIRADOR | 80       | bala rasante                   | 28  | 55  | 20–35                   | `1,5 − 0,25 × (n − 7)` | `1,5 − 0,25 × (n − 7)`  | Sí               |
    | 10       | COLOSO        | 200      | tres proyectiles (abanico ±6°) | 30  | 30  | 40–60                   | 3                      | 3                       | Sí               |

  - IA de la CPU: planifica una vez por turno. Para una elevación al azar `e` dentro del rango de su tipo (ángulo de disparo `180 − e`, porque dispara hacia la izquierda) recorre la potencia de 20 a 100 en pasos de 0,5, simula la trayectoria con el viento que conoce (el real, o 0 si no lo conoce) y el terreno actual en pasos de 1/60 s, y se queda con la potencia cuyo impacto cae más cerca del centro de impacto del jugador. Si ninguna queda a menos de 60 px, repite con otra elevación en `[20, 70]` hasta 6 intentos y toma el mejor. Después añade ruido: `ángulo += U(−Na, Na) × k` y `potencia ×= 1 + U(−Np, Np) / 100 × k`, con `k` empezando en 1 en cada duelo; tras cada disparo suyo que no hace daño al jugador, `k = max(0,2, k × 0,6)`. El COLOSO apunta con el proyectil central y los otros dos salen a ±6°.
  - Furia: si el duelo supera los 10 turnos del jugador, el daño del enemigo se duplica en los siguientes. Evita duelos eternos.
  - Final de duelo: el enemigo cae cuando su blindaje llega a 0 y el del jugador es mayor que 0. Si el jugador llega a 0 pierde, aunque el enemigo caiga en la misma explosión. Al derribar a un enemigo hay un cartel de 1,5 s (`ENEMIGO DERRIBADO`, `+25 BLINDAJE`) y aparece el siguiente. El terreno sigue como esté.
  - Puntuación (entera, se suma al producirse cada evento para que FIN y el modal coincidan con el HUD):
    - 2 puntos por cada punto de blindaje efectivamente quitado a un enemigo (sin contar el exceso). Suma total posible de 1.840 (blindaje total de los 10 enemigos: 920).
    - Derribar al enemigo `n`: `500 + 100 × n`.
    - Bonus de tiempo al derribar: `25 × floor(segundos que quedaban en el reloj al disparar el proyectil que lo derriba)`, de 0 a 300 (0 si el disparo fue automático por reloj).
    - Bonus de eficiencia al derribar: `+300` si el duelo costó al jugador 2 disparos o menos (4 o menos contra el COLOSO). El TRIPLE cuenta como un disparo.
    - Asedio completo (derribar al COLOSO): `+2.500`, más `40 × blindaje del jugador`, más `100` por cada TRIPLE sin gastar y `150` por cada PERFORANTE sin gastar.
    - Cota teórica: `Σ(500 + 100 × n) = 10.500`, tiempo `3.000`, eficiencia `3.000`, daño `1.840`, asedio `2.500 + 4.000 + 950` → `25.790` (inalcanzable en la práctica: exige 12 s intactos en cada turno y blindaje 100).
  - Fin de partida (todos por `endGame()`): el blindaje del jugador llega a 0 (cartel `TANQUE DESTRUIDO` 1,8 s); se derriba al COLOSO (cartel `ASEDIO SUPERADO` 2,5 s); o la plataforma envía `av:end`. La puntuación ya está sumada cuando empieza el cartel, así que FIN durante el cartel envía la misma cifra del HUD.
  - Estado inicial: enemigo 1/10 (ARTILLERO), SCORE 0, blindaje del jugador 100, arma OBÚS con TRIPLE ×2 y PERFORANTE ×1, ángulo 45, potencia 50, reloj 12 s, viento al azar entre −4 y +4, terreno nuevo y turno del jugador.
  - Rendimiento: `shadowBlur` solo en los proyectiles, los tanques y la explosión; el terreno y la rejilla viven en `terrainLayer`.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s (como SPEC 09, con paso fijo en lugar de tick de celda). Todos los temporizadores (reloj de turno, pensar, giro del cañón, explosión, cartel, caída de tanques) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS`, `KeyD` y `KeyE`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con las cuatro flechas, `Space` y `KeyE`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "ASEDIO SUPERADO" con la puntuación y Espacio reinicia.
- Nueva entrada `artilleria` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de 4 flechas y dos botones, `FUEGO` (`Space`) y `ARMA` (`KeyE`).
- Portada nueva `cover-artilleria` en `app/globals.css`, diseñada con `/frontend-design`: cielo oscuro con rejilla tenue y la silueta del terreno en amarillo neón con cráteres sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con un tanque cian a la izquierda, un tanque magenta grande a la derecha, tres parábolas amarillas de un disparo triple, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_artilleria_to_games.sql` que inserta `artilleria` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Puntuación, enemigo o viento en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Multijugador (la plataforma no lo tiene).
- Mover los tanques, tienda de mejoras entre duelos y más armas.
- Terreno nuevo en cada duelo y campaña por rondas de la propuesta A.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "artilleria",
  title: "DUELO DE CAÑONES",
  short: "Calcula ángulo, potencia y viento y hunde al tanque rival.",
  long: "Asedio de artillería por turnos contra 10 tanques CPU: artilleros, morteros, francotiradores y un coloso final. Ajusta ángulo y potencia, lee el viento y elige entre obús, triple y perforante antes de que se agote el reloj de 12 segundos. Los cráteres se acumulan en el terreno y tu blindaje apenas se repone: derribar rápido y con pocos disparos puntúa más.",
  cat: "VERSUS",
  cover: "cover-artilleria",
  color: "yellow",
  src: "/games/artilleria/index.html",
  controls: {
    pad: [
      { code: "ArrowUp", dir: "up" },
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
      { code: "ArrowDown", dir: "down" },
    ],
    buttons: [
      { code: "Space", label: "FUEGO" },
      { code: "KeyE", label: "ARMA" },
    ],
  },
}
```

```sql
-- supabase/migrations/<version>_add_artilleria_to_games.sql
insert into public.games (id, title) values ('artilleria', 'DUELO DE CAÑONES');
```

```js
// public/games/artilleria/game.js — constantes y bucle (resumen; protocolo completo en SPEC 05)
const W = 800,
  H = 600,
  HUD_H = 56,
  STEP = 1 / 120;
const G = 420,
  SPEED_PER_POWER = 6,
  WIND_ACC = 6;
const ENEMIES = 10,
  TURN_CLOCK = 12,
  PLAYER_HP = 100,
  REPAIR = 25;
const WEAPONS = [
  { name: "OBÚS", R: 36, D: 45, stock: Infinity },
  { name: "TRIPLE", R: 26, D: 30, stock: 2 },
  { name: "PERFORANTE", R: 44, D: 55, stock: 1 },
];
let acc = 0,
  lastTime = null;
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50) / 1000;
  lastTime = ts;
  if (!paused && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(); // step() puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== "gameover": endGame()
// av:key     → pressKey(code, down) con KEY_OF = flechas + Space + KeyE
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida.
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera y su cota teórica es 25.790, muy por debajo de 10.000.000.
- Fin de partida: en `step()` al quedar el jugador sin blindaje o al derribar al COLOSO → `endGame()` tras el cartel. FIN de la plataforma (`av:end`) → `endGame()`. Derribar a un enemigo intermedio nunca llama a `endGame()`.
- Teclas: `←`/`A` y `→`/`D` ángulo, `↑`/`W` y `↓`/`S` potencia, `Espacio` dispara, `E` y `1`–`3` eligen arma. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores del tema (la plantilla los define en `C`, porque el iframe no ve las variables CSS): jugador cian, enemigos magenta, terreno y proyectiles amarillos, TRIPLE en verde y PERFORANTE en magenta en la franja de armas.
- El iframe lleva `title="DUELO DE CAÑONES"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` (modelo de juego creado desde cero y de acumulador de paso fijo) y `public/games/asteroids/game.js` como referencia del protocolo, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/artilleria/` desde la plantilla de `/add-game` e implementar la mecánica en este orden: terreno y `terrainLayer`, tanques con caída, física con viento, cráteres y daño; las tres armas y su munición; el reloj de turno; la IA con la tabla de tipos; la sucesión de 10 enemigos; la puntuación, el HUD y los carteles. Añadir `preventDefault` en flechas, Espacio, WASD y E, y diseñar el aspecto con `/frontend-design`. Verificación: `/games/artilleria/index.html` se juega completo (los 4 tipos de enemigo, las 3 armas, derrota y victoria), la pausa con P y el reinicio con Espacio funcionan y, al reducir la ventana, el juego se ve entero sin scroll.
2. Repasar el adaptador `av:*` de la plantilla para el bucle de paso fijo: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; `KEY_OF` con las flechas, `Space` y `KeyE`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni el overlay de pausa ni "GAME OVER". Verificación: abierto directamente sigue igual que en el paso 1; embebido, `av:gameover` llega una sola vez y el reloj de turno no avanza en pausa.
3. Añadir la entrada `artilleria` al final de `GAMES` y la portada `cover-artilleria` en `app/globals.css`. Verificación: `/games` muestra la tarjeta DUELO DE CAÑONES con el filtro VERSUS, `/juegos/artilleria` muestra el detalle y `/juegos/artilleria/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_artilleria_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_artilleria_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `artilleria`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña DUELO DE CAÑONES de `/salon`.
5. Actualizar `CLAUDE.md`: `artilleria` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que es el primer juego VERSUS, por turnos, con terreno destructible como mapa de alturas pintado en un canvas fuera de pantalla y que usa el botón táctil `ARMA` (`KeyE`). Verificación: `CLAUDE.md` lista `artilleria` en ambas secciones.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/artilleria` y `/juegos/artilleria/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta DUELO DE CAÑONES (VERSUS, yellow, portada `cover-artilleria`) y el filtro VERSUS la incluye; la portada se ve en la tarjeta y en el detalle.

**Juego embebido**

- [ ] Al entrar en `/juegos/artilleria/jugar`, las flechas, `Espacio` y `E` responden sin hacer clic antes en el juego y no hacen scroll en la página.
- [ ] El estado inicial muestra ENEMIGO 1/10 ARTILLERO, SCORE 0, blindaje 100, ángulo 45, potencia 50, reloj 12 s, armas OBÚS ∞ / TRIPLE ×2 / PERFORANTE ×1 y un viento entre −4 y +4.
- [ ] Una pulsación corta de `←` cambia el ángulo en 1 unidad; mantenida más de 0,3 s sigue cambiando a unas 30 unidades/s. Lo mismo con la potencia.
- [ ] `E` y `1`–`3` cambian el arma resaltada; elegir un arma agotada y pulsar `Espacio` no dispara y hace parpadear su contador.
- [ ] El TRIPLE lanza tres proyectiles a la vez y gasta una unidad; el PERFORANTE explota más adentro del terreno y abre un cráter mayor que el del OBÚS.
- [ ] El proyectil describe una parábola desviada por el viento hacia el lado que indica el HUD, y el viento cambia al empezar cada turno.
- [ ] El reloj baja de 12,0 a 0 durante el turno del jugador; al llegar a 0 se dispara solo con los valores actuales, y en pausa no avanza.
- [ ] Un tanque cuyo suelo desaparece cae hasta la nueva superficie sin quedar flotando ni enterrado, y los cráteres de un duelo siguen en el siguiente.
- [ ] Cada tipo se comporta como su fila de la tabla: el MORTERO dispara en arco alto, el FRANCOTIRADOR en tiro rasante y casi siempre acierta, y el COLOSO lanza tres proyectiles.
- [ ] Derribar a un enemigo suma `500 + 100 × n`, el bonus de tiempo, el de eficiencia si corresponde y 2 por punto de daño; repone 25 de blindaje (máximo 100), y TRIPLE +1 y, en derribos pares, PERFORANTE +1.
- [ ] Tras 10 turnos del jugador en un duelo, el daño del enemigo se duplica.
- [ ] Perder (blindaje del jugador a 0, también en doble muerte) muestra `TANQUE DESTRUIDO` y después el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Derribar al COLOSO muestra `ASEDIO SUPERADO`, suma el bonus final y abre el modal con la puntuación del HUD.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela el proyectil en vuelo, el reloj, la cuenta de `CPU APUNTA…` y las animaciones, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] FIN durante la partida (también durante un cartel) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja enemigo 1/10, SCORE 0, blindaje 100, munición inicial, ángulo 45, potencia 50, reloj 12 s y terreno nuevo, con el turno del jugador.
- [ ] En un dispositivo táctil, la cruceta ajusta ángulo y potencia y los botones FUEGO y ARMA disparan y cambian de arma.

**Leaderboard**

- [ ] `games` contiene la fila `artilleria` / `DUELO DE CAÑONES` y `list_migrations` muestra `add_artilleria_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'artilleria'` y la puntuación del HUD.
- [ ] La pestaña DUELO DE CAÑONES de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] El título se dibuja con la Ñ correcta en el HUD, la portada y el modal.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/artilleria/jugar` ni en `/salon`.
- [ ] Abrir `/games/artilleria/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `artilleria` es un juego real y está en `games`.

## Decisiones

- **Sí:** esta propuesta (B, asedio) es la alternativa, por decisión del agente. La recomendada es la A (`01-juego-artilleria-rondas.md`) por legibilidad y menor riesgo. B se elige si se prefiere más variedad y rejugabilidad aunque cueste más equilibrar: tres armas con munición, cuatro IA y reloj de turno.
- **Sí:** juego nuevo desde la plantilla de `/add-game`, con tema neón del Vault y HUD en el canvas, por decisión del agente.
- **Sí:** `artilleria` / `DUELO DE CAÑONES`, VERSUS, yellow y portada nueva `cover-artilleria`, por indicación de la tarea (es la sugerencia del game-planner). El único `cover-duelo` existente es de un juego simulado distinto y no se reutiliza.
- **Sí:** terreno como mapa de alturas de 800 columnas (sin voladizos ni cuevas) que no se regenera, por decisión del agente. La persistencia es la identidad de esta propuesta: lo que destruyes en un duelo te condiciona en los siguientes.
- **Sí:** el tanque del jugador fijo y sin movimiento, por decisión del agente. Mantiene el mando táctil en cruceta y dos botones y limita el esfuerzo.
- **Sí:** potencia 0–100 con `6 × p` px/s y `G = 420`, por decisión del agente. A potencia máxima el alcance a 45° (~857 px) supera el ancho del lienzo y los enemigos a 280–680 px se alcanzan con potencias de 40 a 90.
- **Sí:** viento sorteado de nuevo en cada turno, por decisión del agente. Fuerza a releerlo siempre y premia a quien calcula rápido; el reloj de 12 s lo hace tenso sin ser injusto.
- **Sí:** reloj de 12 s con disparo automático al llegar a 0, por decisión del agente. No termina la partida por inacción, y el bonus de tiempo recompensa decidir pronto.
- **Sí:** TRIPLE y PERFORANTE con munición que se gana derribando enemigos, por decisión del agente. Las armas son un recurso que se administra, no una mejora permanente.
- **Sí:** la furia (daño ×2 tras 10 turnos) en lugar de munición limitada de OBÚS, por decisión del agente. Garantiza que el duelo termina sin quitar el arma básica infinita.
- **Sí:** el blindaje del jugador no se repone entre duelos más que 25 por derribo, por decisión del agente. Hace que cada daño recibido pese en toda la partida.
- **Sí:** en una muerte doble pierde el jugador, por decisión del agente. Evita premiar un disparo suicida.
- **Sí:** la puntuación se suma al producirse cada evento y el cartel de fin llega después, por decisión del agente. FIN durante el cartel envía la cifra que ya muestra el HUD.
- **Sí:** `av:gameover` solo con `endGame()`, y el cartel de fin en modo embebido lo dibuja el juego por 1,8–2,5 s antes del modal, por decisión del agente. Es feedback de duelo, no el overlay "GAME OVER" que el protocolo desactiva.
- **No:** terreno nuevo por duelo, campaña por rondas, empate por munición. Son lo propio de la propuesta A.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                              | Mitigación                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                                          | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar; el reloj de 12 s empieza a contar con el turno, así que un primer turno sin foco solo dispara automáticamente. Hay un criterio que lo comprueba.               |
| `av:gameover` se envía dos veces en la misma partida.                                               | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'` y `endGame()` es el único punto de envío.                                                                                                          |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos o el reloj salta. | `dt` limitado a 50 ms (máximo 6 pasos de 1/120 s por frame), `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`, y el reloj solo avanza dentro de `step()`.                                                                        |
| La IA tarda demasiado al simular muchas trayectorias y el frame se congela.                         | Un barrido de 161 potencias × unos 100 pasos por intento y hasta 6 intentos, una vez por turno y durante el `pensar` de 0,9 s. Si pasara de 15 ms, el paso de simulación sube a 1/30 s.                                                     |
| El FRANCOTIRADOR es injusto (no hay cobertura y acierta casi siempre).                              | Su blindaje es 80, el tiro rasante choca con las crestas, y el jugador dispara primero. El ruido (1,5 a 1,0) es un único parámetro de ajuste.                                                                                               |
| Tras muchos cráteres el terreno queda plano y el juego pierde interés.                              | Los cráteres solo bajan el terreno hasta `y = 599` y los 10 duelos duran en torno a 50 disparos; con cráteres de 26 a 52 px la llanura total es improbable. Si hiciera falta, un spec posterior puede regenerar el terreno cada 5 enemigos. |
| El TRIPLE rompe el equilibrio por daño en área múltiple.                                            | `D = 30` y `R = 26` por proyectil, munición limitada y +1 por derribo; ajustar solo `D` o el abanico.                                                                                                                                       |
| Un proyectil atraviesa una cresta fina a gran velocidad.                                            | A 600 px/s avanza 5 px por paso de 1/120 s y el terreno se comprueba columna a columna con la `x` entera; el PERFORANTE usa el mismo punto de contacto.                                                                                     |
| La fuente "Press Start 2P" no tiene la Ñ en algún navegador.                                        | Criterio de aceptación explícito; si falta, el HUD usa `monospace` solo para ese glifo.                                                                                                                                                     |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea.               | El paso 4 aplica la migración antes de verificar el guardado.                                                                                                                                                                               |
| La puntuación supera 10.000.000.                                                                    | Cota teórica 25.790; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                                                                                                                      |
| El mando táctil no cubre toda la mira ni los atajos `1`–`3`.                                        | La cruceta mantenida cambia 30 unidades/s, y `ARMA` rota entre las tres armas; se verifica con `mobile-porte`, fuera de este spec.                                                                                                          |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Multijugador o dos jugadores en el mismo teclado.
- Movimiento de tanques, tienda de mejoras y más armas.
- Terreno nuevo en cada duelo y campaña por rondas.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
