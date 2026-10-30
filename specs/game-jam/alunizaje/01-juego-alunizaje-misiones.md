# SPEC JAM — Juego real ALUNIZAJE embebido y con leaderboard (propuesta A: misiones)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-30
> **Tema:** ALUNIZAJE
> **Propuesta:** A — campaña de 6 zonas lunares con terreno fijo por zona, 3 módulos de vida, tanque propio por zona, balizas de aterrizaje ×2/×3/×5 y viento desde la zona 4. Alternativa a `02-juego-alunizaje-ruta.md`: implementar solo una.
> **Objetivo:** Crear el juego ALUNIZAJE y hacerlo jugable en `/juegos/alunizaje/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y tres ARCADE de tablero o cuadrícula (ARKANOID, SNAKE, FROGGER). Ninguno es un juego de física: todos mueven cosas por celdas o con velocidad constante. ALUNIZAJE, sugerido por el game-planner (`alunizaje`, ARCADE · green, 2026-10-21), es un aterrizador vectorial de inercia: un módulo lunar cae por gravedad, se orienta con dos teclas, empuja con una tercera y gasta un combustible que no alcanza para todo. Aquí la dificultad no viene de enemigos sino de leer la velocidad y la inclinación y decidir cuándo frenar.

Encaja con el tema de la jam, ALUNIZAJE, en las tres capas: la mecánica es aterrizar un módulo lunar, la ambientación es una luna vectorial de líneas cian sobre fondo oscuro con balizas amarillas, y los textos hablan de zonas, balizas, módulos y combustible. No hay código ni assets de referencia que reutilizar en `references/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), y todo se dibuja con trazos de canvas. Es el tercer juego verde (SNAKE y FROGGER) y el cuarto ARCADE real: es la limitación asumida de la sugerencia.

Esta propuesta es la de misiones: seis zonas con terreno fijo y reconocible (todos los jugadores aterrizan en el mismo paisaje, así que el Salón compara habilidad y no suerte), tres módulos de vida, tanque que se rellena en cada zona y una decisión de riesgo constante: la baliza ×5 es la más estrecha. Gana frente a la propuesta B (`02-juego-alunizaje-ruta.md`) en legibilidad (un objetivo por pantalla, sin reloj), en curva de aprendizaje y en menor riesgo técnico, y pierde en variedad por partida (siempre aterrizar, nunca despegar) y en tensión continua, porque B tiene reloj de oxígeno, tanque único y despegues.

