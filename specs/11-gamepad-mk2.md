# SPEC 11 — Mando táctil con el aspecto del Gamepad MK-II

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 10
> **Fecha:** 2026-10-22
> **Objetivo:** Cambiar el aspecto del mando táctil de la SPEC 10 por el del Gamepad MK-II de `references/gamepad-assets/`: un panel con carcasa bajo el CRT en vertical y piezas superpuestas en horizontal, con variante clara.

## Por qué existe este spec

El mando de la SPEC 10 son contornos neón planos sobre el juego. `references/gamepad-assets/` (`gamepad.html`, `gamepad-neon.png`) define el aspecto que se quiere para el Vault: una carcasa oscura con textura de puntos, una cruceta de teclas con relieve y una gema que late en el centro, y botones redondos A/B con letra pixel y brillo de color. Este spec solo cambia **cómo se ve y dónde se coloca** el mando. El protocolo `av:key`, el multitoque, la auto-repetición y los adaptadores de los juegos no cambian.

## Alcance

**Entra:**

- Nuevo aspecto de `components/touch-controls.tsx` y de sus estilos en `app/globals.css`, portados de `references/gamepad-assets/gamepad.html`:
  - carcasa `.gp`
  - cruceta con teclas en relieve y hub con gema
  - botones `.ab` con anillo discontinuo al pulsar
- **Táctil vertical:** el mando es un panel con carcasa **debajo del CRT**, fuera de `.crt-screen`, y no tapa el juego. En táctil vertical se oculta `.crt-bottom`, y la barra, el CRT y el panel caben a 375×812 sin scroll.
- **Táctil horizontal (modo inmersivo):** sin carcasa. Las piezas MK-II se superponen a los laterales del CRT como hoy, con opacidad ~45 % en reposo y 100 % al pulsar.
- **Cruceta:** siempre en cruz completa. Las direcciones que el juego no declara en `controls.pad` se ven apagadas, sin flecha y sin respuesta al toque.
- **Botones de acción:** cada uno lleva una letra grande dentro y la etiqueta del catálogo (DISPARO, ROTAR…) en pequeño debajo.
  - Letras por posición en `controls.buttons`: 1.º **A**, 2.º **B**, 3.º **X**, 4.º **Y**.
  - Colores fijos: A magenta, B cyan, X amarillo, Y verde. La cruceta se ilumina en cyan.
  - Con 1–2 botones van en fila, como en la referencia: B a la izquierda y A a la derecha. Con 3–4 van en rombo: A abajo, B derecha, X izquierda e Y arriba.
- Reordenar los botones de TETRIS en `lib/games.ts`: A = ROTAR (`ArrowUp`) y B = CAÍDA (`Space`).
- **Variante clara:** con MODO · CLARO en el reproductor, el mando usa la carcasa clara con los acentos oscurecidos (ver Modelo de datos). `EmbeddedGamePlayer` le pasa el modo activo (`look.mode`).
- **Pausa y modal de fin:**
  - En vertical, el panel **sigue montado**, pero atenuado (~40 %) e inerte: sin respuesta al toque y sin enviar `av:key`. Al entrar en ese estado se sueltan las teclas pulsadas, igual que hoy.
  - En horizontal, las piezas superpuestas se ocultan, como hoy.
- La gema del hub late solo si no está activo `prefers-reduced-motion`.
- Actualizar la documentación:
  - `CLAUDE.md` (SPEC 05 / touch controls)
  - `.claude/skills/add-game/checklist-plataforma.md` y `protocolo-av.md`: letras A/B/X/Y, fila o rombo, y que el 1.º botón es la acción principal
  - `.claude/agents/mobile-porte.md` (checklist del mando y del layout en vertical)

**Fuera de alcance (para specs futuros):**

- Que el mando siga la skin del juego (CLÁSICO/NEÓN/RETRO). Solo sigue el modo oscuro/claro.
- Campo `letter` o color por botón en el catálogo.
- Mando en escritorio, o un botón para forzarlo.
- Resaltar el mando cuando se pulsa el teclado físico (el `keyMap` de la referencia).
- Vibración háptica, gestos nativos y personalizar la posición o el tamaño.
- Carcasa en horizontal y cambios en `av:key`, en `KEY_OF` o en los `game.js`.
- Cambios en el reproductor simulado `GamePlayer`.

