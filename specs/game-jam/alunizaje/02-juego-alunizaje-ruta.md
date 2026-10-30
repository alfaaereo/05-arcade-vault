# SPEC JAM — Juego real ALUNIZAJE embebido y con leaderboard (propuesta B: ruta)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-30
> **Tema:** ALUNIZAJE
> **Propuesta:** B — ruta de 5 sectores con 3 saltos cada uno: aterrizar en la baliza objetivo, repostar, despegar y saltar a la siguiente, con un único módulo, un tanque global, reloj de oxígeno por salto y racha de saltos rápidos. Alternativa a `01-juego-alunizaje-misiones.md`: implementar solo una.
> **Objetivo:** Crear el juego ALUNIZAJE y hacerlo jugable en `/juegos/alunizaje/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y tres ARCADE de tablero o cuadrícula (ARKANOID, SNAKE, FROGGER). Ninguno es un juego de física: todos mueven cosas por celdas o con velocidad constante. ALUNIZAJE, sugerido por el game-planner (`alunizaje`, ARCADE · green, 2026-10-21), es un aterrizador vectorial de inercia: un módulo lunar cae por gravedad, se orienta con dos teclas, empuja con una tercera y gasta un combustible limitado.

Encaja con el tema de la jam, ALUNIZAJE, en las tres capas: la mecánica es aterrizar (y despegar) un módulo lunar, la ambientación es una luna vectorial de líneas cian sobre fondo oscuro con balizas amarillas, y los textos hablan de sectores, saltos, oxígeno y combustible. No hay código ni assets de referencia en `references/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), y todo se dibuja con trazos de canvas. Es el tercer juego verde (SNAKE y FROGGER) y el cuarto ARCADE real: es la limitación asumida de la sugerencia.

Esta propuesta es la de ruta: no se trata de aterrizar una vez, sino de encadenar quince saltos entre balizas. El módulo se queda en la baliza, repostando, y hay que despegar de nuevo hacia la siguiente baliza marcada como objetivo. Hay una sola vida, un tanque global que no se rellena entero, un reloj de oxígeno por salto y una racha que multiplica los saltos rápidos. Gana frente a la propuesta A (`01-juego-alunizaje-misiones.md`) en variedad (despegar, planificar la ruta y gestionar un recurso entre saltos), en tensión y en techo de habilidad; pierde en legibilidad (más cosas en el HUD), en tolerancia al error (un choque termina la partida) y en riesgo técnico (estado en reposo sobre la baliza, reloj, racha y repostaje que equilibrar).

