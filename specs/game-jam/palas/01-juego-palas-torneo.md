# SPEC JAM — Juego real PALAS NEÓN embebido y con leaderboard (propuesta A: torneo)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-26
> **Tema:** PALAS NEÓN
> **Propuesta:** A — torneo contra 8 rivales CPU de dificultad creciente, cada uno a 5 tantos, con 3 vidas (cada tanto encajado resta una) y puntuación por golpes, tantos y victorias. Alternativa a `02-juego-palas-contrarreloj.md`: implementar solo una.
> **Objetivo:** Crear el juego PALAS NEÓN y hacerlo jugable en `/juegos/palas/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y ARKANOID, SNAKE y FROGGER (ARCADE). La categoría VERSUS está vacía y el amarillo (`yellow`) no lo usa ningún juego real. PALAS NEÓN, sugerida por el game-planner (`palas`, VERSUS · yellow, 2026-10-21), es el clásico duelo de palas contra la CPU y estrena las dos cosas. Es VERSUS solo contra la CPU: la plataforma no tiene multijugador.

Frente a SNAKE (tablero por ticks, celdas discretas) y ARKANOID (la bola rompe ladrillos), aquí el ritmo es analógico y continuo: dos palas, una bola que acelera y un oponente con IA que reacciona, falla y mejora. Encaja con el tema de la jam en las tres capas: la mecánica son las palas, la ambientación es una pista neón con red de puntos y palas de brillo amarillo y magenta, y los textos hablan de rivales, saques y tantos.

Esta propuesta es el torneo: ocho rivales con nombre, cada uno más rápido, más listo y con la bola más viva que el anterior. Hay que ganar cada partido a 5 tantos y gestionar 3 vidas. Gana frente a la propuesta B (`02-juego-palas-contrarreloj.md`) en estructura legible (progresión clara, objetivo de campeón) y en riesgo técnico bajo (un solo control y una IA por tabla de parámetros), y pierde en tensión por segundo: B tiene reloj, remate y racha. No hay código de referencia: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

En cuanto `palas` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/palas/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con formas de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>PALAS NEÓN — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600. Franja de HUD de 56 px arriba (`y = 0…56`) y pista de `y = 56…592` (536 px de alto) a todo el ancho. Los muros superior e inferior (`y = 56` y `y = 592`) rebotan la bola. Una red de puntos discontinua vertical en `x = 400` y el marcador del partido en grande y tenue (tantos jugador – CPU) a ambos lados de la red.
  - Palas de 14×90 px. La del jugador (amarilla) con la cara en `x = 54` (ocupa `x = 40…54`); la de la CPU (magenta) con la cara en `x = 746` (ocupa `x = 746…760`). Se mueven solo en vertical y su centro queda entre `y = 101` y `y = 547`.
  - Bola cuadrada de 14×14 px (blanca con halo cian). Se mueve con velocidad `v` en px/s y ángulo propio.
  - HUD (fuente "Press Start 2P"): `SCORE` (cian) a la izquierda; `RIVAL n/8 NOMBRE` (amarillo) en el centro; vidas (iconos de pala magenta, uno por vida) a la derecha.
  - Estado inicial: rival 1, SCORE 0, 3 vidas, tantos 0–0, palas centradas (`y = 324`), bola quieta en `(400, 324)` y el texto "PULSA ↑ ↓ PARA SACAR". Nada se mueve hasta la primera pulsación de `↑`/`↓`/`W`/`S`.
  - Controles: `↑`/`W` y `↓`/`S` mueven la pala a 480 px/s (velocidad directa, sin inercia). Sin más teclas.
  - Saque: tras 0,9 s de pausa con la bola parpadeando en el centro, sale hacia quien acaba de encajar el tanto (el primer saque, hacia la CPU) con velocidad de saque, un ángulo vertical aleatorio de ±25° respecto a la horizontal y vertical hacia arriba o abajo al azar.
  - Rebote en pala: `offset = (bolaY − palaCentroY) / 52` limitado a `[−1, 1]` (52 = 45 de medio alto + 7 de media bola); el ángulo de salida es `offset × 55°` respecto a la horizontal y la bola invierte el sentido horizontal. Cada golpe suma `+24 px/s` a `v` hasta el máximo del rival. La bola solo rebota si su cara toca la cara de la pala (`x` de la bola entre `40…54` o `746…760`) y solapa en vertical; si pasa de largo, sigue hasta salir (`x < −10` o `x > 810`) y es tanto del otro.
  - Rivales (tabla por `r = 1…8`): velocidad de la pala CPU `240 + 30 × (r − 1)` px/s (240 a 450); retardo de reacción `380 − 40 × (r − 1)` ms (380 a 100); error de puntería `±(60 − 6 × (r − 1))` px (±60 a ±18); velocidad de saque `340 + 20 × (r − 1)` px/s (340 a 480); velocidad máxima `520 + 40 × (r − 1)` px/s (520 a 800). Nombres: PIXEL, ECO, FLUX, NODO, VOLT, PRISMA, ONDA, ZENIT.
  - IA de la CPU: con la bola yendo hacia ella, cada `retardo` ms recalcula el objetivo `y` como la proyección de la bola hasta su cara (reflejando en los muros) más un desvío aleatorio fijado en cada golpe del jugador (uniforme en `±error`), y mueve la pala hacia él a su velocidad con una zona muerta de 6 px. Con la bola yendo hacia el jugador, vuelve hacia el centro a la mitad de su velocidad. Desgaste: si el intercambio supera 30 golpes totales, el error se duplica.
  - Partido: gana el rival que llega primero a 5 tantos. Al ganar el jugador: mensaje "RIVAL SUPERADO" 1,8 s, +1 vida (máximo 3), y el siguiente rival con el marcador 0–0 y 2,0 s de presentación ("RIVAL n: NOMBRE").
  - Puntuación (todas con enteros): golpe del jugador `+10 × r` (solo los 20 primeros golpes de cada tanto); tanto marcado `+100 × r` más `10 × r × min(golpes del jugador en ese tanto, 15)`; partido ganado `+500 × r` más `250` por vida restante; ganar al rival 8 (CAMPEÓN) `+5.000`.
  - Fin de partida (todos por `endGame()`): quedarse sin vidas (cada tanto encajado resta 1; con 0, "ELIMINADO" 1,5 s) o ganar al rival 8 ("¡CAMPEÓN!" 2,5 s). FIN de la plataforma (`av:end`).
  - `shadowBlur` solo en pala, bola y red (pocas formas); la rejilla de fondo se dibuja una vez en un canvas fuera de pantalla.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s (a 960 px/s la bola avanza 8 px por paso, menos que la pala más la bola, 28 px, así que no atraviesa). Todos los temporizadores (saque, mensajes, reacción de la CPU) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `KeyW`, `KeyS` y `Space`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowUp` y `ArrowDown`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "¡CAMPEÓN!" con la puntuación y Espacio reinicia.