En cuanto `alunizaje` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/alunizaje/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>ALUNIZAJE — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600 en vista lateral. Franja de HUD de 44 px arriba (`SCORE` cian a la izquierda, `ZONA n/6` amarillo al centro, un icono de módulo verde por módulo restante a la derecha). Debajo, a la izquierda (x 14…226, y 52…148), un panel de instrumentos semitransparente (alfa 0,55): barra de combustible de 160×12 px (verde; amarilla por debajo de 40 % del tanque; magenta parpadeante por debajo de 20 %), `V.VERT`, `V.HORIZ` y `ÁNGULO`, cada uno en verde si está dentro del límite de aterrizaje, amarillo hasta el doble del límite y magenta por encima. Si hay viento, un indicador `VIENTO ◂ 10` o `VIENTO ▸ 10` bajo el panel. El módulo se dibuja por encima del panel.
  - Módulo lunar: cuerpo octogonal verde neón de unos 24×22 px con dos patas y llama de empuje amarilla y magenta. Puntos de colisión relativos al centro, con `x` a la derecha e `y` hacia abajo, rotados por el ángulo: pie izquierdo `(−13, +16)`, pie derecho `(+13, +16)`, hombros `(−11, −12)` y `(+11, −12)`, antena `(0, −18)`.
  - Terreno: altura por columna cada 20 px (41 puntos de `x = 0` a `x = 800`), interpolada linealmente; `y` entre 340 y 560. Se genera con una semilla fija por zona (`mulberry32(0xA10 + 7919 × zona)`): paseo aleatorio con paso máximo de `±amp/2` por celda, con `amp` según la tabla de dificultad, recortado a 340…560. El terreno de cada zona es siempre el mismo (también al reintentar y en cada partida). Se pinta una vez en un canvas fuera de pantalla (cielo con estrellas fijas, relleno oscuro y contorno cian con brillo) al empezar la zona; el brillo no se recalcula por fotograma.
  - Balizas: 3 por zona con multiplicadores ×2, ×3 y ×5, planas, rotuladas con su `×n` en amarillo encima. Cada una ocupa una de tres bandas (40…280, 300…520, 540…760) en orden barajado por la semilla de la zona, alineada a la rejilla de 20 px y con su `y` igual a la del terreno en su primera celda. Ancho en celdas de 20 px por zona 1…6: ×2 `5, 5, 4, 4, 3, 3`; ×3 `4, 4, 3, 3, 2, 2`; ×5 `3, 3, 2, 2, 2, 2` (de 100 a 40 px). Entre baliza y baliza el terreno es irregular.
  - Estado inicial de partida: zona 1, SCORE 0, 3 módulos, tanque de la zona, módulo en el aire en `y = 80` mirando arriba (ángulo 0), `x` de partida en 120…680 y signo de `vx` fijados por la semilla de la zona, y el texto "PULSA UNA FLECHA". Nada se mueve (ni cae) hasta la primera tecla de juego; al pulsarla, el módulo adquiere `vx = ±(30 + 10 × (zona − 1))` px/s y empieza a caer.
  - Controles: `←`/`A` giran en sentido antihorario y `→`/`D` en horario a 150 °/s; `↑`/`W`/`Espacio` empujan. El empuje es todo o nada, en la dirección del módulo. Ángulo normalizado a −180…180.
  - Física con pasos fijos: `ax = T·sin(a) + viento`, `ay = g − T·cos(a)` (px/s², `y` hacia abajo), integración de Euler semi-implícita. Empuje `T = 140 + 8 × (zona − 1)` (g + 90 en cada zona: siempre 90 px/s² netos). Con el empuje activo se gastan 40 unidades de combustible por segundo; sin combustible el empuje deja de actuar (los giros no gastan).
  - Tabla de dificultad por zona 1…6: gravedad `g` 50, 58, 66, 74, 82, 90; tanque 320, 300, 280, 260, 240, 220 (de 8 s a 5,5 s de empuje continuo); viento 0, 0, 0, 6, 10, 14 px/s² (signo fijado por la semilla); amplitud del terreno `amp` 40, 55, 70, 85, 100, 115.
  - Aterrizaje seguro: en el primer contacto de cualquier punto de colisión con el terreno, se aterriza si y solo si el punto es un pie, ambos pies están dentro del tramo plano de una baliza (`x0 ≤ xPie ≤ x1`), `|ángulo| ≤ 10°`, `vy ≤ 45` px/s y `|vx| ≤ 30` px/s. Cualquier otro contacto (cuerpo, antena, pendiente, baliza demasiado rápido, inclinado o con un pie fuera) es un choque. Al aterrizar, el módulo se posa sobre la superficie y el ángulo queda en 0.
  - Fuera de rango: `x < −20`, `x > 820` o `y < −80` cuentan como choque ("FUERA DE ZONA"). Una flecha amarilla indica la posición cuando el módulo está por encima del lienzo.
  - Puntuación por aterrizaje: `(400 + 100 × zona) × multiplicador de la baliza`, más `floor(combustible restante) × zona`, más 500 de "TOQUE PERFECTO" si además `vy ≤ 20`, `|vx| ≤ 10` y `|ángulo| ≤ 3°`. Un panel "ALUNIZAJE" muestra el desglose 2,0 s (estado `landed`); luego empieza la zona siguiente, de nuevo a la espera de la primera tecla.
  - Choque: explosión de partículas 1,4 s (estado `crashed`), se pierde un módulo y la misma zona se reintenta con el mismo terreno, el tanque lleno y SCORE conservado. Al perder el tercer módulo, `endGame('crash')`.
  - Final feliz: tras aterrizar en la zona 6, el panel muestra "MISIÓN CUMPLIDA" 2,5 s con un bonus de 2.000 por módulo restante (incluido el que está en uso) y entonces `endGame('win')`.
  - Fin de partida (todos por `endGame()`): tercer choque, misión cumplida o FIN de la plataforma. No hay reloj ni final por quedarse sin combustible: sin empuje el módulo cae y se estrella.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s, como SPEC 09 (en pasos fijos). A la velocidad máxima razonable (unos 400 px/s) cada paso mueve unos 3,3 px, menos que el grosor útil del terreno, así que no hay túneles. Todos los temporizadores (panel de aterrizaje, explosión, parpadeos) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "MISIÓN CUMPLIDA" con la puntuación y Espacio reinicia.