En cuanto `alunizaje` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/alunizaje/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>ALUNIZAJE — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600 en vista lateral. Franja de HUD de 44 px arriba: `SCORE` cian a la izquierda, `SECTOR n/5 · SALTO h/3` amarillo al centro y `RACHA ×k` magenta a la derecha. Debajo, a la izquierda (x 14…226, y 52…172), un panel de instrumentos semitransparente (alfa 0,55): barra de combustible de 160×12 px (verde; amarilla por debajo de 40 % del tanque de 700; magenta parpadeante por debajo de 20 %), `OXÍGENO` con los segundos que quedan del salto (magenta parpadeante por debajo de 8 s), `V.VERT`, `V.HORIZ` y `ÁNGULO`, estos tres en verde si están dentro del límite de aterrizaje, amarillo hasta el doble y magenta por encima. Si hay viento, un indicador `VIENTO ◂ 10` o `VIENTO ▸ 10` bajo el panel. El módulo se dibuja por encima del panel.
  - Módulo lunar: cuerpo octogonal verde neón de unos 24×22 px con dos patas y llama de empuje amarilla y magenta. Puntos de colisión relativos al centro, con `x` a la derecha e `y` hacia abajo, rotados por el ángulo: pie izquierdo `(−13, +16)`, pie derecho `(+13, +16)`, hombros `(−11, −12)` y `(+11, −12)`, antena `(0, −18)`.
  - Terreno: altura por columna cada 20 px (41 puntos de `x = 0` a `x = 800`), interpolada linealmente; `y` entre 340 y 560. Se genera con una semilla fija por sector (`mulberry32(0xB20 + 7919 × sector)`): paseo aleatorio con paso máximo de `±amp/2` por celda, recortado a 340…560, con `amp` 40, 60, 80, 100 y 115 para los sectores 1…5. El terreno de un sector es siempre el mismo en todas las partidas. Se pinta una vez en un canvas fuera de pantalla (cielo con estrellas fijas, relleno oscuro y contorno cian con brillo) al empezar el sector.
  - Balizas: 4 por sector, planas, una por banda (40…200, 220…400, 420…600, 620…780), con tipos barajados por la semilla: dos ANCHAS (×1), una MEDIA (×2) y una ESTRECHA (×4). Anchura en celdas de 20 px por sector 1…5: ancha `6, 6, 5, 5, 5`; media `4, 4, 3, 3, 3`; estrecha `3, 3, 3, 2, 2` (de 120 a 40 px). Cada baliza se rotula con su `×n` en amarillo; la baliza objetivo parpadea en magenta con la flecha `OBJETIVO ▼` encima. Entre balizas el terreno es irregular.
  - Objetivos: cada sector tiene 3 saltos. El objetivo del salto lo fija la semilla del sector entre las balizas distintas de la que se acaba de pisar. En el primer salto de un sector el módulo cae desde `x = 400`, `y = 80`, `vx = 0`, ángulo 0; en los otros dos despega de la baliza anterior.
  - Estado inicial de partida: sector 1, salto 1, SCORE 0, tanque de 700, racha ×1, reloj del salto lleno, módulo en el aire y el texto "PULSA UNA FLECHA". Nada se mueve (ni cae) hasta la primera tecla de juego.
  - Controles: `←`/`A` giran en sentido antihorario y `→`/`D` en horario a 150 °/s; `↑`/`W`/`Espacio` empujan. El empuje es todo o nada, en la dirección del módulo. Ángulo normalizado a −180…180. Posado en una baliza el módulo no gira (ángulo 0) y cualquier empuje lo despega.
  - Física con pasos fijos: `ax = T·sin(a) + viento`, `ay = g − T·cos(a)` (px/s², `y` hacia abajo), integración de Euler semi-implícita. Gravedad `g = 45 + 9 × (sector − 1)` (45, 54, 63, 72, 81) y empuje `T = g + 90` (135, 144, 153, 162, 171). Con el empuje activo se gastan 40 unidades de combustible por segundo (el tanque de 700 da 17,5 s de empuje en total); sin combustible el empuje deja de actuar (los giros no gastan). Viento 0, 0, 6, 10 y 14 px/s² en los sectores 1…5 (signo fijado por la semilla).
  - Aterrizaje seguro: en el primer contacto de cualquier punto de colisión con el terreno, se aterriza si y solo si el punto es un pie, ambos pies están dentro del tramo plano de una baliza, `|ángulo| ≤ 10°`, `vy ≤ 45` px/s y `|vx| ≤ 30` px/s. Cualquier otro contacto (cuerpo, antena, pendiente, baliza demasiado rápido, inclinado o con un pie fuera) es un choque. Al aterrizar, el módulo se posa sobre la superficie con ángulo 0.
  - Aterrizar con seguridad en una baliza que no es el objetivo no puntúa ni repostan: sirve de descanso (el reloj está parado mientras el módulo está posado) y se puede despegar de nuevo.
  - Salto cumplido (aterrizaje seguro en el objetivo): se puntúa, se repostan `100 + 20 × sector` unidades de combustible (120…180, hasta el máximo de 700), el reloj se rellena, se marca el siguiente objetivo y un panel "SALTO CUMPLIDO" con el desglose se muestra 1,5 s sin bloquear los controles.
  - Reloj de oxígeno: 40 s por salto en los sectores 1…3 y 35 s en los sectores 4 y 5. Corre solo mientras el módulo vuela; se para posado. Al llegar a 0, "SIN OXÍGENO" y `endGame('time')` tras 1,2 s.
  - Racha: `k = min(4, 1 + saltos seguidos cumplidos con al menos la mitad del reloj sin gastar)`. Un salto cumplido por debajo de la mitad del reloj pone la racha a ×1; un salto cumplido con la mitad o más la sube. La racha se conserva entre sectores.
  - Puntuación por salto cumplido: `(400 × sector × multiplicador de la baliza + 10 × sector × floor(segundos de reloj restantes)) × k`, donde `k` es la racha antes de incorporar este salto (el primero de la ruta vale ×1).
  - Fin de sector: tras el 3.er salto de los sectores 1…4, el panel "SECTOR COMPLETADO" se muestra 2,5 s y empieza el sector siguiente (nuevo terreno, módulo en el aire, tanque y racha conservados) a la espera de la primera tecla.
  - Final feliz: tras el 3.er salto del sector 5, el panel "RUTA COMPLETA" se muestra 2,5 s con un bonus de `10 × floor(combustible restante)` y entonces `endGame('win')`.
  - Choque: explosión de partículas 1,2 s (estado `crashed`) y `endGame('crash')`. No hay módulos de repuesto.
  - Fuera de rango: `x < −20`, `x > 820` o `y < −80` cuentan como choque ("FUERA DE ZONA"). Una flecha amarilla indica la posición cuando el módulo está por encima del lienzo.
  - Sin combustible: si el módulo está posado con el tanque a 0, `endGame('fuel')` tras 1,0 s con "SIN COMBUSTIBLE". En vuelo sin combustible el módulo cae y se estrella (o aterriza si cumple los límites).
  - Fin de partida (todos por `endGame()`): choque, oxígeno agotado, combustible agotado en reposo, ruta completa o FIN de la plataforma.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s, como SPEC 09 (en pasos fijos). A unos 400 px/s cada paso mueve unos 3,3 px, así que no hay túneles. Todos los temporizadores (reloj, paneles, explosión, parpadeos) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "RUTA COMPLETA" con la puntuación y Espacio reinicia.
