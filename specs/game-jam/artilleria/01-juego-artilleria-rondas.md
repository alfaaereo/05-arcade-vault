# SPEC JAM — Juego real DUELO DE CAÑONES embebido y con leaderboard (propuesta A: rondas)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-10-27
> **Tema:** DUELO DE CAÑONES
> **Propuesta:** A — campaña de 8 rondas por turnos contra un tanque CPU cuya puntería mejora ronda a ronda, con un obús único, viento que deriva y terreno nuevo en cada ronda. Alternativa a `02-juego-artilleria-asedio.md`: implementar solo una.
> **Objetivo:** Crear el juego DUELO DE CAÑONES y hacerlo jugable en `/juegos/artilleria/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

El catálogo real tiene ASTEROIDS (SHOOTER), TETRIS (PUZZLE) y ARKANOID, SNAKE y FROGGER (ARCADE). No hay ningún juego VERSUS ni ninguno por turnos, y ninguno se juega con el cálculo en lugar de los reflejos. DUELO DE CAÑONES, sugerido por el game-planner (`artilleria`, VERSUS · yellow, 2026-10-21), es artillería clásica: dos tanques sobre un terreno, cada uno elige ángulo y potencia, el viento desvía el obús y cada cráter cambia el terreno. Es el primer juego VERSUS (solo contra la CPU: la plataforma no tiene multijugador) y el primero con color amarillo en el catálogo real.

Encaja con el tema de la jam en las tres capas: la mecánica es el duelo de dos cañones, la ambientación es un campo de batalla neón con el terreno amarillo, y los textos hablan de rondas, viento y blindaje. No hay código de referencia en `references/started-games/`: se crea desde la plantilla de `/add-game`, como SNAKE (SPEC 09), sin assets externos.

Esta propuesta es la de rondas: una campaña de 8 duelos cortos, cada uno sobre un terreno nuevo y contra la misma CPU, que empieza fallando mucho y acaba apuntando casi perfecto. Un solo proyectil y sin movimiento: el juego se reduce a leer el viento y el terreno y afinar ángulo y potencia. Gana frente a la propuesta B (`02-juego-artilleria-asedio.md`) en legibilidad (una arma, una regla de daño) y en riesgo técnico (terreno regenerado cada ronda, sin estado persistente entre duelos), y pierde en variedad y rejugabilidad: B tiene arsenal de tres armas, reloj de turno, terreno que acumula cráteres y cuatro tipos de enemigo.

En cuanto `artilleria` tenga `src` y esté en la tabla `games`, el guardado real y la pestaña real del Salón funcionan sin tocar la plataforma (SPEC 06).

## Alcance

**Entra:**

- Juego nuevo en `public/games/artilleria/` a partir de la plantilla de `/add-game` (`index.html`, `game.js`), con el tema neón del Vault, diseñado con `/frontend-design`. No se copia ningún asset de `references/`: todo se dibuja con trazos de canvas.
- `index.html`: el de la plantilla (canvas 800×600 que escala a 4:3 sin scroll, fuente "Press Start 2P"), con `<title>DUELO DE CAÑONES — Arcade Vault</title>`.
- Mecánica en `game.js`:
  - Lienzo 800×600. Franja de HUD de 56 px arriba (`y = 0…56`): panel izquierdo con la barra de blindaje del jugador (cian, 200×12 en `y = 12`) y `SCORE` (`y = 34`); centro con `RONDA n/8` (`y = 12`) y el viento (`y = 34`, flecha `◀`/`▶` y valor de 0 a 10; con 0 se muestra `VIENTO 00`); panel derecho con la barra de blindaje de la CPU (magenta) y `OBUSES k/10` de la CPU. Los obuses del jugador y la lectura `ÁNG 045  POT 050` se dibujan en una franja inferior (`y = 576`) sobre el terreno. El campo de batalla ocupa `y = 56…600`; un obús que sube por encima de `y = 56` pasa por detrás del HUD y se marca con un triángulo amarillo en el borde superior a su `x`.
  - Terreno: mapa de alturas `ground[x]` para `x = 0…799` (entero, `y` de la superficie; debajo todo es tierra hasta `y = 600`). Se genera en cada ronda: `ground[x] = clamp(420 + A·sin(2πx/800 + f1) + 0,6A·sin(2πx/400 + f2) + 0,3A·sin(2πx/170 + f3), 220, 540)` con fases `f1…f3` al azar y amplitud `A = 50 + 10 × (ronda − 1)` (de 50 a 120). Se pinta en un canvas fuera de pantalla (`terrainLayer`) que se redibuja solo al abrir un cráter; la superficie lleva un trazo amarillo neón de 3 px y la tierra un degradado oscuro con rejilla tenue.
  - Tanques: el del jugador (cian) en `x` entero al azar entre 60 y 200; el de la CPU (magenta) entre 600 y 740. Cuerpo de 28×12 px y cúpula de radio 8; cañón de 24 px desde el pivote `(x, y − 14)`. La `y` de apoyo es el mínimo de `ground` en `x − 10…x + 10` (el punto más alto bajo el tanque). Su centro de impacto es `(x, y − 8)` y su radio de impacto es 14. Cuando un cráter baja el terreno, el tanque cae a 240 px/s hasta su nueva `y`; la caída no hace daño. Los tanques no se mueven en horizontal.
  - Ángulo `a` en grados, 0 = derecha, 90 = arriba, 180 = izquierda, rango 0…180. Potencia `p` de 0 a 100. El proyectil sale de la punta del cañón con velocidad `6 × p` px/s en la dirección `a`, gravedad `G = 420` px/s² y aceleración horizontal del viento `6 × viento` px/s² (viento de −10 a +10; positivo empuja a la derecha). Ejemplo: a 45° y `p = 76` en llano y sin viento, el obús alcanza unos 495 px.
  - Controles (turno del jugador): `←`/`A` aumenta el ángulo (gira el cañón hacia la izquierda) y `→`/`D` lo reduce; `↑`/`W` sube la potencia y `↓`/`S` la baja; `Espacio` dispara. Cada pulsación suma o resta 1 unidad; si se mantiene más de 0,3 s, el cambio continúa a 30 unidades/s. Se dispara con los valores redondeados mostrados. Ángulo y potencia se conservan de un turno a otro; al empezar una ronda valen 45 y 50. Fuera de su turno el jugador no puede disparar ni cambiar la mira.
  - Obús: cráter de radio `R = 40` px, daño máximo 50. Colisiona con el terreno (`y ≥ ground[floor(x)]` para `0 ≤ x < 800`) o con un tanque (distancia al centro de impacto ≤ 14, ignorando al tanque que dispara durante los primeros 0,2 s de vuelo). Si sale por `x < −40`, `x > 840` o `y > 640`, es un fallo sin cráter.
  - Explosión: se anima un anillo de 0,5 s. A cada tanque a distancia `d` del centro de la explosión con `d < R + 14` le quita `round(50 × (1 − d / (R + 14)))` puntos de blindaje (el impacto directo vale ~50). Luego el terreno se carva: para cada `x` con `|x − cx| ≤ R`, sea `b = cy + sqrt(R² − (x − cx)²)`; si `ground[x] < b`, entonces `ground[x] = min(b, 599)`. Un obús puede dañar al propio tanque que lo dispara.
  - Blindaje: 100 por tanque. El de la CPU se repone a 100 en cada ronda; el del jugador sube 30 (máximo 100) al ganar una ronda y no se repone si la ronda se empata o se pierde.
  - Proyectiles por ronda: 10 por tanque. El jugador y la CPU se alternan; empieza el jugador en las rondas impares y la CPU en las pares. Si un tanque se queda sin obuses, el otro sigue disparando hasta agotar los suyos. Si ambos agotan los 10 sin que nadie caiga, la ronda es un empate: no suma puntos de victoria, el jugador conserva su blindaje y se pasa a la siguiente ronda.
  - Viento: al empezar cada ronda, un entero al azar entre `−W` y `+W` con `W = min(10, 2 + ronda)`; tras cada disparo (de cualquiera) deriva `−1`, `0` o `+1` al azar, con tope ±10. El jugador lo lee en el HUD.
  - Traza del último disparo: el camino del último obús (de cualquiera de los dos) queda dibujado como puntos tenues hasta el siguiente disparo, para que el jugador aprenda a corregir.
  - Fases del turno (todas con temporizadores en pasos fijos): `apuntar` (jugador, sin límite de tiempo) → `vuelo` → `explosión` (0,6 s) → `asentar` (hasta que los tanques dejan de caer) → turno del otro. Turno de la CPU: `pensar` 0,9 s con el texto `CPU APUNTA…`, luego el cañón gira 0,6 s hasta su ángulo y dispara.
  - IA de la CPU: planifica una vez por turno. Para una elevación al azar `e` en `[35, 75]` (ángulo de disparo `180 − e`, porque dispara hacia la izquierda) recorre la potencia de 20 a 100 en pasos de 0,5, simula la trayectoria con el viento que conoce (el real desde la ronda 3; 0 en las rondas 1 y 2) y el terreno actual en pasos de 1/60 s, y se queda con la potencia cuyo impacto cae más cerca del centro de impacto del jugador. Si ninguna queda a menos de 60 px, repite con otra elevación hasta 6 intentos y toma el mejor. Después añade ruido: `ángulo += U(−Na, Na) × k` y `potencia ×= 1 + U(−Np, Np) / 100 × k`, donde `Na = 12 − 1,3 × (ronda − 1)` grados, `Np = 10 − 1,1 × (ronda − 1)` por ciento y `k` empieza en 1 cada ronda. Tras cada disparo suyo que no hace daño al jugador, `k = max(0,2, k × 0,6)`. La tabla siguiente fija la curva.
  - Curva de dificultad por ronda `r`:

    | Ronda | Viento máx. | Amplitud del terreno | Ruido de ángulo ± (°) | Ruido de potencia ± (%) | La CPU conoce el viento |
    | ----- | ----------- | -------------------- | --------------------- | ----------------------- | ----------------------- |
    | 1     | 3           | 50                   | 12,0                  | 10,0                    | No                      |
    | 2     | 4           | 60                   | 10,7                  | 8,9                     | No                      |
    | 3     | 5           | 70                   | 9,4                   | 7,8                     | Sí                      |
    | 4     | 6           | 80                   | 8,1                   | 6,7                     | Sí                      |
    | 5     | 7           | 90                   | 6,8                   | 5,6                     | Sí                      |
    | 6     | 8           | 100                  | 5,5                   | 4,5                     | Sí                      |
    | 7     | 9           | 110                  | 4,2                   | 3,4                     | Sí                      |
    | 8     | 10          | 120                  | 2,9                   | 2,3                     | Sí                      |

  - Puntuación (entera, se suma al producirse cada evento para que FIN y el modal coincidan con el HUD):
    - 3 puntos por cada punto de blindaje efectivamente quitado a la CPU (sin contar el exceso sobre su blindaje restante): máximo 300 por ronda.
    - Ganar la ronda `r`: `400 + 100 × r`.
    - Bonus de munición al ganar: `120 × max(0, 6 − disparos del jugador en la ronda)`.
    - Bonus de blindaje al ganar: `4 × blindaje del jugador` al terminar la ronda.
    - Completar la ronda 8: `+3.000`.
    - Máximo teórico: `8 × (300 + 400 + 480 + 400) + 100 × (1 + … + 8) + 3.000 = 12.640 + 3.600 + 3.000 = 19.240` (exige ganar cada ronda con dos impactos directos exactos y sin recibir daño).
  - Final de ronda: gana el jugador si el blindaje de la CPU llega a 0 y el suyo es mayor que 0. Pierde si el suyo llega a 0, aunque la CPU también caiga en la misma explosión. Se muestra un cartel de 2,0 s (`RONDA GANADA`, `TANQUE DESTRUIDO` o `EMPATE`) y, tras ganar, el terreno y los tanques de la ronda siguiente.
  - Fin de partida (todos por `endGame()`): el blindaje del jugador llega a 0 (cartel `TANQUE DESTRUIDO` 1,8 s); se gana la ronda 8 (cartel `CAMPAÑA COMPLETA` 2,5 s); la ronda 8 termina en empate (cartel `EMPATE`, 2,0 s); o la plataforma envía `av:end`. La puntuación ya está sumada cuando empieza el cartel, así que FIN durante el cartel envía la misma cifra del HUD.
  - Estado inicial: ronda 1, SCORE 0, blindaje 100/100, 10 obuses por tanque, ángulo 45 y potencia 50, viento al azar entre −3 y +3, terreno nuevo y turno del jugador. No hay temporizador: el jugador puede pensar sin límite.
  - Rendimiento: `shadowBlur` solo en el proyectil, los tanques y la explosión; el terreno y la rejilla viven en `terrainLayer`.
- Bucle: `requestAnimationFrame` con `dt` limitado a 50 ms y un acumulador que ejecuta pasos fijos de 1/120 s (como SPEC 09, con paso fijo en lugar de tick de celda). Todos los temporizadores (pensar, giro del cañón, explosión, cartel, caída de tanques) avanzan solo dentro de esos pasos.
- Protocolo `av:*` según SPEC 05:
  - `preventDefault` en `keydown` para `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`, `KeyW`, `KeyA`, `KeyS` y `KeyD`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar no se dibuja el overlay "GAME OVER", no se reinicia con Espacio y `P` no pausa. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart`, `av:end` y `av:key` (`KEY_OF` con las cuatro flechas y `Space`). Al reanudar y reiniciar se ponen a cero `lastTime` y el acumulador, y se limpian las teclas.
  - Abierto directamente: `P` pausa (con overlay "PAUSA"), "GAME OVER" o "CAMPAÑA COMPLETA" con la puntuación y Espacio reinicia.