- Nueva entrada `alunizaje` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta con `ArrowLeft`, `ArrowUp` y `ArrowRight`, y sin botones.
- Portada nueva `cover-alunizaje` en `app/globals.css`, diseñada con `/frontend-design`: rejilla oscura con estrellas y un contorno lunar cian con una baliza amarilla sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con el módulo verde y su llama sobre la baliza, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_alunizaje_to_games.sql` que inserta `alunizaje` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Controles táctiles más allá de la declaración `controls` (la cruceta ya cubre giro y empuje).
- Puntuación, combustible o zona en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Terreno generado al azar en cada partida, empuje proporcional, zoom de cámara, scroll y rocas o meteoritos.
- Despegue, tanque único, reloj de oxígeno y racha de saltos (propuesta B).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "alunizaje",
  title: "ALUNIZAJE",
  short: "Posa el módulo lunar sin estrellarte y sin gastar el combustible.",
  long: "Gira con ← → (o A y D) y empuja con ↑, W o Espacio para posar tu módulo en las balizas de seis zonas lunares. Para aterrizar tienes que ir despacio, derecho y con los dos pies sobre la baliza: las estrechas pagan hasta ×5. El combustible es limitado, el viento aprieta desde la zona 4 y tienes tres módulos.",
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
  zones: 6,
  modules: 3,
  gravity: [50, 58, 66, 74, 82, 90],
  tank: [320, 300, 280, 260, 240, 220],
  wind: [0, 0, 0, 6, 10, 14],
  amp: [40, 55, 70, 85, 100, 115],
  padCells: {
    2: [5, 5, 4, 4, 3, 3],
    3: [4, 4, 3, 3, 2, 2],
    5: [3, 3, 2, 2, 2, 2],
  },
  burn: 40, // combustible por segundo de empuje
  rot: 150, // grados por segundo
  safe: { vy: 45, vx: 30, ang: 10 },
  perfect: { vy: 20, vx: 10, ang: 3 },
};
const thrust = () => 140 + 8 * (zone - 1); // px/s², g + 90
const landScore = (mult) => (400 + 100 * zone) * mult + Math.floor(fuel) * zone;
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  if (!paused && state !== "ready" && state !== "gameover") {
    acc += dt;
    while (acc >= STEP && state !== "gameover") {
      acc -= STEP;
      step(STEP / 1000); // física, contacto, puntuación; puede llamar a endGame()
    }
  }
  draw();
  requestAnimationFrame(loop);
}
// estados: 'ready' (espera la 1.ª tecla) | 'flying' | 'landed' (2,0 s) | 'crashed' (1,4 s) | 'won' (2,5 s) | 'gameover'
// endGame(reason) — 'crash' | 'win' | 'end'; 'win' suma 2000 × módulos restantes al entrar en 'won'
// av:pause   → paused = true
// av:resume  → paused = false; lastTime = null; acc = 0; clearKeys()
// av:restart → initGame(); lastTime = null; acc = 0; clearKeys()
// av:end     → si state !== 'gameover': endGame('end')
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida (bandera `gameOverSent`, a `false` en `initGame()`).
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Máximo teórico: aterrizajes en la baliza ×5 de las 6 zonas, `(500 + 600 + 700 + 800 + 900 + 1.000) × 5 = 22.500`; combustible sobrante, como mucho el tanque entero por zona (cota inalcanzable), `320×1 + 300×2 + 280×3 + 260×4 + 240×5 + 220×6 = 5.320`; toque perfecto en las 6, `3.000`; y el bonus de misión cumplida con los 3 módulos, `6.000`. Total 36.820, muy por debajo de 10.000.000.
- Fin de partida: al perder el tercer módulo → `endGame('crash')` al acabar la explosión de 1,4 s; aterrizar en la zona 6 → bonus y, al acabar los 2,5 s de "MISIÓN CUMPLIDA", `endGame('win')`. FIN de la plataforma (`av:end`) → `endGame('end')` en cualquier estado salvo `gameover`, con la puntuación ya acumulada.
- Teclas: `←`/`A` y `→`/`D` giran; `↑`/`W`/`Espacio` empujan. `P` pausa y `Espacio` reinicia solo abierto directamente (en modo embebido `Espacio` solo empuja).
- Colores en el objeto `C` de la plantilla (el iframe no ve las variables CSS): módulo en verde, terreno y HUD de puntuación en cian, balizas y multiplicadores en amarillo, llama en amarillo y magenta, peligro en magenta.
- El iframe lleva `title="ALUNIZAJE"` (lo pone `EmbeddedGamePlayer` desde `game.title`).
- Todas las cifras de equilibrado viven en el objeto `TUNING` al principio de `game.js` para ajustarlas sin tocar la lógica.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` y `public/games/snake/game.js` como referencia del protocolo y del acumulador, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego y de la portada, como indica `CLAUDE.md`.