## Modelo de datos

No hay estructuras nuevas en el catálogo. `TouchControls` y `TouchButton` (SPEC 10) quedan igual; solo cambia el orden de los botones de TETRIS:

```ts
// lib/games.ts — tetris
buttons: [
  { code: "ArrowUp", label: "ROTAR" }, // A
  { code: "Space", label: "CAÍDA" }, // B
],
```

Props del componente:

```ts
// components/touch-controls.tsx
type Props = {
  controls: TouchControls;
  mode: Mode; // "oscuro" | "claro", el look.mode del reproductor
  disabled: boolean; // pausa o modal de fin: atenuado e inerte, suelta las teclas
  onKey: (code: string, down: boolean) => void;
};
// La prop `color` de la SPEC 10 desaparece: los colores del MK-II son fijos.
const LETTERS = ["A", "B", "X", "Y"] as const;
```

Tokens del mando (CSS custom properties en `.gp`, redefinidos con `.gp[data-mode="claro"]`):

| Token                  | Oscuro (referencia)                       | Claro                                   |
| ---------------------- | ----------------------------------------- | --------------------------------------- |
| Carcasa                | `#1c1c28` → `#0c0c14`                     | `#e4e6f0` → `#c9ccdb`                   |
| Tecla de la cruceta    | `#1a1a25` → `#0a0a12`, flecha `--ink-dim` | `#f4f5fa` → `#d9dbe6`, flecha `#4a4f70` |
| Cruceta pulsada / gema | `--cyan` `#00f5ff`                        | `#007f8a`                               |
| A                      | `--magenta` `#ff006e`                     | `#c8005a`                               |
| B                      | `--cyan` `#00f5ff`                        | `#007f8a`                               |
| X                      | `--yellow` `#f5ff00`                      | `#6b5f00`                               |
| Y                      | `--green` `#00ff88`                       | `#00754a`                               |

Convenciones:

- Las clases se portan de la referencia con su nombre y prefijo propio: `.gp`, `.gp-dpad`, `.dp`, `.dp-hub`, `.dp-hub-gem`, `.ab` y `.ab-ring`, más `.ab-label` para la etiqueta. Las antiguas `.tc-*` se eliminan.
- El estado de pulsado usa `data-pressed`, como en la SPEC 10, no `.on`. Las direcciones sin uso llevan `data-off` y `aria-hidden`, y no son `<button>`.
- Los tamaños salen de la variante móvil de la referencia: teclas de 46 px, botones de 64 px y cruceta de 144 px. En horizontal se escalan con el ancho del CRT (`cqw`), como hoy.
- Las fuentes no cambian: "Press Start 2P" (`--pixel`) para las letras y las etiquetas, ya cargada en la app.
- Se mantienen todas las convenciones de entrada de la SPEC 10:
  - Pointer Events con `setPointerCapture` y `preventDefault` en `pointerdown`
  - `touch-action: none` solo en el mando
  - auto-repetición de 170/50 ms
  - liberar teclas en `pointerup`, `pointercancel`, `lostpointercapture` y al desmontar o desactivar

## Plan de implementación

Antes de empezar, leer `references/gamepad-assets/gamepad.html`, `components/touch-controls.tsx`, `components/embedded-game-player.tsx` y el bloque "mando táctil (SPEC 10)" y el modo inmersivo de `app/globals.css`. Usar `/frontend-design` para el diseño del panel y de la variante clara, como indica `CLAUDE.md`.