- Nueva entrada `artilleria` al final de `GAMES` en `lib/games.ts`, con `controls` (SPEC 10): cruceta de 4 flechas y un botón `FUEGO` (`Space`).
- Portada nueva `cover-artilleria` en `app/globals.css`, diseñada con `/frontend-design`: cielo oscuro con rejilla tenue y la silueta del terreno en amarillo neón sobre el elemento, y un SVG inline (data URI, `center/contain`) en `::after` con un tanque cian a la izquierda, uno magenta a la derecha, la parábola de un obús en trazos amarillos y un cráter, como `cover-snake`. Se comprueba que cada capa de `background-image` es válida.
- Migración `supabase/migrations/<version>_add_artilleria_to_games.sql` que inserta `artilleria` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- Sonido.
- Skins `CLÁSICO | NEÓN | RETRO` y modo claro (los aplica después el subagente `skin-designer`; el objeto `C` ya los hace posibles).
- Puntuación, ronda o viento en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Récord local en `localStorage`.
- Multijugador (la plataforma no lo tiene); el modo de dos jugadores en el mismo teclado.
- Mover los tanques, varias armas, reloj de turno, terreno persistente entre duelos y tipos de enemigo (propuesta B).

## Modelo de datos

```ts
// lib/games.ts — nueva entrada al final de GAMES
{
  id: "artilleria",
  title: "DUELO DE CAÑONES",
  short: "Calcula ángulo, potencia y viento y hunde al tanque rival.",
  long: "Un duelo de artillería por turnos contra un tanque CPU. Ajusta el ángulo y la potencia, lee el viento y abre cráteres en el terreno para derribar al rival antes de que él te derribe a ti. Son 8 rondas sobre terrenos nuevos: ganar vale más cuantos menos disparos gastes y más blindaje conserves, y la CPU apunta mejor en cada ronda.",
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
    buttons: [{ code: "Space", label: "FUEGO" }],
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
const ROUNDS = 8,
  SHELLS = 10,
  TANK_HP = 100,
  TANK_R = 14,
  CRATER_R = 40,
  MAX_DMG = 50;
const windMax = (round) => Math.min(10, 2 + round);
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
// av:key     → pressKey(code, down) con KEY_OF = flechas + Space
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida.
- `score` enviado: `Math.min(score, MAX_SCORE)`, como en la plantilla. La puntuación es entera y su máximo teórico es 19.240, muy por debajo de 10.000.000.
- Fin de partida: en `step()` al resolver la ronda (derrota, ronda 8 ganada o empatada) → `endGame()` tras el cartel. FIN de la plataforma (`av:end`) → `endGame()`. Nunca se llama a `endGame()` al terminar una ronda intermedia.
- Teclas: `←`/`A` y `→`/`D` ángulo, `↑`/`W` y `↓`/`S` potencia, `Espacio` dispara. `P` pausa y `Espacio` reinicia solo abierto directamente.
- Colores del tema (la plantilla los define en `C`, porque el iframe no ve las variables CSS): jugador cian, CPU magenta, terreno y proyectil amarillo, viento y textos con la paleta del Vault.
- El iframe lleva `title="DUELO DE CAÑONES"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md`, `specs/09-juego-snake.md` (modelo de juego creado desde cero y de acumulador de paso fijo) y `public/games/asteroids/game.js` como referencia del protocolo, y la plantilla `.claude/skills/add-game/plantilla-juego/`. Usar `/frontend-design` para el diseño visual del juego, como indica `CLAUDE.md`.

1. Crear `public/games/artilleria/` desde la plantilla de `/add-game` e implementar la mecánica: generación del terreno y `terrainLayer`, tanques con caída, física del obús con viento, cráteres y daño, fases del turno, IA de la CPU con la tabla de dificultad, rondas, munición, empate, puntuación, HUD y carteles, con `preventDefault` en flechas, Espacio y WASD, y diseñar el aspecto con `/frontend-design`. Verificación: `/games/artilleria/index.html` se juega completo (8 rondas, derrota y empate), la pausa con P y el reinicio con Espacio funcionan y, al reducir la ventana, el juego se ve entero sin scroll.
2. Repasar el adaptador `av:*` de la plantilla para el bucle de paso fijo: `acc = 0` y `lastTime = null` en `av:resume` y `av:restart`; `KEY_OF` con las flechas y `Space`; en modo embebido `P` y `Espacio` no hacen nada y no se dibujan ni el overlay de pausa ni "GAME OVER". Verificación: abierto directamente sigue igual que en el paso 1; embebido, `av:gameover` llega una sola vez.
3. Añadir la entrada `artilleria` al final de `GAMES` y la portada `cover-artilleria` en `app/globals.css`. Verificación: `/games` muestra la tarjeta DUELO DE CAÑONES con el filtro VERSUS, `/juegos/artilleria` muestra el detalle y `/juegos/artilleria/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_artilleria_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_artilleria_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `artilleria`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña DUELO DE CAÑONES de `/salon`.
5. Actualizar `CLAUDE.md`: `artilleria` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). Anotar que es el primer juego VERSUS, por turnos, con terreno destructible como mapa de alturas pintado en un canvas fuera de pantalla. Verificación: `CLAUDE.md` lista `artilleria` en ambas secciones.

