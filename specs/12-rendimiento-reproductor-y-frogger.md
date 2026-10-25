# SPEC 12 — Rendimiento del reproductor y del canvas de FROGGER

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 10, spec de FROGGER (`specs/game-jam/frogger/01-frogger-core.md`)
> **Fecha:** 2026-10-24
> **Objetivo:** Subir los FPS de los juegos dentro de `/juegos/<id>/jugar` con tres cambios: congelar los efectos CSS de la página mientras hay un juego en pantalla, cachear el dibujo estático de FROGGER en canvas fuera de pantalla y quitar los re-renders de React por cada toque del mando táctil.

## Por qué existe este spec

FROGGER va lento dentro del reproductor. La primera sospecha fue el estado de React (`useState`), pero las mediciones del 2026-10-24 apuntan a otro sitio. Se tomaron con Playwright a 1280×900, en el navegador de pruebas, con cifras ruidosas:

| Situación                                                  | FPS                  |
| ---------------------------------------------------------- | -------------------- |
| FROGGER abierto directamente (`/games/frogger/index.html`) | 48–60 según la skin  |
| FROGGER dentro del reproductor (`/juegos/frogger/jugar`)   | 26–45 según la skin  |
| Reproductor sin la animación `gridscroll` del fondo        | ~40 (desde 29, neón) |
| Mutaciones del DOM de React durante 6 s de juego           | 0                    |

Conclusiones:

- **React no re-renderiza durante la partida.** `paused`, `finalScore` y `look` de `EmbeddedGamePlayer` solo cambian con PAUSA, FIN, SKIN y MODO. El único estado que cambia mientras se juega es `pressed` de `TouchControls`: un render por toque y otro por soltar, solo en táctil.
- **La página que envuelve el iframe se recompone en cada frame del juego.** La retícula de fondo está animada (`.av-bg::before`, con perspectiva y máscara), el nav lleva `backdrop-filter` y las scanlines del CRT usan `mix-blend-mode: multiply` encima del canvas.
- **FROGGER redibuja todo en cada frame.** Repinta el fondo estático (setos, bocas, arcenes, rayado lateral, carretera, retícula) y aplica `shadowBlur` a ~40 figuras. La skin `neon`, donde todo brilla, es la más lenta.

## Alcance

**Entra:**

- **Medición** con un fragmento JS común (ver Modelo de datos), ejecutado con `browser_evaluate` del MCP de Playwright:
  - Línea base y resultado final de los 5 juegos, anotados en la sección **Mediciones** de este spec.
  - Comprobación en táctil 375×812 con la CPU limitada ×4 (CDP `Emulation.setCPUThrottlingRate`), como referencia sin umbral.
- **CSS del reproductor** (`app/globals.css`), solo mientras hay un juego en pantalla (`body:has(.av-player)`):
  - `.av-bg::before` sin animación: la retícula queda quieta.
  - `.av-nav` sin `backdrop-filter`, con fondo opaco equivalente.
  - `.crt-screen::after` con `mix-blend-mode: normal`. Negro al 18 % en `normal` da el mismo color que en `multiply`. Se aplica siempre, no solo en el reproductor, porque esa regla solo existe en el CRT.
  - El resto del sitio no cambia.
- **React** (`components/touch-controls.tsx`, `components/embedded-game-player.tsx`):
  - `TouchControls` deja de usar `useState` para `pressed`. El atributo `data-pressed` se pone y se quita directamente en el botón (`e.currentTarget`) al pulsar y soltar el primer y el último puntero. Cero renders por toque.
  - `TouchControls` se exporta envuelto en `memo`.
  - `EmbeddedGamePlayer` le pasa un `onKey` estable (`useCallback` con `frameRef`), así cambiar SKIN o MODO no re-renderiza el mando.
  - `paused`, `finalScore` y `look` siguen siendo estado, porque pintan UI.