- Nueva entrada `alunizaje` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta con `ArrowLeft`, `ArrowUp` y `ArrowRight`, y sin botones.
- Portada nueva `cover-alunizaje` en `app/globals.css`, diseñada con `/frontend-design`: rejilla oscura con estrellas y un contorno lunar cian con dos balizas amarillas, una parpadeando en magenta, sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con el módulo verde despegando con su llama, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_alunizaje_to_games.sql` que inserta `alunizaje` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Controles táctiles más allá de la declaración `controls` (la cruceta ya cubre giro y empuje).
- Puntuación, combustible o sector en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Terreno generado al azar en cada partida, empuje proporcional, zoom de cámara, scroll y meteoritos.
- Vidas, módulos de repuesto y campaña con tanque por zona (propuesta A).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "alunizaje",
  title: "ALUNIZAJE",
  short: "Salta de baliza en baliza con un solo módulo y poco oxígeno.",
  long: "Gira con ← → (o A y D) y empuja con ↑, W o Espacio. Aterriza en la baliza que parpadea, reposta, despega y salta a la siguiente: son 15 saltos en 5 sectores lunares. Las balizas estrechas pagan hasta ×4, el oxígeno de cada salto es limitado, el tanque no se rellena entero y encadenar saltos rápidos multiplica los puntos hasta ×4. Un solo choque y se acabó.",
  cat: "ARCADE",
  cover: "cover-alunizaje",
  color: "green",
  src: "/games/alunizaje/index.html",
  controls: {
    pad: [
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowUp", dir: "up" },
      { code: "ArrowRight", dir: "right" },
    ],
    buttons: [],
  },
}
```

```sql
-- supabase/migrations/<version>_add_alunizaje_to_games.sql
insert into public.games (id, title) values ('alunizaje', 'ALUNIZAJE');
```