- Nueva entrada `palas` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta con `ArrowUp` y `ArrowDown`, sin botones.
- Portada: reutiliza `cover-duelo` de `app/globals.css` (palas cian y magenta, red y bola amarilla), que ya parece el juego. No se añade CSS.
- Migración `supabase/migrations/<version>_add_palas_to_games.sql` que inserta `palas` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Controles táctiles más allá del `controls` declarado (cruceta arriba/abajo).
- Multijugador local u online: VERSUS es solo contra la CPU.
- Puntuación, rival o vidas en vivo en la barra de la plataforma.
- Leaderboard real en `/juegos/palas` y en las tarjetas más allá de lo que ya hace SPEC 06.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Power-ups, remate con tecla y reloj (son de la propuesta B).
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "palas",
  title: "PALAS NEÓN",
  short: "Duelo de palas contra la CPU: gana a ocho rivales.",
  long: "Mueve tu pala con las flechas o W y S y devuelve la bola en una pista neón. Cada rival juega a 5 tantos y es más rápido y más listo que el anterior. Cada golpe, tanto y victoria suma puntos. Tienes 3 vidas: cada tanto encajado te quita una. Vence a los ocho rivales y serás el campeón.",
  cat: "VERSUS",
  cover: "cover-duelo",
  color: "yellow",
  src: "/games/palas/index.html",
  controls: {
    pad: [
      { code: "ArrowUp", dir: "up" },
      { code: "ArrowDown", dir: "down" },
    ],
    buttons: [],
  },
}
```

```sql
-- supabase/migrations/<version>_add_palas_to_games.sql
insert into public.games (id, title) values ('palas', 'PALAS NEÓN');
```

```js
// public/games/palas/game.js — constantes y bucle (resumen; protocolo completo en SPEC 05)
const W = 800,
  H = 600,
  HUD_H = 56,
  COURT_T = 56,
  COURT_B = 592;