- **Canvas de FROGGER** (`public/games/frogger/game.js`):
  - **Capa de fondo cacheada.** Lo que no se mueve (`drawSides`, `drawGoals` sin las ranas de las bocas, la base de `drawRiver` sin las ondas, `drawSafe`, `drawRoad`, `drawGrid`) se pinta una vez en un canvas fuera de pantalla de 800×600. Cada frame se copia con un solo `drawImage`. La capa se rehace en `applySkin()`.
  - **Sprites de entidades por skin.** Coches, bólidos, camiones, troncos y tortugas se pre-renderizan en canvas pequeños con su brillo ya incluido (margen igual al `shadowBlur`), y se dibujan con `drawImage`. Hay sprites por tipo, ancho, sentido y, en las tortugas, estado de buceo (visible, aviso, sumergida). La caché se vacía en `applySkin()`.
  - Se siguen dibujando en vivo, con su brillo, la rana (salto, muerte), las ondas del río, las ranas de las bocas, el HUD, la barra de tiempo, los overlays y las scanlines de retro.
  - **El aspecto de las 6 skins no cambia.** Las capturas de antes y después deben ser equivalentes a simple vista.
- Actualizar `CLAUDE.md` con la convención: fondo cacheado y sprites en los juegos con mucho brillo, y efectos CSS congelados en el reproductor.

**Fuera de alcance (para specs futuros):**

- Optimizar el canvas de ASTEROIDS, TETRIS, ARKANOID y SNAKE. Solo se miden; si alguno queda por debajo del umbral, va en su propio spec.
- Cambiar el estado de `EmbeddedGamePlayer` o `GameOverModal` que pinta UI (`paused`, `finalScore`, `look`, `name`).
- Quitar efectos CSS del resto del sitio (landing, biblioteca, salón).
- Script de medición versionado o dependencia nueva de Playwright.
- Bajar la resolución del canvas, usar `OffscreenCanvas` en un worker o `devicePixelRatio`.
- El aviso de Next "URL data during prerendering" de `/juegos/[id]`.

## Modelo de datos

No hay datos persistentes nuevos.

```js
// public/games/frogger/game.js — cachés de dibujo (se vacían en applySkin)
let bgLayer = null; // HTMLCanvasElement 800×600 con el fondo estático de la skin activa
const sprites = new Map(); // clave → { img: HTMLCanvasElement, pad: number }
// Clave: `${type}:${width}:${dir}:${variant}`
//   type    'car' | 'car2' | 'racer' | 'truck' | 'log' | 'turtle'
//   variant estado de buceo de la tortuga (0 visible, 1 aviso, 2 sumergida); 0 en el resto
function spriteFor(type, width, dir, variant) {} // crea (si falta) y devuelve el sprite
// draw(): ctx.drawImage(bgLayer, 0, 0) → ondas → entidades con drawImage(sprite.img, x - pad, y - pad) → rana → HUD
```

```tsx
// components/touch-controls.tsx — sin estado de pulsación
export const TouchControls = memo(function TouchControls({
  controls,
  color,
  onKey,
}) {
  // held/timers/onKeyRef como hoy; press/release ponen o quitan
  // e.currentTarget.dataset.pressed en vez de setPressed(...)
});
// components/embedded-game-player.tsx
const sendKey = useCallback((code: string, down: boolean) => {
  frameRef.current?.contentWindow?.postMessage(
    { type: "av:key", code, down },
    window.location.origin,
  );
}, []);
```

```js
// Fragmento de medición (browser_evaluate en /juegos/<id>/jugar o en /games/<id>/index.html).
// Mide los rAF del documento del juego durante 3 s; se repite 3 veces y se toma la mediana.
async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = document.querySelector("iframe");
  const g = frame ? frame.contentWindow : window;
  await wait(1500);
  const run = async () => {
    const f = [];
    let last = g.performance.now(),
      on = true;
    const tick = (ts) => {
      f.push(ts - last);
      last = ts;
      if (on) g.requestAnimationFrame(tick);
    };
    g.requestAnimationFrame(tick);
    await wait(3000);
    on = false;
    return 1000 / (f.reduce((a, b) => a + b, 0) / f.length);
  };
  const r = [await run(), await run(), await run()].sort((a, b) => a - b);
  return Math.round(r[1]);
};
```