1. Crear `public/games/alunizaje/` desde la plantilla de `/add-game`. Implementar el generador de terreno con semilla, su capa fuera de pantalla, las balizas, el módulo con giro y empuje, la física de pasos fijos de 1/120 s, el combustible, el HUD y los instrumentos. Verificación: `/games/alunizaje/index.html` espera quieto con "PULSA UNA FLECHA", la primera tecla lo pone en marcha, el módulo cae, `↑` lo frena, `←`/`→` lo giran, el combustible baja 40 por segundo de empuje y el terreno de la zona 1 es idéntico al recargar. Al reducir la ventana, el juego se ve entero sin scroll.
2. Añadir el contacto con el terreno (puntos de colisión), la regla de aterrizaje seguro, el choque con explosión, el reintento de zona con módulos, las seis zonas con su tabla de dificultad y viento, la puntuación con desglose, el toque perfecto, la misión cumplida y los tres finales con `endGame()`. Verificación: abierto directamente, un aterrizaje con `vy ≤ 45`, `|vx| ≤ 30`, inclinación ≤ 10° y los dos pies en una baliza suma `(400 + 100 × zona) × ×n` más el combustible sobrante; cualquier otro contacto cuesta un módulo; el tercer choque muestra "GAME OVER" y Espacio reinicia desde la zona 1 con 3 módulos.
3. Repasar el adaptador `av:*` de la plantilla para el bucle de pasos fijos: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; en modo embebido `P` y `Espacio` no pausan ni reinician y no se dibujan ni "PAUSA" ni "GAME OVER"; `KEY_OF` con las flechas y `Space`. Verificación: abierto directamente sigue igual que en el paso 2.
4. Añadir la entrada `alunizaje` (con `controls`) al final de `GAMES` y la portada `cover-alunizaje` en `app/globals.css`. Verificación: `/games` muestra la tarjeta ALUNIZAJE con su portada, `/juegos/alunizaje` muestra el detalle con la misma portada y `/juegos/alunizaje/jugar` usa el reproductor embebido.
5. Crear `supabase/migrations/<version>_add_alunizaje_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_alunizaje_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `alunizaje`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña ALUNIZAJE de `/salon`.
6. Actualizar `CLAUDE.md`: `alunizaje` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que un juego de física usa pasos fijos de 1/120 s sobre rAF y un terreno con semilla fija pintado en una capa fuera de pantalla. Verificación: las dos secciones nombran `alunizaje`.

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
- [ ] El combustible baja 40 por segundo de empuje y el tanque inicial de la zona 1 (320) da 8 s de empuje continuo.
- [ ] El terreno de cada zona es el mismo en todas las partidas y en cada reintento, y las tres balizas muestran `×2`, `×3` y `×5` con los anchos de la tabla.
- [ ] Un aterrizaje con `vy ≤ 45`, `|vx| ≤ 30`, inclinación ≤ 10° y los dos pies en una baliza muestra el panel "ALUNIZAJE" 2,0 s con `(400 + 100 × zona) × multiplicador`, el combustible sobrante por zona y, si procede, "TOQUE PERFECTO" +500.
- [ ] Tocar una pendiente, el cuerpo o una baliza con una velocidad, inclinación o posición fuera de límites provoca un choque: explosión de 1,4 s, un módulo menos y la misma zona con el tanque lleno y el SCORE conservado.
- [ ] Salir por los lados o por arriba del lienzo cuenta como choque, y una flecha amarilla indica al módulo cuando está por encima del lienzo.
- [ ] Los instrumentos cambian de verde a amarillo y magenta según la velocidad y la inclinación, y a partir de la zona 4 se muestra el viento y desvía el módulo.
- [ ] La gravedad, el empuje, el tanque y el ancho de las balizas cambian por zona según la tabla (la zona 6 tiene `g = 90` y tanque 220).
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe, con el HUD legible.
- [ ] PAUSA congela el módulo, la explosión y todos los temporizadores, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin que el módulo salte de posición ni acelere de golpe.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego (`Espacio` solo empuja).
- [ ] Al perder el tercer módulo aparece, tras 1,4 s, el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Al aterrizar en la zona 6 se muestra "MISIÓN CUMPLIDA" 2,5 s y el modal trae la puntuación del HUD con el bonus de 2.000 por módulo restante incluido.
- [ ] FIN durante la partida (también antes de la primera tecla) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja el módulo quieto en la zona 1 con "PULSA UNA FLECHA", SCORE 0, 3 módulos y el tanque en 320.

**Leaderboard**

- [ ] `games` contiene la fila `alunizaje` / `ALUNIZAJE` y `list_migrations` muestra `add_alunizaje_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'alunizaje'` y la puntuación del HUD.
- [ ] La pestaña ALUNIZAJE de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/alunizaje/jugar` ni en `/salon`.
- [ ] Abrir `/games/alunizaje/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y "MISIÓN CUMPLIDA" al ganar, y reinicia con Espacio.
- [ ] La partida se mantiene fluida (sin tirones apreciables) con el terreno prerenderizado y la explosión en marcha.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `alunizaje` es un juego real y está en `games`.

## Decisiones

- **Sí:** propuesta A (misiones) como recomendada frente a la B (ruta), por decisión del agente. Es más legible (un objetivo por pantalla, sin reloj), tiene menos riesgo de equilibrado y de estados raros (sin despegue) y el terreno fijo por zona hace el Salón comparable. B queda como alternativa si se prefiere una partida de una sola vida con más tensión.
- **Sí:** id `alunizaje` y título `ALUNIZAJE`, exactamente los de la sugerencia del game-planner, por indicación de la tarea. No existía `specs/game-jam/alunizaje/` ni el id en `GAMES`.
- **Sí:** ARCADE y green, tal como los fija la sugerencia. ARCADE tendría su cuarto juego real y verde su tercero; PUZZLE, SHOOTER y VERSUS siguen sin equilibrar, limitación asumida de la sugerencia.
- **Sí:** terreno con semilla fija por zona, por decisión del agente. Todos los jugadores se enfrentan al mismo paisaje y un reintento no cambia el reto.
- **Sí:** empuje todo o nada con `T = g + 90`, por decisión del agente. Con teclado no hay empuje analógico; el neto constante de 90 px/s² mantiene el tacto parecido en las seis zonas mientras la gravedad sube.
- **Sí:** el aterrizaje se evalúa en el primer contacto y cualquier otro contacto es choque, por decisión del agente. Es una regla simple y legible que los instrumentos del HUD explican (verde, amarillo, magenta).
- **Sí:** límites de aterrizaje de 45 px/s, 30 px/s y 10°, por decisión del agente. Con `g = 90` se frena a tiempo con unos 66 unidades de combustible, así que el tanque de 220 deja margen para correcciones pero no para dudar.
- **Sí:** balizas ×2, ×3 y ×5 con anchos decrecientes (de 100 a 40 px), por decisión del agente. Es la decisión de riesgo que separa a los jugadores en el Salón.
- **Sí:** el combustible sobrante vale `zona` puntos por unidad y el toque perfecto 500, por decisión del agente. Recompensan frenar con precisión y no solo sobrevivir.
- **Sí:** el jugador espera a la primera tecla en cada zona, por decisión del agente. Evita estrellarse antes de que el iframe tenga el foco, como en SNAKE.
- **Sí:** pasos fijos de 1/120 s sobre rAF, por decisión del agente. La física queda independiente de los fotogramas y el contacto no atraviesa el terreno.
- **Sí:** viento desde la zona 4, por decisión del agente. Añade variedad en la segunda mitad de la campaña sin nuevas reglas.
- **No:** final por quedarse sin combustible, por decisión del agente. El módulo cae y se estrella, que es lo mismo sin un estado más.
- **No:** sonido, skins, scroll, zoom, meteoritos y terreno aleatorio, por decisión del agente. Mantienen el esfuerzo en M.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` (como reinicio) y los overlays de fin; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO. El panel de aterrizaje y "MISIÓN CUMPLIDA" sí se dibujan, porque forman parte de la partida.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el módulo espera a la primera tecla. Hay un criterio.      |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                                 |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                     |
| Los temporizadores del panel o la explosión siguen corriendo durante la pausa.        | Todos avanzan solo dentro de `step()`, que no se ejecuta en pausa.                                                                        |
| Una zona imposible de aterrizar por un terreno generado injusto.                      | Las balizas son planas, están alineadas a la rejilla y las bandas no se solapan; las seis semillas se revisan jugando antes de cerrar.    |
| El módulo atraviesa el terreno a alta velocidad.                                      | Pasos de 1/120 s: unos 3,3 px por paso a 400 px/s, con interpolación lineal del terreno y puntos de colisión separados 13 px o más.       |
| Aterrizaje en el borde de una baliza injusto por un pie fuera.                        | Se exige `x0 ≤ xPie ≤ x1` para ambos pies, con baliza mínima de 40 px frente a 26 px de separación entre pies, y los instrumentos avisan. |
| El equilibrado de gravedad, tanque y viento queda demasiado fácil o difícil.          | Cifras en `TUNING`; un criterio fija los 8 s de empuje de la zona 1 y las tablas por zona.                                                |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 5 aplica la migración antes de verificar el guardado.                                                                             |
| La puntuación supera 10.000.000.                                                      | Máximo teórico de 36.820; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                               |
| `shadowBlur` en cada fotograma baja los FPS en equipos modestos.                      | El terreno y el cielo se pintan una vez en un canvas fuera de pantalla; brillo solo en módulo, llama y rótulos de baliza.                 |
| A 375px de ancho el panel de instrumentos queda muy pequeño.                          | Valores a 12–14 px y etiquetas a 10 px; hay un criterio a 375px.                                                                          |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Terreno aleatorio, empuje proporcional, zoom, scroll y meteoritos.
- Despegue, tanque único y reloj de oxígeno (propuesta B).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