## Criterios de aceptación

**Build y catálogo**

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/artilleria` y `/juegos/artilleria/jugar` aparecen prerenderizadas.
- [ ] `references/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta DUELO DE CAÑONES (VERSUS, yellow, portada `cover-artilleria`) y el filtro VERSUS la incluye; la portada se ve en la tarjeta y en el detalle.

**Juego embebido**

- [ ] Al entrar en `/juegos/artilleria/jugar`, `←`/`→`/`↑`/`↓` y `Espacio` responden sin hacer clic antes en el juego y no hacen scroll en la página.
- [ ] El estado inicial muestra RONDA 1/8, SCORE 0, blindaje 100 y 100, ángulo 45, potencia 50 y un viento entre −3 y +3.
- [ ] Una pulsación corta de `←` cambia el ángulo en 1 unidad; mantenida más de 0,3 s sigue cambiando a unas 30 unidades/s. Lo mismo con la potencia.
- [ ] Subir la potencia o cambiar el ángulo cambia visiblemente el alcance del obús, y el viento lo desvía hacia el lado que indica el HUD.
- [ ] El obús abre un cráter circular en el terreno, y un tanque cuyo suelo desaparece cae hasta la nueva superficie sin quedar flotando ni enterrado.
- [ ] Un impacto directo quita unos 50 puntos de blindaje y uno a 40 px del centro quita unos 14; el HUD y la barra lo reflejan.
- [ ] Tras cada disparo queda la traza punteada del obús hasta el siguiente.
- [ ] La CPU muestra `CPU APUNTA…`, gira el cañón y dispara; en la ronda 1 falla con frecuencia y en la 8 acierta casi siempre.
- [ ] Ganar una ronda suma `400 + 100 × ronda`, el bonus de munición y el de blindaje, más 3 por punto de daño; el HUD muestra el total y el blindaje del jugador sube 30 hasta un máximo de 100.
- [ ] Agotar los 10 obuses de ambos tanques termina la ronda en `EMPATE` sin puntos de victoria y pasa a la siguiente.
- [ ] Perder (blindaje del jugador a 0) muestra `TANQUE DESTRUIDO` y después el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el HUD, y el canvas no dibuja "GAME OVER".
- [ ] Ganar la ronda 8 muestra `CAMPAÑA COMPLETA` y abre el modal con la puntuación del HUD.
- [ ] Si ambos tanques caen en la misma explosión, la ronda se pierde.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] PAUSA congela el obús en vuelo, la cuenta de `CPU APUNTA…` y las animaciones, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos.
- [ ] En modo embebido, `P` y `Espacio` no pausan ni reinician el juego.
- [ ] FIN durante la partida (también durante un cartel) abre el modal con la puntuación actual del HUD.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y deja ronda 1/8, SCORE 0, blindaje 100/100, 10 obuses, ángulo 45, potencia 50 y terreno nuevo, con el turno del jugador.
- [ ] En un dispositivo táctil, la cruceta ajusta ángulo y potencia y el botón FUEGO dispara.

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