const PAD_W = 14,
  PAD_H = 90,
  BALL = 14,
  PLAYER_SPEED = 480;
const STEP = 1 / 120;
const GOALS_TO_WIN = 5,
  MAX_LIVES = 3,
  HIT_BOOST = 24;
const rival = (r) => ({
  speed: 240 + 30 * (r - 1),
  react: 380 - 40 * (r - 1),
  error: 60 - 6 * (r - 1),
  serve: 340 + 20 * (r - 1),
  vMax: 520 + 40 * (r - 1),
});
function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (!paused && state === "playing" && started) {
    acc += dt;
    while (acc >= STEP && state === "playing") {
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
// av:end     → si state !== 'gameover': endGame()
// av:key     → pressKey(code, down)
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida.
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Con una partida perfecta (8 rivales sin encajar tantos) suma 110.000; los tantos encajados permiten hasta 16.000 más en golpes pero restan vidas y bonus, así que la cota superior es de unos 130.000, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, vidas 0 o victoria sobre el rival 8 → `endGame()` (tras la animación de 1,5 s o 2,5 s). FIN de la plataforma (`av:end`) → `endGame()`.
- Teclas: `↑`/`W` y `↓`/`S` mueven la pala. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores del tema (la plantilla los define en `C`, porque el iframe no ve las variables CSS): pala del jugador amarilla, pala de la CPU magenta, bola blanca con halo cian, HUD con la paleta del Vault.
- El iframe lleva `title="PALAS NEÓN"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` (acumulador de paso fijo sobre rAF) y `public/games/asteroids/game.js` como referencia del protocolo, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/palas/` desde la plantilla de `/add-game` (`index.html` con el título `PALAS NEÓN — Arcade Vault`). Implementar la mecánica: pista, palas, bola con rebote por desvío, tabla de rivales, IA con proyección y error, partidos a 5 tantos, vidas, puntuación, mensajes intermedios y HUD, con `preventDefault` en `ArrowUp`, `ArrowDown`, `KeyW`, `KeyS` y `Space`, y diseñar el aspecto con `/frontend-design`. Verificación: `/games/palas/index.html` se juega completo, incluidos la pausa con P, "GAME OVER" y el reinicio con Espacio. Al reducir la ventana, el juego se ve entero sin scroll.
2. Repasar el adaptador `av:*` de la plantilla para el bucle de paso fijo: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; `KEY_OF` con `ArrowUp` y `ArrowDown`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni el overlay de pausa ni "GAME OVER". Verificación: abierto directamente sigue igual que en el paso 1.
3. Añadir la entrada `palas` al final de `GAMES` (con `controls` y `cover-duelo`). Verificación: `/games` muestra la tarjeta PALAS NEÓN con el filtro VERSUS, `/juegos/palas` muestra el detalle y `/juegos/palas/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_palas_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_palas_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `palas`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña PALAS NEÓN de `/salon`.
5. Actualizar `CLAUDE.md`: `palas` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que es el primer juego VERSUS (contra la CPU) y que usa paso fijo de 1/120 s sobre rAF, puesto a cero al reanudar y reiniciar.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/palas` y `/juegos/palas/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta PALAS NEÓN (VERSUS, yellow, portada `cover-duelo`) y el filtro VERSUS la incluye.

**Juego embebido**

- [ ] Al entrar en `/juegos/palas/jugar`, la bola espera quieta con "PULSA ↑ ↓ PARA SACAR" y la primera pulsación de `↑`/`↓`/`W`/`S` inicia el saque sin hacer clic antes en el juego.
- [ ] Las flechas, W, S y Espacio no hacen scroll en la página.
- [ ] La pala se mueve a 480 px/s, no sale de la pista y no se queda pegada al soltar la tecla.
- [ ] El rebote depende del punto de golpeo: en el centro la bola sale horizontal y en el borde sale a unos 55°.
- [ ] Cada golpe acelera la bola 24 px/s sin pasar del máximo del rival, y la bola no atraviesa la pala a la velocidad máxima.
- [ ] Un tanto marcado suma `100 × r` más el bonus de golpes; el marcador de la pista y el SCORE del HUD coinciden con la tabla de puntuación.
- [ ] Al llegar a 5 tantos aparece "RIVAL SUPERADO", se gana 1 vida (máximo 3) y empieza el rival siguiente, más rápido, con su nombre en el HUD.
- [ ] Cada tanto encajado resta una vida y la bola saca hacia el jugador tras 0,9 s.
- [ ] Con 0 vidas se muestra "ELIMINADO" y termina la partida; ganar al rival 8 muestra "¡CAMPEÓN!", suma 5.000 y termina la partida.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela pala y bola, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin que la bola dé un salto.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] Al perder aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] FIN durante la partida abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja rival 1, SCORE 0, 3 vidas, marcador 0–0 y la bola quieta en el centro.
- [ ] Con un cursor táctil, la cruceta del mando mueve la pala arriba y abajo.