```js
// public/games/alunizaje/game.js — constantes, bucle y modo embebido (resumen; protocolo completo en SPEC 05)
const CELL = 20,
  COLS = 41,
  TERRAIN_MIN = 340,
  TERRAIN_MAX = 560;
const STEP = 1000 / 120; // paso fijo de simulación en ms
const TUNING = {
  sectors: 5,
  hops: 3,
  tank: 700,
  burn: 40, // combustible por segundo de empuje
  rot: 150, // grados por segundo
  gravity: [45, 54, 63, 72, 81],
  wind: [0, 0, 6, 10, 14],
  amp: [40, 60, 80, 100, 115],
  clock: [40, 40, 40, 35, 35], // segundos de oxígeno por salto
  padCells: { 1: [6, 6, 5, 5, 5], 2: [4, 4, 3, 3, 3], 4: [3, 3, 3, 2, 2] },
  safe: { vy: 45, vx: 30, ang: 10 },
  maxStreak: 4,
};
const thrust = () => gravity() + 90; // px/s²
const refuel = () => 100 + 20 * sector;
const hopScore = (mult) =>
  (400 * sector * mult + 10 * sector * Math.floor(clockLeft)) * streak;
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // física, contacto, reloj, puntuación; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla del sector) | 'flying' | 'landed' (posado; el reloj parado) | 'crashed' (1,2 s) | 'timeout' (1,2 s) | 'sector' (2,5 s) | 'won' (2,5 s) | 'gameover'
// endGame(reason) — 'crash' | 'time' | 'fuel' | 'win' | 'end'; 'win' suma 10 × floor(combustible) al entrar en 'won'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: por salto, con baliza ×4 y el reloj entero (cota inalcanzable), `(1.600 × s + 400 × s) × k = 2.000 × s × k`; las rachas de los 15 saltos suman `1+2+3` en el sector 1 y `4+4+4` en cada uno de los otros cuatro, de modo que el total es `2.000 × (1×6 + 2×12 + 3×12 + 4×12 + 5×12) = 348.000`; más el bonus de ruta completa con el tanque entero (`10 × 700 = 7.000`): 355.000, muy por debajo de 10.000.000.
- Fin de partida: choque → `endGame('crash')` al acabar la explosión de 1,2 s; reloj a 0 → `endGame('time')` tras 1,2 s; posado sin combustible → `endGame('fuel')` tras 1,0 s; 3.er salto del sector 5 → bonus y, al acabar los 2,5 s de "RUTA COMPLETA", `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada.
- Teclas: `←`/`A` y `→`/`D` giran; `↑`/`W`/`Espacio` empujan. `P` pausa y `Espacio` reinicia solo abierto directamente (en modo embebido `Espacio` solo empuja).
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS): módulo en verde, terreno y HUD de puntuación en cian, balizas y multiplicadores en amarillo, objetivo y racha en magenta, llama en amarillo y magenta.
- El iframe lleva `title="ALUNIZAJE"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado (gravedad, tanque, repostaje, reloj, racha, anchos) viven en el objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/alunizaje/` desde la plantilla de `/add-game`. Implementar el generador de terreno con semilla y su capa fuera de pantalla, las 4 balizas por sector con sus tipos, el módulo con giro y empuje, la física de pasos fijos de 1/120 s, el tanque global, el HUD y los instrumentos. Verificación: `/games/alunizaje/index.html` espera quieto con "PULSA UNA FLECHA", la primera tecla lo pone en marcha, el módulo cae y se controla con `↑`/`←`/`→`, el tanque de 700 baja 40 por segundo de empuje y el terreno del sector 1 es idéntico al recargar. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir el contacto con el terreno y la regla de aterrizaje seguro, el estado posado y el despegue, los objetivos por salto con la baliza parpadeante, el repostaje, el reloj de oxígeno, la racha, la puntuación por salto, el cambio de sector, la ruta completa y los finales con `endGame()` (choque, oxígeno, combustible en reposo, ruta). Verificación: abierto directamente, un aterrizaje en el objetivo suma `(400 × sector × ×n + 10 × sector × segundos) × k`, reposta `100 + 20 × sector`, marca otro objetivo y permite despegar; un aterrizaje en otra baliza no puntúa; un choque, el oxígeno a 0 o posarse sin combustible muestran "GAME OVER" y Espacio reinicia desde el sector 1.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no pausan ni reinician y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con las flechas y `Space`. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `alunizaje` (con `controls`) al final de `GAMES` y la portada `cover-alunizaje` en `app/globals.css`. Verificación: `/games` muestra la tarjeta ALUNIZAJE con su portada, `/juegos/alunizaje` muestra el detalle con la misma portada y `/juegos/alunizaje/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_alunizaje_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_alunizaje_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `alunizaje`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña ALUNIZAJE de `/salon`.
6. Actualizar `CLAUDE.md`: `alunizaje` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de física usa pasos fijos de 1/120 s sobre rAF, un terreno con semilla fija en una capa fuera de pantalla y un estado de reposo en el que el reloj se detiene. Verificación: las dos secciones nombran `alunizaje`.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/alunizaje` y `/juegos/alunizaje/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta ALUNIZAJE (ARCADE, green, portada `cover-alunizaje`) y el filtro ARCADE la incluye.
- [ ] `cover-alunizaje` se ve igual de bien en la tarjeta y en el detalle (las capas de `background-image` son válidas).

**Juego embebido**

- [ ] Al entrar en `/juegos/alunizaje/jugar`, el módulo espera quieto en el aire con "PULSA UNA FLECHA" y la primera flecha, WASD o Espacio lo pone en marcha sin hacer clic antes en el juego.
- [ ] Las flechas, WASD y Espacio no hacen scroll en la página.
- [ ] `←`/`→` giran el módulo a 150 °/s, `↑`/`W`/`Espacio` empujan en la dirección en que apunta, y sin combustible el empuje no actúa pero los giros sí.
- [ ] El combustible baja 40 por segundo de empuje y el tanque inicial de 700 da 17,5 s de empuje total.
- [ ] Cada sector muestra 4 balizas con `×1`, `×1`, `×2` y `×4`, con los anchos de la tabla, y una de ellas parpadea en magenta con `OBJETIVO ▼`.
- [ ] Un aterrizaje seguro en el objetivo muestra "SALTO CUMPLIDO" 1,5 s con `(400 × sector × multiplicador + 10 × sector × segundos restantes) × k`, suma `100 + 20 × sector` al combustible (máximo 700), rellena el reloj y marca otro objetivo sin bloquear los controles.
- [ ] Un aterrizaje seguro en una baliza que no es el objetivo no puntúa ni repostan, deja el reloj parado y permite despegar.
- [ ] Desde una baliza, cualquier empuje despega el módulo, y posado no gira.
- [ ] El reloj de oxígeno corre solo en vuelo (40 s en los sectores 1–3, 35 s en 4–5), parpadea por debajo de 8 s y a 0 muestra "SIN OXÍGENO" y termina la partida tras 1,2 s.
- [ ] La racha pasa de ×1 a ×4 con saltos cumplidos con la mitad o más del reloj, vuelve a ×1 con un salto lento y se conserva entre sectores.
- [ ] Tocar una pendiente, el cuerpo o una baliza fuera de los límites (`vy > 45`, `|vx| > 30`, inclinación > 10° o un pie fuera) provoca un choque con explosión de 1,2 s y el final de la partida.
- [ ] Salir por los lados o por arriba del lienzo cuenta como choque, y una flecha amarilla indica al módulo cuando está por encima del lienzo.
- [ ] Posado con el tanque a 0, la partida termina tras 1,0 s con "SIN COMBUSTIBLE".
- [ ] Tras el 3.er salto de un sector (1–4), "SECTOR COMPLETADO" se muestra 2,5 s y empieza el siguiente con otro terreno, el tanque y la racha conservados y el módulo a la espera de la primera tecla.
- [ ] Los sectores 3 a 5 muestran viento que desvía el módulo, y la gravedad sube por sector (45, 54, 63, 72, 81).
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] PAUSA congela el módulo, el reloj, la explosión y todos los temporizadores, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos de posición, de velocidad ni de reloj.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego (`Espacio` solo empuja).
- [ ] Al chocar aparece, tras 1,2 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al completar el 3.er salto del sector 5 se muestra "RUTA COMPLETA" 2,5 s y el modal trae la puntuación del HUD con el bonus de 10 por unidad de combustible incluido.
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el módulo quieto en el sector 1, salto 1, con "PULSA UNA FLECHA", SCORE 0, tanque de 700, racha ×1 y el reloj lleno.

**Leaderboard**

- [ ] `games` contiene la fila `alunizaje` / `ALUNIZAJE` y `list_migrations` muestra `add_alunizaje_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'alunizaje'` y la puntuación del HUD.
- [ ] La pestaña ALUNIZAJE de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/alunizaje/jugar` ni en `/salon`.
- [ ] Abrir `/games/alunizaje/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "RUTA COMPLETA" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) con el terreno prerenderizado y la explosión en marcha.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `alunizaje` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta B (ruta) como alternativa, no recomendada, por decisión del agente. Ofrece más variedad (despegar, planificar, gestionar el tanque y el reloj) y más techo de habilidad, pero un solo choque termina la partida y requiere más equilibrado; por eso se recomienda la A (`01-juego-alunizaje-misiones.md`).
- **Sí:** id `alunizaje` y título `ALUNIZAJE`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/alunizaje/` ni el id en `GAMES`.
- **Sí:** ARCADE y green, tal como los fija la sugerencia. ARCADE tendría su cuarto juego real y verde su tercero; PUZZLE, SHOOTER y VERSUS siguen sin equilibrar, limitación asumida de la sugerencia.
- **Sí:** un solo módulo, sin vidas, por decisión del agente. Cada salto cuenta y la puntuación separa a quien llega al sector 5 de quien no.
- **Sí:** tanque global de 700 con repostaje de `100 + 20 × sector` por salto cumplido, por decisión del agente. El gasto por salto ronda 100–200 unidades, así que el repostaje compensa solo a quien vuela con eficiencia; el equilibrado fino queda en `TUNING`.
- **Sí:** el reloj corre solo en vuelo y se para posado, por decisión del agente. Evita penalizar el descanso y hace del reloj una presión sobre el vuelo, no sobre el tiempo de lectura.
- **Sí:** la racha cuenta saltos con la mitad o más del reloj y llega a ×4, por decisión del agente. Premia la rapidez sin obligar a la imprudencia (aterrizar a ciegas termina la partida).
- **Sí:** balizas ×1/×1/×2/×4 y objetivo marcado, por decisión del agente. El objetivo da la ruta, y la baliza estrecha es la apuesta de riesgo.
- **Sí:** terreno con semilla fija por sector, por decisión del agente. Todos los jugadores se enfrentan al mismo paisaje.
- **Sí:** empuje todo o nada con `T = g + 90` y límites de aterrizaje de 45 px/s, 30 px/s y 10°, por decisión del agente. Con teclado no hay empuje analógico, y el neto constante mantiene el tacto parecido en los cinco sectores.
- **Sí:** el jugador espera a la primera tecla en cada sector, por decisión del agente. Evita estrellarse antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. La física queda independiente de los fotogramas y el contacto no atraviesa el terreno.
- **No:** vidas, sonido, skins, scroll, zoom, meteoritos y terreno aleatorio, por decisión del agente. Mantienen el esfuerzo en M. Las vidas y el tanque por zona son la identidad de la propuesta A.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` (como reinicio) y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. Los paneles de salto, sector y ruta sí se dibujan, porque forman parte de la partida.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el módulo espera a la primera tecla. Hay un criterio.             |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                        |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                            |
| El reloj de oxígeno sigue corriendo durante la pausa o posado.                        | Avanza solo dentro de `step()` y solo en estado `flying`; la pausa no ejecuta `step()`.                                                          |
| El tanque global hace la ruta imposible o trivial.                                    | Cifras en `TUNING` (700, 100 + 20 × sector, 40 por segundo) y criterios que fijan el repostaje; se ajusta jugando antes de cerrar.               |
| Un objetivo inalcanzable con el combustible que queda deja la partida sin salida.     | El estado posado sin combustible termina la partida (`endGame('fuel')`); no hay estados bloqueados.                                              |
| El estado posado y el despegue generan errores (el módulo se hunde o rebota).         | Al posarse se fijan `y`, `vx`, `vy` y ángulo; el contacto solo se evalúa en vuelo y en el primer paso tras despegar se ignora la baliza.         |
| El módulo atraviesa el terreno a alta velocidad.                                      | Pasos de 1/120 s: unos 3,3 px por paso a 400 px/s, con interpolación lineal del terreno y puntos de colisión separados 13 px o más.              |
| Aterrizaje en el borde de una baliza injusto por un pie fuera.                        | Se exige que ambos pies estén sobre el tramo plano, con baliza mínima de 40 px frente a 26 px de separación entre pies; los instrumentos avisan. |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 5 aplica la migración antes de verificar el guardado.                                                                                    |
| La puntuación supera 10.000.000.                                                      | Máximo teórico de 355.000; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                     |
| `shadowBlur` en cada fotograma baja los FPS en equipos modestos.                      | El terreno y el cielo se pintan una vez en un canvas fuera de pantalla; brillo solo en módulo, llama, objetivo y rótulos.                        |
| A 375px de ancho el panel de instrumentos (más grande que en A) tapa demasiado.       | Valores a 12–14 px, etiquetas a 10 px y alfa 0,55; hay un criterio a 375px.                                                                      |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Terreno aleatorio, empuje proporcional, zoom, scroll y meteoritos.
- Vidas, módulos de repuesto y tanque por zona (propuesta A).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
