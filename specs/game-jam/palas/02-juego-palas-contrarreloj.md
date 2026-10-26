# SPEC JAM — Juego real PALAS NEÓN embebido y con leaderboard (propuesta B: contrarreloj)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-26
> **Tema:** PALAS NEÓN
> **Propuesta:** B — un único duelo contra la CPU a 120 s, sin vidas: cada tanto encajado resta 5 s, la CPU mejora con el tiempo, el jugador dispone de un remate con Espacio y los tantos consecutivos forman una racha que multiplica la puntuación. Alternativa a `01-juego-palas-torneo.md`: implementar solo una.
> **Objetivo:** Crear el juego PALAS NEÓN y hacerlo jugable en `/juegos/palas/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y ARKANOID, SNAKE y FROGGER (ARCADE). La categoría VERSUS está vacía y el amarillo (`yellow`) no lo usa ningún juego real. PALAS NEÓN, sugerida por el game-planner (`palas`, VERSUS · yellow, 2026-10-21), es el clásico duelo de palas contra la CPU y estrena las dos cosas. Es VERSUS solo contra la CPU: la plataforma no tiene multijugador.

Frente a SNAKE (tablero por ticks) y ARKANOID (la bola rompe ladrillos), aquí el ritmo es analógico y continuo: dos palas, una bola que acelera y un oponente que reacciona y mejora. Encaja con el tema de la jam en las tres capas: la mecánica son las palas, la ambientación es una pista neón con red de puntos y palas de brillo amarillo y magenta, y los textos hablan de saques, remates y rachas.

Esta propuesta es la contrarreloj: una sola CPU cuyo nivel sube cada 12 s, 120 s de reloj, y dos decisiones por tanto: cuándo rematar (Espacio, con enfriamiento) y cómo proteger la racha. Gana frente a la propuesta A (`01-juego-palas-torneo.md`) en tensión por segundo y en diferenciación en el Salón (la racha ×1–×5 y los remates separan a los jugadores buenos), y pierde en legibilidad (reloj, racha y remate a la vez) y en riesgo técnico (equilibrar el remate y la curva de la CPU). No hay código de referencia: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

En cuanto `palas` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/palas/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con formas de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>PALAS NEÓN — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600. Franja de HUD de 56 px arriba (`y = 0…56`) y pista de `y = 56…592` (536 px de alto) a todo el ancho. Los muros superior e inferior (`y = 56` y `y = 592`) rebotan la bola. Red de puntos vertical en `x = 400` y el marcador de tantos (jugador – CPU) en grande y tenue a ambos lados.
  - Palas de 14×90 px. La del jugador (amarilla) con la cara en `x = 54` (ocupa `x = 40…54`); la de la CPU (magenta) con la cara en `x = 746` (ocupa `x = 746…760`). Se mueven solo en vertical y su centro queda entre `y = 101` y `y = 547`.
  - Bola cuadrada de 14×14 px (blanca con halo cian; durante un remate, amarilla con estela).
  - HUD (fuente "Press Start 2P"): zona izquierda `SCORE` (cian) y `RACHA ×k` (verde); centro `RELOJ m:ss` (amarillo; magenta parpadeante por debajo de 10 s); zona derecha `CPU n` (tinta) y la barra de enfriamiento de `REMATE` (llena y amarilla cuando está lista).
  - Estado inicial: reloj 2:00 detenido, SCORE 0, racha 0 (×1), tantos 0–0, CPU nivel 1, remate listo, palas centradas (`y = 324`), bola quieta en `(400, 324)` y el texto "PULSA ↑ ↓ PARA SACAR". Ni el reloj ni la bola arrancan hasta la primera pulsación de `↑`/`↓`/`W`/`S`.
  - Controles: `↑`/`W` y `↓`/`S` mueven la pala a 480 px/s (velocidad directa, sin inercia). `Espacio` arma el remate.
  - Reloj: cuenta atrás de 120 s que corre siempre, también durante los saques, desde la primera pulsación. No hay vidas ni partidos: es un único duelo continuo.
  - Saque: tras 0,7 s de pausa con la bola parpadeando en el centro, sale hacia quien acaba de encajar el tanto (el primero, hacia la CPU) a velocidad de saque `380` px/s, con un ángulo vertical aleatorio de ±25° respecto a la horizontal y vertical hacia arriba o abajo al azar.
  - Rebote en pala: `offset = (bolaY − palaCentroY) / 52` limitado a `[−1, 1]` (52 = 45 de medio alto + 7 de media bola); el ángulo de salida es `offset × 55°` respecto a la horizontal y la bola invierte el sentido horizontal. La bola solo rebota si su cara toca la cara de la pala (`x` de la bola entre `40…54` o `746…760`) y solapa en vertical; si pasa de largo, sigue hasta salir (`x < −10` o `x > 810`) y es tanto del otro.
  - Nivel de la CPU `L = min(10, 1 + floor(t / 12))` con `t` los segundos de reloj consumidos. Velocidad de la pala CPU `230 + 24 × (L − 1)` px/s (230 a 446); retardo de reacción `360 − 30 × (L − 1)` ms (360 a 90); error de puntería `±(56 − 5 × (L − 1))` px (±56 a ±11); velocidad máxima de la bola `600 + 40 × (L − 1)` px/s (600 a 960). Cada golpe normal suma `+22 px/s` a la bola hasta el máximo.
  - IA de la CPU: con la bola yendo hacia ella, cada `retardo` ms recalcula el objetivo `y` como la proyección de la bola hasta su cara (reflejando en los muros) más un desvío aleatorio fijado en cada golpe del jugador (uniforme en `±error`), y mueve la pala hacia él a su velocidad con una zona muerta de 6 px. Con la bola yendo hacia el jugador, vuelve hacia el centro a la mitad de su velocidad. Desgaste: si el intercambio supera 30 golpes totales, el error se duplica.
  - Remate: al pulsar `Espacio` (si no está en enfriamiento) se arma durante 150 ms y empieza un enfriamiento de 1,0 s. Si en esos 150 ms la bola golpea la pala del jugador, el golpe es un remate: la bola sale con la velocidad actual `× 1,3` (máximo 1.100 px/s), amarilla y con estela. Si no hay golpe, se pierde el remate y no pasa nada más. La barra del HUD muestra el enfriamiento.
  - Puntuación (todas con enteros): golpe del jugador `+5` (solo los 10 primeros de cada tanto); tanto marcado `+100 × k` con `k = min(5, 1 + floor(racha / 2))` y `racha` los tantos consecutivos marcados antes de este sin encajar ninguno; REMATE `+100` extra (sin multiplicador) si el tanto se marca con la bola lanzada por un remate y sin que la CPU la toque. Un tanto encajado pone la racha a 0 y resta 5 s al reloj. No resta puntos.
  - Fin de partida (todos por `endGame()`): el reloj llega a 0 (también por el castigo de 5 s). FIN de la plataforma (`av:end`). Al llegar a 0 se muestra "TIEMPO" 1,5 s con la bola congelada antes de terminar.
  - `shadowBlur` solo en pala, bola y red (pocas formas); la rejilla de fondo se dibuja una vez en un canvas fuera de pantalla.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s (a 1.100 px/s la bola avanza 9,2 px por paso, menos que la pala más la bola, 28 px, así que no atraviesa). El reloj, el saque, el remate, su enfriamiento y la reacción de la CPU avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `KeyW`, `KeyS` y `Space`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio (en juego, Espacio arma el remate) y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con `ArrowUp`, `ArrowDown` y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" con la puntuación y Espacio reinicia (solo con la partida terminada).
- Nueva entrada `palas` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta con `ArrowUp` y `ArrowDown` y un botón `Space` con la etiqueta `REMATE`.
- Portada: reutiliza `cover-duelo` de `app/globals.css` (palas cian y magenta, red y bola amarilla), que ya parece el juego. No se añade CSS.
- Migración `supabase/migrations/<version>_add_palas_to_games.sql` que inserta `palas` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Controles táctiles más allá del `controls` declarado.
- Multijugador local u online: VERSUS es solo contra la CPU.
- Puntuación, reloj o racha en vivo en la barra de la plataforma.
- Leaderboard real en `/juegos/palas` y en las tarjetas más allá de lo que ya hace SPEC 06.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Torneo de rivales con nombre, vidas y partidos a tantos (son de la propuesta A).
- Power-ups, segunda bola y obstáculos.
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "palas",
  title: "PALAS NEÓN",
  short: "Duelo de palas contra la CPU: marca todo lo que puedas en 120 s.",
  long: "Mueve tu pala con las flechas o W y S y devuelve la bola en una pista neón. Tienes 120 segundos: cada tanto encajado te quita 5 s y cada tanto seguido sube tu racha hasta multiplicar por cinco. Pulsa Espacio justo antes de golpear para lanzar un remate que la CPU no podrá devolver. La CPU mejora cada 12 segundos.",
  cat: "VERSUS",
  cover: "cover-duelo",
  color: "yellow",
  src: "/games/palas/index.html",
  controls: {
    pad: [
      { code: "ArrowUp", dir: "up" },
      { code: "ArrowDown", dir: "down" },
    ],
    buttons: [{ code: "Space", label: "REMATE" }],
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
const CLOCK_START = 120,
  CONCEDE_PENALTY = 5;
const SMASH_WINDOW = 0.15,
  SMASH_COOLDOWN = 1.0,
  SMASH_MULT = 1.3,
  SMASH_MAX = 1100;
const cpuLevel = (t) => Math.min(10, 1 + Math.floor(t / 12));
const cpu = (L) => ({
  speed: 230 + 24 * (L - 1),
  react: 360 - 30 * (L - 1),
  error: 56 - 5 * (L - 1),
  vMax: 600 + 40 * (L - 1),
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
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera. Con un máximo de unos 90 tantos en 120 s (cada tanto cuesta al menos 1,3 s entre saque y vuelo) y un máximo de 650 puntos por tanto (500 con ×5, 100 de remate y 50 de golpes), la cota superior es de unos 60.000, muy por debajo de 10.000.000.
- Fin de partida: en `step()`, reloj a 0 → `endGame()` tras la animación "TIEMPO" de 1,5 s. FIN de la plataforma (`av:end`) → `endGame()`.
- Teclas: `↑`/`W` y `↓`/`S` mueven la pala; `Espacio` arma el remate. `P` pausa y `Espacio` reinicia (tras perder) solo abierto directamente.
- Colores del tema (la plantilla los define en `C`, porque el iframe no ve las variables CSS): pala del jugador amarilla, pala de la CPU magenta, bola blanca con halo cian y amarilla en remate, HUD con la paleta del Vault.
- El iframe lleva `title="PALAS NEÓN"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` (acumulador de paso fijo sobre rAF) y `public/games/asteroids/game.js` como referencia del protocolo, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/palas/` desde la plantilla de `/add-game` (`index.html` con el título `PALAS NEÓN — Arcade Vault`). Implementar la mecánica: pista, palas, bola con rebote por desvío, nivel de CPU por tiempo, IA con proyección y error, remate con ventana y enfriamiento, racha, reloj con castigo, puntuación y HUD, con `preventDefault` en `ArrowUp`, `ArrowDown`, `KeyW`, `KeyS` y `Space`, y diseñar el aspecto con `/frontend-design`. Verificación: `/games/palas/index.html` se juega completo, incluidos la pausa con P, "GAME OVER" y el reinicio con Espacio. Al reducir la ventana, el juego se ve entero sin scroll.
2. Repasar el adaptador `av:*` de la plantilla para el bucle de paso fijo: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; `KEY_OF` con `ArrowUp`, `ArrowDown` y `Space`; en modo embebido `P` no hace nada, `Espacio` solo arma el remate y no se dibujan ni el overlay de pausa ni "GAME OVER". Verificación: abierto directamente sigue igual que en el paso 1.
3. Añadir la entrada `palas` al final de `GAMES` (con `controls` y `cover-duelo`). Verificación: `/games` muestra la tarjeta PALAS NEÓN con el filtro VERSUS, `/juegos/palas` muestra el detalle y `/juegos/palas/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_palas_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_palas_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `palas`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña PALAS NEÓN de `/salon`.
5. Actualizar `CLAUDE.md`: `palas` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que es el primer juego VERSUS (contra la CPU) y que usa paso fijo de 1/120 s sobre rAF, puesto a cero al reanudar y reiniciar.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/palas` y `/juegos/palas/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta PALAS NEÓN (VERSUS, yellow, portada `cover-duelo`) y el filtro VERSUS la incluye.

**Juego embebido**

- [ ] Al entrar en `/juegos/palas/jugar`, el reloj marca 2:00 detenido y la bola espera quieta con "PULSA ↑ ↓ PARA SACAR"; la primera pulsación de `↑`/`↓`/`W`/`S` arranca el reloj y el saque sin hacer clic antes en el juego.
- [ ] Las flechas, W, S y Espacio no hacen scroll en la página.
- [ ] La pala se mueve a 480 px/s, no sale de la pista y no se queda pegada al soltar la tecla.
- [ ] El rebote depende del punto de golpeo: en el centro la bola sale horizontal y en el borde sale a unos 55°.
- [ ] Un tanto marcado suma `100 × k` con `k` según la racha (×1 en los dos primeros tantos, ×2 en el 3.º y 4.º, hasta ×5 desde el 9.º) y el HUD muestra `RACHA ×k`.
- [ ] Encajar un tanto pone la racha a ×1 y resta 5 s al reloj.
- [ ] Pulsar Espacio justo antes del golpe lanza un remate: la bola sale amarilla con estela y más rápida (×1,3, máximo 1.100 px/s). Pulsarlo sin golpear lo gasta, y la barra del HUD muestra 1,0 s de enfriamiento.
- [ ] Un tanto marcado con un remate que la CPU no ha tocado suma 100 extra, sin multiplicar.
- [ ] El HUD pasa a `CPU 2` a los 12 s y la CPU se nota más rápida y precisa; a los 108 s llega a `CPU 10` y no pasa de ahí.
- [ ] A 10 s del final el reloj parpadea en magenta; al llegar a 0 (también por el castigo) se muestra "TIEMPO" 1,5 s y termina la partida.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela pala, bola y reloj, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos del reloj ni de la bola.
- [ ] En modo embebido, `P` no pausa y `Espacio` solo arma el remate: nunca reinicia el juego.
- [ ] Al terminar el reloj aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] FIN durante la partida abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja reloj 2:00 detenido, SCORE 0, racha ×1, tantos 0–0, CPU nivel 1, remate listo y la bola quieta en el centro.
- [ ] Con un cursor táctil, la cruceta mueve la pala y el botón REMATE arma el remate.

**Leaderboard**

- [ ] `games` contiene la fila `palas` / `PALAS NEÓN` y `list_migrations` muestra `add_palas_to_games`.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN". La fila tiene `game_id = 'palas'` y la puntuación del HUD.
- [ ] La pestaña PALAS NEÓN de `/salon` muestra la puntuación guardada ("SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] `get_advisors` (security) no muestra avisos nuevos.

**General**

- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/palas/jugar` ni en `/salon`.
- [ ] Abrir `/games/palas/index.html` directamente permite pausar con `P`, muestra "GAME OVER" al terminar y reinicia con Espacio.
- [ ] ASTEROIDS, TETRIS, ARKANOID, SNAKE y FROGGER siguen igual que antes.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `palas` es un juego real y está en `games`.