**Leaderboard**

- [ ] `games` contiene la fila `palas` / `PALAS NEÓN` y `list_migrations` muestra `add_palas_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'palas'` y la puntuación del HUD.
- [ ] La pestaña PALAS NEÓN de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/palas/jugar` ni en `/salon`.
- [ ] Abrir `/games/palas/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al perder y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `palas` es un juego real y está en `games`.

## Decisiones

- **Sí:** esta propuesta (torneo de 8 rivales) es la recomendada, por decisión del agente. Tiene objetivo claro (ser campeón), progresión legible, una sola tecla de acción y una IA por tabla de parámetros: menor riesgo y misma rejugabilidad en el Salón (la puntuación premia golpes, tantos y vidas conservadas). B añade reloj, remate y racha, con más tensión pero más cosas que equilibrar.
- **Sí:** VERSUS · yellow y portada `cover-duelo` reutilizada (palas cian y magenta, red y bola amarilla), por decisión del agente: es la categoría y el color vacíos del catálogo y la portada ya existe.
- **Sí:** id `palas` y título `PALAS NEÓN` exactos de la sugerencia del game-planner, por indicación de la tarea.
- **Sí:** pista 800×536 bajo un HUD de 56 px, palas de 90 px y bola de 14 px, por decisión del agente. Proporciones clásicas y legibles a 375 px.
- **Sí:** desvío de la bola según el punto de golpeo, máximo 55°, por decisión del agente. Da control al jugador y permite ganar a una CPU rápida con ángulos cerrados (a 800 px/s la componente vertical supera los 450 px/s de la pala CPU del rival 8).
- **Sí:** CPU con retardo y error, no perfecta, por decisión del agente. Cada rival es una fila de la tabla, fácil de ajustar sin tocar la IA.
- **Sí:** golpes puntuables limitados a 20 por tanto y bonus de intercambio limitado a 15, por decisión del agente: evita farmear intercambios eternos y fija la cota de puntuación.
- **Sí:** +1 vida por rival superado (máximo 3), por decisión del agente. Un tropiezo no condena la partida y el bonus de 250 por vida premia jugar limpio.
- **Sí:** la partida espera la primera pulsación de `↑`/`↓`, por decisión del agente. Evita encajar un tanto antes de que el iframe tenga el foco.
- **Sí:** paso fijo de 1/120 s con `dt` limitado a 50 ms, por decisión del agente: física estable y sin tunneling, y misma técnica que SNAKE.
- **Sí:** en modo embebido se desactivan `P`, `Espacio` y los overlays propios; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** ratón, sonido, táctil propio ni multijugador, por decisión del agente: fuera de alcance de un juego S.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y la partida espera la primera pulsación.       |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                 |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos.             | `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                     |
| La bola atraviesa la pala a alta velocidad.                                           | Paso fijo de 1/120 s: a 800 px/s avanza 6,7 px por paso, menos que el grosor de pala más bola (28 px).                    |
| Un intercambio infinito bloquea la partida.                                           | A partir de 30 golpes totales el error de la CPU se duplica; los golpes puntuables y el bonus están limitados.            |
| Los rivales altos son imposibles o los bajos aburridos.                               | La dificultad es una tabla de cinco parámetros por rival, ajustable; el criterio comprueba que la CPU 8 se puede batir.   |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 4 aplica la migración antes de verificar el guardado.                                                             |
| La puntuación supera 10.000.000.                                                      | Cota de unos 130.000; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                   |
| `cover-duelo` no refleja el amarillo del juego en la tarjeta.                         | La bola amarilla de la portada coincide con el `color: "yellow"`; si no convence, una portada nueva va en su propio spec. |

## Lo que **no** entra en este spec

- Sonido.
- Controles táctiles propios y multijugador.
- Estadísticas en vivo en la barra de la plataforma.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Power-ups, remate y reloj (propuesta B).
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