1. Reordenar los botones de TETRIS en `lib/games.ts` (A = ROTAR, B = CAÍDA). Verificación: en emulación táctil, el botón principal de TETRIS rota la pieza.
2. Portar los estilos MK-II a `app/globals.css`: la carcasa, la cruceta y los botones, con los tokens oscuros y claros de la tabla. Se sustituyen las reglas `.tc-*` y la gema respeta `prefers-reduced-motion`. Verificación: `next build` sin errores (el componente aún usa las clases viejas, así que el mando se ve sin estilo).
3. Reescribir el marcado de `components/touch-controls.tsx`:
   - cruz completa con brazos `data-off`
   - letras A/B/X/Y con la etiqueta debajo
   - fila o rombo según el número de botones
   - props `mode` y `disabled` en lugar de `color`
   - `disabled` suelta las teclas y bloquea los toques

   Verificación con Playwright en emulación táctil: los 4 juegos pintan su distribución.

4. Mover el montaje en `EmbeddedGamePlayer`: un único `TouchControls` en un contenedor que envuelve `.crt`. En táctil vertical se coloca como panel bajo el CRT; en táctil horizontal, como capa absoluta sobre los laterales de `.crt-screen`, sin carcasa y con ~45 % de opacidad en reposo. Pasarle `mode={look.mode}` y `disabled={paused || over}`. En horizontal, con `disabled`, se oculta. Verificación: capturas a 375×812 y 812×375 de los 4 juegos.
5. Ocultar `.crt-bottom` en táctil vertical y ajustar márgenes para que la barra, el CRT y el panel quepan a 375×812 sin scroll. Verificación: `scrollHeight <= innerHeight` a 375×812 en los 4 juegos.
6. Actualizar `CLAUDE.md`, `.claude/skills/add-game/checklist-plataforma.md`, `.claude/skills/add-game/protocolo-av.md` y `.claude/agents/mobile-porte.md` con el aspecto MK-II, las letras, la fila o el rombo, el panel en vertical y la variante clara.

## Criterios de aceptación

**Aspecto**

- [ ] Con emulación táctil a 375×812, el mando de `/juegos/<id>/jugar` es un panel con carcasa debajo del CRT y no tapa ningún píxel de `.crt-screen`, en los 4 juegos.
- [ ] La cruceta es siempre una cruz completa con hub y gema. En ARKANOID, ↑ y ↓ se ven apagadas y sin flecha, y tocarlas no envía `av:key`.
- [ ] ASTEROIDS muestra un único botón A magenta con "DISPARO" debajo.
- [ ] TETRIS muestra B (cyan, "CAÍDA") a la izquierda y A (magenta, "ROTAR") a la derecha. A rota la pieza y B la deja caer.
- [ ] SNAKE y ARKANOID no muestran botones de acción.
- [ ] Al pulsar una dirección, la tecla baja y brilla en cyan. Al pulsar A o B, el botón baja y aparece su anillo discontinuo.
- [ ] Con MODO · CLARO, el mando usa la carcasa clara y los acentos de la tabla. Con MODO · OSCURO vuelve al aspecto de la referencia, sin recargar.
- [ ] Con `prefers-reduced-motion: reduce`, la gema no late.

**Disposición**

- [ ] A 375×812 en vertical, la barra, el CRT y el panel caben sin scroll vertical ni horizontal, y `.crt-bottom` no se ve.
- [ ] A 812×375 en horizontal, no hay carcasa: las piezas están sobre los laterales del CRT al ~45 % en reposo y al 100 % al pulsar, y todo cabe sin scroll, como en la SPEC 10.
- [ ] En escritorio con ratón, el reproductor se ve igual que antes de este spec: sin mando y con `.crt-bottom`.

**Comportamiento**

- [ ] Se siguen cumpliendo los criterios del mando de la SPEC 10: multitoque en ASTEROIDS, auto-repetición en TETRIS, soltar al salir del botón, y sin zoom, sin menú contextual y sin selección al mantener pulsado.
- [ ] En vertical, PAUSA deja el panel en su sitio, atenuado. Tocarlo no mueve nada y, al reanudar, no queda ninguna tecla pulsada.
- [ ] Con el modal "FIN DEL JUEGO" abierto, el panel sigue atenuado e inerte, y el campo del nombre se puede escribir con el teclado virtual.
- [ ] En horizontal, PAUSA y el modal ocultan las piezas.

**General**