- **Sí:** esta propuesta (A, rondas) es la recomendada, por decisión del agente. Es más legible (un obús, una regla de daño, un terreno nuevo por ronda), tiene menos estado persistente y menos riesgo técnico, y la curva de 8 rondas da una puntuación que diferencia bien: llegar lejos, ganar con pocos disparos y con blindaje alto. B es más rejugable pero más cara y con más piezas que equilibrar.
- **Sí:** juego nuevo desde la plantilla de `/add-game`, con tema neón del Vault y HUD en el canvas, por decisión del agente.
- **Sí:** `artilleria` / `DUELO DE CAÑONES`, VERSUS, yellow y portada nueva `cover-artilleria`, por indicación de la tarea (es la sugerencia del game-planner). El único `cover-duelo` existente es de un juego simulado distinto y no se reutiliza.
- **Sí:** terreno como mapa de alturas de 800 columnas (sin voladizos ni cuevas), por decisión del agente. Hace el cráter, la caída de tanques y la IA triviales y baratas de calcular.
- **Sí:** potencia 0–100 con `6 × p` px/s y `G = 420`, por decisión del agente. A potencia máxima el alcance a 45° (~857 px) supera el ancho del lienzo, y los tanques a 400–680 px de distancia se alcanzan con potencias de 55 a 90.
- **Sí:** viento que deriva ±1 tras cada disparo, por decisión del agente. Obliga a releerlo en cada turno sin que sea un dado puro; la CPU lo ignora en las rondas 1 y 2 para dar una entrada amable.
- **Sí:** IA por simulación con ruido decreciente y memoria de fallos (`k`), por decisión del agente. Falla de forma creíble, mejora dentro de la ronda y entre rondas, y no hace trampas visibles.
- **Sí:** 10 obuses por tanque y empate si se agotan, por decisión del agente. Garantiza que cada ronda termina aunque el terreno bloquee los tiros.
- **Sí:** en una muerte doble pierde el jugador, por decisión del agente. Evita premiar un disparo suicida.
- **Sí:** la puntuación se suma al producirse cada evento y el cartel de fin llega después, por decisión del agente. FIN durante el cartel envía la cifra que ya muestra el HUD.
- **Sí:** sin reloj de turno, por decisión del agente. La plataforma ya tiene PAUSA y el duelo es de cálculo; un reloj lo tiene la propuesta B.
- **Sí:** `av:gameover` solo con `endGame()`, y el cartel de fin en modo embebido lo dibuja el juego por 1,8–2,5 s antes del modal, por decisión del agente. Es feedback de ronda, no el overlay "GAME OVER" que el protocolo desactiva.
- **No:** mover tanques, armas extra, terreno persistente. Son lo propio de la propuesta B.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame`. El lienzo ya es 4:3.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                                                              |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar, y el turno del jugador no tiene límite de tiempo. Hay un criterio que lo comprueba.                        |
| `av:gameover` se envía dos veces en la misma partida.                                 | Bandera `gameOverSent` hasta `initGame()`. `av:end` solo actúa si `state !== 'gameover'` y `endGame()` es el único punto de envío.                                                      |
| Al reanudar o volver de otra pestaña, el acumulador ejecuta muchos pasos seguidos.    | `dt` limitado a 50 ms (máximo 6 pasos de 1/120 s por frame), y `lastTime = null` y `acc = 0` en `av:resume` y `av:restart`.                                                             |
| La IA tarda demasiado al simular muchas trayectorias y el frame se congela.           | Un barrido de 161 potencias × unos 100 pasos por intento y hasta 6 intentos, una vez por turno y durante el `pensar` de 0,9 s. Si pasara de 15 ms, el paso de simulación sube a 1/30 s. |
| Un obús atraviesa una cresta fina a gran velocidad.                                   | A 600 px/s el obús avanza 5 px por paso de 1/120 s y el terreno se comprueba columna a columna con la `x` entera; no hay crestas de menos de 1 columna.                                 |
| El cráter deja un tanque flotando o enterrado.                                        | La `y` de apoyo se recalcula tras cada explosión y el tanque cae a 240 px/s; el terreno nunca sube, así que no se entierra.                                                             |
| La CPU es imposible en las rondas altas o trivial en las bajas.                       | La tabla de ruido está en el spec con números; ajustar solo `Na` y `Np`. La puntuación está acotada por 19.240 aunque se retoque.                                                       |
| La fuente "Press Start 2P" no tiene la Ñ en algún navegador.                          | Criterio de aceptación explícito; si falta, el HUD usa `monospace` solo para ese glifo.                                                                                                 |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 4 aplica la migración antes de verificar el guardado.                                                                                                                           |
| La puntuación supera 10.000.000.                                                      | Máximo teórico 19.240; se envía igualmente `Math.min(score, MAX_SCORE)`.                                                                                                                |
| El mando táctil no cubre toda la mira (sin ajuste fino).                              | La cruceta mantenida cambia 30 unidades/s y una pulsación suma 1; se verifica con `mobile-porte`, fuera de este spec.                                                                   |

## Lo que **no** entra en este spec

- Sonido.
- Skins y modo claro.
- Estadísticas en vivo en la barra de la plataforma.
- Leaderboard real en las tarjetas y `plays` real.
- Antitrampas avanzadas.
- Récord local en `localStorage`.
- Multijugador o dos jugadores en el mismo teclado.
- Movimiento de tanques, arsenal, reloj de turno y terreno persistente.
- Port del motor a TypeScript.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