## Decisiones

- **Sí:** esta propuesta (contrarreloj con remate y racha) es la alternativa a A, por decisión del agente. Se recomienda A (torneo) por su legibilidad y menor riesgo; B es la elección si se prioriza tensión por segundo y una puntuación que separe más a los jugadores.
- **Sí:** VERSUS · yellow y portada `cover-duelo` reutilizada (palas cian y magenta, red y bola amarilla), por decisión del agente: es la categoría y el color vacíos del catálogo y la portada ya existe.
- **Sí:** id `palas` y título `PALAS NEÓN` exactos de la sugerencia del game-planner, por indicación de la tarea.
- **Sí:** pista 800×536 bajo un HUD de 56 px, palas de 90 px y bola de 14 px, por decisión del agente. Proporciones clásicas y legibles a 375 px.
- **Sí:** reloj fijo de 120 s sin bonificación de tiempo, por decisión del agente. Una bonificación podría alargar la partida sin límite; así la duración y la cota de puntuación (60.000) están acotadas.
- **Sí:** castigo de 5 s por tanto encajado y sin vidas, por decisión del agente. Encajar duele (tiempo y racha) sin cortar la partida ni restar puntos.
- **Sí:** la CPU sube de nivel con el tiempo (cada 12 s) y no con los tantos, por decisión del agente. Todos los jugadores afrontan la misma curva y es comparable en el Salón.
- **Sí:** remate con ventana de 150 ms, enfriamiento de 1,0 s y bola ×1,3, por decisión del agente. Es la decisión de riesgo/recompensa que diferencia esta propuesta; el bonus de REMATE exige que la CPU no toque la bola.
- **Sí:** golpes puntuables limitados a 10 por tanto, por decisión del agente: evita farmear intercambios y fija la cota de puntuación.
- **Sí:** la partida y el reloj esperan la primera pulsación de `↑`/`↓`/`W`/`S`, por decisión del agente. Evita perder tiempo antes de que el iframe tenga el foco.
- **Sí:** paso fijo de 1/120 s con `dt` limitado a 50 ms, por decisión del agente: física estable y sin tunneling, y misma técnica que SNAKE.
- **Sí:** en modo embebido se desactivan `P`, el reinicio con Espacio y los overlays propios; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** solo se inserta la fila en `games`. No cambia el esquema ni hay que regenerar `database.types.ts`.
- **No:** ratón, sonido, táctil propio ni multijugador, por decisión del agente: fuera de alcance de un juego S.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y reloj y bola esperan la primera pulsación.                |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'`.                                             |
| Salto del reloj o de la bola al reanudar o volver de otra pestaña.                    | El reloj avanza solo dentro de los pasos fijos; `dt` limitado a 50 ms, y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`. |
| La bola atraviesa la pala con el remate a 1.100 px/s.                                 | Paso fijo de 1/120 s: 9,2 px por paso frente a 28 px de pala más bola.                                                                |
| El remate es demasiado fuerte o inútil.                                               | Constantes únicas (`SMASH_*`) y criterio comprobable; el enfriamiento de 1,0 s limita su uso a una vez por segundo.                   |
| Un intercambio infinito agota el reloj sin puntuar.                                   | A partir de 30 golpes totales el error de la CPU se duplica; el reloj sigue corriendo, así que el intercambio tiene coste.            |
| Espacio reinicia la partida por error al jugar.                                       | En modo embebido Espacio nunca reinicia; abierto directamente solo reinicia con la partida terminada.                                 |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 4 aplica la migración antes de verificar el guardado.                                                                         |
| La puntuación supera 10.000.000.                                                      | Cota de unos 60.000; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                |
| `cover-duelo` no refleja el amarillo del juego en la tarjeta.                         | La bola amarilla de la portada coincide con el `color: "yellow"`; si no convence, una portada nueva va en su propio spec.             |

## Lo que **no** entra en este spec

- Sonido.
- Controles táctiles propios y multijugador.
- Estadísticas en vivo en la barra de la plataforma.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Torneo de rivales, vidas y partidos a tantos (propuesta A).
- Power-ups, segunda bola y obstáculos.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