Convenciones de medición:

- Escritorio 1280×900, pestaña visible y sin otras pestañas animando. Antes de medir, el juego en partida: en FROGGER, `timer` alto vía `eval`, para que la rana no muera y no cambie el estado.
- Cada skin se activa con `applySkin(skin, mode)` en el documento del juego y se esperan 300 ms antes de medir.
- Táctil: contexto con `hasTouch`/`isMobile` a 375×812 y CPU ×4, solo como referencia.

## Plan de implementación

1. **Línea base.** Medir con el fragmento los 5 juegos en `/juegos/<id>/jugar`, y FROGGER también abierto directamente, en sus 6 skins o en la `clasico oscuro` si no tienen skins. Medir FROGGER en táctil con CPU ×4. Hacer capturas de FROGGER en las 6 skins (`.playwright-screenshots/perf/frogger-<skin>-<modo>-antes.png`). Anotar todo en **Mediciones**. Verificación: la tabla de línea base está completa.
2. **CSS del reproductor.** Añadir en `app/globals.css` las reglas bajo `body:has(.av-player)` (retícula quieta y nav sin `backdrop-filter`) y cambiar `.crt-screen::after` a `mix-blend-mode: normal`. Verificación: medir FROGGER y SNAKE en el reproductor y anotarlo. Fuera del reproductor (`/`, `/games`) la retícula sigue animada y el nav mantiene el desenfoque. Las scanlines del CRT se ven igual en una captura comparada.
3. **React del mando.** Cambiar `TouchControls` a `data-pressed` directo en el DOM y `memo`, y pasar `sendKey` estable desde `EmbeddedGamePlayer`. Verificación en táctil 375×812: mantener y soltar, multitoque y auto-repetición de TETRIS funcionan igual. Una tecla pulsada se ve iluminada y se apaga al soltar. Con React DevTools Profiler o un contador temporal, 0 renders de `TouchControls` al pulsar o soltar y al cambiar SKIN o MODO.
4. **Fondo cacheado de FROGGER.** Crear `bgLayer` y su función de construcción a partir de las funciones de fondo actuales, reconstruida en `applySkin()`. En `draw()`, sustituir esas llamadas por `drawImage(bgLayer)` y dibujar las ondas y las ranas de las bocas encima. Verificación: las 6 skins se ven igual que las capturas del paso 1 y la medición mejora o se mantiene.
5. **Sprites de entidades de FROGGER.** Añadir `sprites` y `spriteFor()` y cambiar `drawLanes()` para usarlos en coches, bólidos, camiones, troncos y tortugas, con su brillo dentro del sprite. Vaciar la caché en `applySkin()`. Verificación: capturas `-despues.png` de las 6 skins equivalentes a las del paso 1. Las tortugas avisan y se sumergen igual. Cambiar de skin en plena partida no deja sprites de la skin anterior.
6. **Medición final y documentación.** Repetir las mediciones del paso 1 y anotarlas en **Mediciones**. Actualizar `references/templates/game-width-themes.md` (fecha de revisión de FROGGER) y `CLAUDE.md` (convención de rendimiento). Verificación: se cumplen los criterios de aceptación.

## Criterios de aceptación

**Rendimiento**

- [ ] FROGGER en `/juegos/frogger/jugar` a 1280×900 da ≥ 55 FPS de mediana en las 6 skins.
- [ ] En cada skin, la diferencia entre FROGGER en el reproductor y FROGGER abierto directamente es ≤ 10 %.
- [ ] La sección **Mediciones** tiene la línea base y el resultado final de los 5 juegos y la referencia táctil de FROGGER con CPU ×4.

**Aspecto**

- [ ] Las capturas `-antes` y `-despues` de FROGGER en las 6 skins son equivalentes a simple vista: mismos colores, mismo brillo y mismas formas.
- [ ] Fuera del reproductor (`/`, `/games`, `/salon`), la retícula de fondo sigue animada y el nav sigue con desenfoque.
- [ ] Las scanlines del CRT se ven igual que antes en todos los juegos.