- [ ] `next build` termina sin errores ni advertencias de TypeScript.
- [ ] La consola no muestra errores ni advertencias de hidratación en `/juegos/<id>/jugar`.
- [ ] `CLAUDE.md`, `checklist-plataforma.md`, `protocolo-av.md` y `mobile-porte.md` describen el aspecto MK-II, las letras A/B/X/Y y el panel en vertical.

## Decisiones

- **Sí:** panel con carcasa bajo el CRT en vertical, por decisión del usuario. Con la carcasa opaca de la referencia, superponerlo taparía el juego.
- **Sí:** piezas superpuestas sin carcasa en horizontal, por decisión del usuario. No hay alto para un panel.
- **No:** panel también en horizontal. Habría que encoger el CRT por debajo de lo jugable a ~375 px de alto.
- **Sí:** letra más etiqueta debajo, por decisión del usuario. Conserva la identidad A/B de la referencia y sigue diciendo qué hace cada botón.
- **Sí:** letras por posición (A, B, X, Y) y colores fijos (magenta, cyan, amarillo, verde), por decisión del usuario. No cambia el modelo del catálogo.
- **No:** campo `letter` en `TouchButton`. Añade modelo y trabajo en `/add-game` sin necesidad hoy.
- **No:** color del juego en el mando (`var(--tc)`). El MK-II tiene colores propios.
- **Sí:** reordenar TETRIS (A = ROTAR), por decisión del usuario. Rotar es la acción más frecuente y A es el botón principal.
- **Sí:** cruz completa con direcciones apagadas, por decisión del usuario. Conserva la forma de la cruceta en todos los juegos.
- **Sí:** variante clara que sigue a MODO, por decisión del usuario, con los mismos acentos oscurecidos que las skins neón claras.
- **No:** seguir la skin del juego (clásico, neón o retro). Queda para otro spec.
- **Sí:** panel visible pero inerte en pausa y con el modal, por decisión del usuario. Desmontarlo haría saltar el layout. En horizontal se oculta, como en la SPEC 10.
- **Sí:** ocultar `.crt-bottom` en táctil vertical, por decisión del usuario, para que todo quepa sin scroll a 375×812.
- **Sí:** opacidad ~45 % en reposo en horizontal, por decisión del usuario. Es algo más visible que el ~35 % de la SPEC 10 y sigue dejando ver el juego.

## Riesgos

| Riesgo                                                                                         | Mitigación                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A 375×812 la barra en dos filas, el CRT y el panel no caben.                                   | Ocultar `.crt-bottom`, compactar el padding de `.gp` (12/14 px, como el móvil de la referencia) y medir `scrollHeight` en el paso 5. Si no basta, reducir la cruceta a 132 px. |
| En móviles bajos (p. ej. 360×640) no cabe todo.                                                | Se acepta el scroll vertical por debajo de 700 px de alto. El criterio se mide a 375×812.                                                                                      |
| Mover el mando fuera de `.crt-screen` rompe los tamaños en `cqw` del horizontal.               | El contenedor del mando define su propio `container-type`, o en horizontal se posiciona sobre `.crt-screen` usando su ancho. Verificar con las capturas a 812×375.             |
| Un panel inerte en pausa da a entender que funciona.                                           | Opacidad ~40 %, sin brillo, `pointer-events: none` y `aria-disabled`.                                                                                                          |
| Las sombras y `box-shadow` múltiples de la referencia cuestan rendimiento en móviles modestos. | Solo `transform` y `opacity` en las transiciones. Los brillos son estáticos por estado y no se animan.                                                                         |
| Las letras y etiquetas en Press Start 2P no caben a 64 px.                                     | Letra de 18–22 px y etiqueta de 7–8 px debajo del botón, fuera del círculo.                                                                                                    |

## Lo que **no** entra en este spec

- Mando que sigue la skin (clásico, neón o retro).
- Letra o color por botón en el catálogo.
- Mando en escritorio o forzado.
- Resaltado del mando con el teclado físico.
- Vibración, gestos nativos, posición o tamaño personalizables.
- Carcasa en horizontal.
- Cambios en `av:key`, en `KEY_OF` o en los juegos.
- Mando en `GamePlayer` simulado.

Cada uno de estos, si llega, va en su propio spec.