**React**

- [ ] `TouchControls` no tiene `useState` y no se re-renderiza al pulsar o soltar ni al cambiar SKIN o MODO.
- [ ] En táctil, la tecla pulsada se ilumina y se apaga al soltar. El multitoque, la auto-repetición (TETRIS) y la liberación de teclas al pausar o abrir el modal funcionan igual que antes.

**Funcional**

- [ ] Cambiar SKIN o MODO en plena partida de FROGGER no altera la puntuación, las vidas, el nivel ni el estado, y no deja restos de la skin anterior.
- [ ] Los 5 juegos se juegan igual que antes: PAUSA, FIN, JUGAR DE NUEVO y guardado.
- [ ] La consola no muestra errores nuevos en `/juegos/<id>/jugar`; el aviso previo de Next no cuenta.
- [ ] `npx tsc --noEmit` y ESLint sin avisos en los archivos tocados.
- [ ] `CLAUDE.md` documenta la convención de rendimiento.

## Decisiones

- **Sí:** el cuello de botella se trata en el CSS de la página y en el canvas, no en el estado de React. Las mediciones muestran 0 cambios de React en el DOM durante la partida.
- **Sí:** en React solo se toca lo que re-renderiza al jugar (`pressed` de `TouchControls`), por decisión del usuario. `paused`, `finalScore` y `look` siguen como estado porque pintan UI.
- **Sí:** efectos congelados solo con `body:has(.av-player)`, por decisión del usuario. El resto del sitio conserva su animación.
- **Sí:** scanlines del CRT con `mix-blend-mode: normal` siempre. Con negro semitransparente el resultado es el mismo que `multiply` y evita mezclar sobre el iframe.
- **Sí:** fondo cacheado y sprites con brillo incluido, por decisión del usuario. Se mantiene el aspecto sin `shadowBlur` por frame en las entidades.
- **Sí:** alcance plataforma + FROGGER; los otros 4 juegos solo se miden, por decisión del usuario.
- **Sí:** fragmento de medición dentro del spec, sin archivos ni dependencias nuevas, por decisión del usuario.
- **Sí:** medición en táctil con CPU ×4 como referencia, sin umbral, por decisión del usuario.
- **No:** pasar a `useRef` todo el estado del reproductor. No mejora los FPS y complica la UI.
- **No:** quitar el brillo de las entidades. Cambiaría el aspecto de `clasico` y `neon`.
- **No:** bajar la resolución del canvas ni usar workers. Es más invasivo y hoy no hace falta.

## Riesgos

| Riesgo                                                                                                                           | Mitigación                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Las mediciones en el navegador de Playwright son ruidosas: varían entre tomas y dependen de la GPU del equipo.                   | Mediana de 3 tomas de 3 s, la misma ventana y una pestaña visible. Se comparan antes y después en la misma sesión. Si el entorno no llega a 55 ni con el juego abierto directamente, se anota y el criterio de ≤ 10 % frente al juego abierto directamente decide. |
| Congelar la retícula, el nav y las scanlines no basta para llegar al umbral.                                                     | El paso 2 mide por separado. Si falta margen, se prueba también a ocultar `.av-noise` y quitar el `mix-blend-mode` de `.av-bg::after` en el reproductor, y se anota como decisión.                                                                                 |
| Los sprites recortan el brillo o se ven borrosos.                                                                                | Margen del sprite igual al `shadowBlur` máximo y coordenadas enteras al dibujar. En `retro`, los sprites se alinean a la rejilla de 4 px (`snap`).                                                                                                                 |
| Cambiar de skin en plena partida deja sprites o fondo de la skin anterior.                                                       | `applySkin()` vacía `sprites` y reconstruye `bgLayer` antes del siguiente `draw()`. Hay un criterio que lo comprueba.                                                                                                                                              |
| La memoria de sprites crece.                                                                                                     | Las claves son finitas (6 tipos × anchos × 2 sentidos × 3 estados de tortuga) y se vacían al cambiar de skin.                                                                                                                                                      |
| SPEC 11 (Gamepad MK-II, aprobado y sin implementar) reescribe `touch-controls.tsx`.                                              | El que se implemente después mantiene `data-pressed` directo en el DOM y `memo`. Se anota en el spec que llegue segundo.                                                                                                                                           |
| Este spec depende de que la rama de FROGGER (`spec-01-frogger-core`) esté fusionada, con las skins y el porte móvil commiteados. | Implementar después de fusionarla.                                                                                                                                                                                                                                 |

## Mediciones

FPS, mediana de 3 tomas de 3 s con el fragmento del Modelo de datos, en el navegador de Playwright a 1280×900. Línea base del 2026-10-25 (paso 1). La columna "Tras paso 2" es FROGGER antes de tocar su canvas.

| Juego     | Skin           | Directo (antes) | Reproductor (antes) | Tras paso 2 | Reproductor (después) |
| --------- | -------------- | --------------- | ------------------- | ----------- | --------------------- |
| FROGGER   | clásico oscuro | 60              | 39                  | 60          |                       |
| FROGGER   | clásico claro  | 59              | 39                  | 60          |                       |
| FROGGER   | neón oscuro    | 55              | 27                  | 46          |                       |
| FROGGER   | neón claro     | 57              | 27                  | 42          |                       |
| FROGGER   | retro oscuro   | 60              | 46                  | 60          |                       |
| FROGGER   | retro claro    | 60              | 47                  | 60          |                       |
| ASTEROIDS | clásico oscuro | —               | 56                  |             |                       |
| ASTEROIDS | clásico claro  | —               | 55                  |             |                       |
| ASTEROIDS | neón oscuro    | —               | 49                  |             |                       |
| ASTEROIDS | neón claro     | —               | 47                  |             |                       |
| ASTEROIDS | retro oscuro   | —               | 52                  |             |                       |
| ASTEROIDS | retro claro    | —               | 52                  |             |                       |
| ARKANOID  | clásico oscuro | —               | 53                  |             |                       |
| ARKANOID  | clásico claro  | —               | 55                  |             |                       |
| ARKANOID  | neón oscuro    | —               | 40                  |             |                       |
| ARKANOID  | neón claro     | —               | 42                  |             |                       |
| ARKANOID  | retro oscuro   | —               | 50                  |             |                       |
| ARKANOID  | retro claro    | —               | 53                  |             |                       |
| SNAKE     | clásico oscuro | —               | 45                  | 60          |                       |
| SNAKE     | clásico claro  | —               | 44                  | 60          |                       |
| SNAKE     | neón oscuro    | —               | 56                  | 60          |                       |
| SNAKE     | neón claro     | —               | 51                  | 60          |                       |
| SNAKE     | retro oscuro   | —               | 57                  | 60          |                       |
| SNAKE     | retro claro    | —               | 59                  | 60          |                       |
| TETRIS    | clásico oscuro | —               | 59                  |             |                       |

Referencia táctil de FROGGER en el reproductor (375×812, `hasTouch`/`isMobile`, CPU ×4), antes: clásico oscuro 23, neón oscuro 21, retro oscuro 34. Después: pendiente.

Capturas de FROGGER con escena congelada y determinista (semilla fija de `Math.random`, `update()` anulado, `clock = 1.7`, bocas 2 y 4 ocupadas, rana en la fila 3): `.playwright-screenshots/perf/frogger-<skin>-<modo>-antes.png`.

## Lo que **no** entra en este spec

- Optimizar el canvas de ASTEROIDS, TETRIS, ARKANOID y SNAKE.
- Cambiar el estado que pinta UI en el reproductor o en el modal.
- Quitar efectos CSS fuera del reproductor.
- Script de medición versionado.
- Resolución del canvas, workers o `devicePixelRatio`.
- El aviso "URL data during prerendering" de Next.

Cada uno de estos, si llega, va en su propio spec.
