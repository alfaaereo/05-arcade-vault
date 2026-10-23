# SPEC 10 — Controles táctiles para jugar en móvil

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 07, SPEC 08, SPEC 09
> **Fecha:** 2026-10-22
> **Objetivo:** Que los juegos embebidos se puedan jugar en una pantalla táctil con un mando virtual que la plataforma superpone al CRT y que traduce los toques en teclas para el juego.

## Por qué existe este spec

Los juegos solo escuchan el teclado (y el ratón en ARKANOID). En un móvil no hay forma de mover la nave, la pieza, la pala ni la serpiente. La plataforma pinta un único mando y cada juego recibe pulsaciones de tecla sintéticas, así que su código de entrada no cambia. El mando se declara en el catálogo y los juegos futuros pueden añadirlo sin tocar `EmbeddedGamePlayer`.

## Alcance

**Entra:**

- Campo opcional `controls` en `Game` (`lib/games.ts`) y su valor en `asteroids`, `tetris`, `arkanoid` y `snake`.
- Componente nuevo `components/touch-controls.tsx`, montado por `EmbeddedGamePlayer` dentro de `.crt-screen` y por encima del iframe. Tiene una cruceta a la izquierda y, a la derecha, los botones de acción en rombo.
- Visible solo con `(pointer: coarse)`. En escritorio con ratón no se ve nada nuevo.
- Mensaje nuevo del protocolo, de la plataforma al juego: `av:key { code, down }`.
- Multitoque: varios botones pulsados a la vez (p. ej. girar + empuje + disparo en ASTEROIDS).
- Auto-repetición en las teclas marcadas con `repeat`: primer reenvío de keydown a los 170 ms y luego cada 50 ms.
- Aspecto: contornos neón semitransparentes (~35 % de opacidad) que se iluminan (~90 %) mientras se pulsan.
- Adaptador `av:key` en el `game.js` de los 4 juegos: despacha un `KeyboardEvent` sintético para que lo procesen sus manejadores actuales.
- Barra del reproductor compacta en táctil: SKIN, MODO, PAUSA, FIN y SALIR caben y se pueden tocar a 375 px, en una o dos filas.
- Modo inmersivo en táctil horizontal: se ocultan el nav y el pie del CRT (`.crt-bottom`), y el CRT ocupa el alto disponible bajo la barra compacta, sin scroll.
- Aviso "REQUIERE TECLADO" bajo el CRT en táctil cuando el juego no tiene `controls`.
- Actualizar `/add-game` (`SKILL.md`, `protocolo-av.md`, `checklist-plataforma.md`, `spec-template.md`, `plantilla-juego/game.js`) para que los juegos nuevos incluyan `controls` y el adaptador `av:key`.
- Actualizar `CLAUDE.md` (sección SPEC 05).

**Fuera de alcance (para specs futuros):**

- Gestos nativos dentro de los juegos (deslizar en SNAKE, arrastrar la pala en ARKANOID).
- Vibración háptica.
- Bloquear el zoom o el scroll de toda la página fuera del mando.
- Botón para ocultar o mostrar el mando, y personalizar su posición o tamaño.
- Soporte de gamepad físico (Gamepad API).
- Pantalla completa (Fullscreen API) y bloqueo de orientación.
- Mando en el reproductor simulado `GamePlayer`.
- Cambios en las mecánicas o el HUD de los juegos.
- PWA o instalación como app.

## Modelo de datos

```ts
// lib/games.ts
export type TouchButton = {
  code: string; // KeyboardEvent.code que se envía, p. ej. "Space"
  label: string; // texto del botón, p. ej. "DISPARO"
  repeat?: boolean; // auto-repetición mientras se mantiene
};
export type TouchControls = {
  pad: {
    code: string;
    dir: "up" | "down" | "left" | "right";
    repeat?: boolean;
  }[];
  buttons: TouchButton[]; // 0–4, en rombo: el 1.º abajo, el 2.º a la derecha, el 3.º a la izquierda, el 4.º arriba
};
export type Game = {
  // …campos actuales
  controls?: TouchControls;
};
```

Mando por juego (la cruceta pinta solo las direcciones declaradas):

| Juego     | Cruceta            | Botones                            |
| --------- | ------------------ | ---------------------------------- |
| ASTEROIDS | ← → ↑ (empuje)     | DISPARO (`Space`)                  |
| TETRIS    | ← → ↓ con `repeat` | ROTAR (`ArrowUp`), CAÍDA (`Space`) |
| ARKANOID  | ← →                | —                                  |
| SNAKE     | ↑ ↓ ← →            | —                                  |

```ts
// Protocolo: nuevo mensaje plataforma → juego
type ParentToGame =
  /* …actuales */
  { type: "av:key"; code: string; down: boolean };
```

```js
// game.js — adaptador (resumen)
// av:key → document.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup",
//   { code, key: KEY_OF[code], bubbles: true }))
// KEY_OF: "ArrowLeft" → "ArrowLeft", "Space" → " ", … (ARKANOID lee e.key; el resto, e.code)
```

Convenciones:

- `av:key` cumple las mismas comprobaciones de `event.source` y `event.origin` que el resto del protocolo.
- La plataforma no envía `av:key` mientras el juego está en pausa ni con el modal de fin abierto. Al pausar, al terminar y al perder el toque (`pointercancel`, `lostpointercapture`), suelta todas las teclas pulsadas con `down: false`.
- Cada botón usa Pointer Events con `setPointerCapture`, `touch-action: none`, sin selección de texto ni menú contextual, y `preventDefault` en `pointerdown` para no robar el foco.
- La plataforma no guarda nada nuevo en `localStorage`.

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `components/embedded-game-player.tsx`, el bloque de entrada de cada `public/games/*/game.js` y `.claude/skills/add-game/protocolo-av.md`. Usar `/frontend-design` para el diseño del mando y de la barra compacta, como indica `CLAUDE.md`.

1. Añadir `TouchButton`, `TouchControls` y `controls?` a `lib/games.ts`, y el valor de `controls` de los 4 juegos según la tabla. Verificación: `next build` sin errores de tipos y nada cambia en la UI.
2. Añadir el adaptador `av:key` a los 4 `game.js` (`asteroids`, `tetris`, `arkanoid`, `snake`). Verificación: desde la consola del padre, `postMessage({type:"av:key",code:"ArrowLeft",down:true})` mueve la nave, la pieza, la pala o la serpiente igual que la tecla.
3. Crear `components/touch-controls.tsx`: cruceta y rombo según `controls`, Pointer Events con multitoque, auto-repetición y estilo neón semitransparente. Recibe un callback `onKey(code, down)`. Verificación con Playwright en emulación táctil: se pinta con la distribución de cada juego.
4. Montarlo en `EmbeddedGamePlayer` sobre el iframe, solo con `(pointer: coarse)`, oculto en pausa y con el modal abierto, soltando las teclas al pausar o terminar. Mostrar el aviso "REQUIERE TECLADO" si no hay `controls`. Verificación: en emulación táctil se juega a los 4 juegos sin teclado; en escritorio no aparece nada.
5. Barra compacta en táctil: botones más pequeños que caben y se tocan a 375 px. Verificación: capturas a 375×812 de los 4 juegos en `.playwright-screenshots/`.
6. Modo inmersivo en táctil horizontal: ocultar `.av-nav` y `.crt-bottom` y ajustar el límite de ancho del reproductor para que el CRT 4:3 quepa en el alto. Verificación: capturas a 812×375 sin scroll.
7. Actualizar `/add-game` (protocolo, checklist, plantilla de spec y `plantilla-juego/game.js` con el adaptador) y `CLAUDE.md` (sección SPEC 05: `av:key`, `controls`, mando táctil y modo inmersivo).

## Criterios de aceptación

**Mando**

- [ ] Con emulación táctil (`pointer: coarse`), `/juegos/<id>/jugar` muestra el mando sobre el CRT en los 4 juegos, con la distribución de la tabla.
- [ ] En escritorio con ratón, el reproductor se ve igual que antes de este spec.
- [ ] En reposo los botones dejan ver el juego por debajo y, al pulsarlos, se iluminan.
- [ ] ASTEROIDS: mantener ← y ↑ mientras se toca DISPARO gira, propulsa y dispara a la vez.
- [ ] TETRIS: mantener → mueve la pieza de forma continua hasta el borde. ROTAR gira la pieza una vez por toque y CAÍDA la deja caer de golpe.
- [ ] ARKANOID: mantener ← o → mueve la pala.
- [ ] SNAKE: el primer toque en la cruceta pone en marcha la serpiente, y un giro de 180° se ignora igual que con el teclado.
- [ ] Mantener pulsado un botón no abre el menú contextual, no selecciona texto, no hace zoom y no hace scroll.
- [ ] Al soltar el dedo fuera del botón, la tecla se suelta (la nave deja de girar).
- [ ] PAUSA oculta el mando y, al reanudar, ninguna tecla queda pulsada.
- [ ] Con el modal "FIN DEL JUEGO" abierto, el mando no se ve y el campo del nombre se puede escribir con el teclado virtual.
- [ ] Un juego sin `controls` muestra "REQUIERE TECLADO" bajo el CRT en táctil y ningún mando.

**Disposición**

- [ ] A 375×812 en vertical, la barra (SKIN, MODO, PAUSA, FIN, SALIR) cabe sin scroll horizontal y cada botón mide al menos 40 px de alto.
- [ ] A 812×375 en horizontal, el nav y `.crt-bottom` no se ven, y el CRT 4:3 entero y el mando caben sin scroll.
- [ ] Volver a vertical restaura el nav.

**General**

- [ ] `next build` termina sin errores ni advertencias de TypeScript.
- [ ] Los 4 juegos siguen funcionando igual con el teclado, embebidos y abiertos directamente.
- [ ] La consola no muestra errores ni advertencias de hidratación en `/juegos/<id>/jugar`.
- [ ] `/add-game` (protocolo, checklist, plantilla de spec y `plantilla-juego/game.js`) incluye `controls` y `av:key`.
- [ ] `CLAUDE.md` documenta `av:key`, `controls` y el modo inmersivo.

## Decisiones

- **Sí:** mando en la plataforma, superpuesto al CRT, por decisión del usuario (imagen de referencia). Un único diseño y los juegos solo añaden un adaptador.
- **No:** controles dibujados dentro de cada canvas. Serían 4 implementaciones y cambiarían el aspecto del juego.
- **Sí:** `av:key` + `KeyboardEvent` sintético dentro del juego. Reutiliza los manejadores de teclado tal cual (`e.code` o `e.key`).
- **Sí:** `controls` en `lib/games.ts`, por decisión del usuario. El catálogo sigue siendo la fuente y el mando aparece sin esperar al iframe.
- **No:** mensaje `av:controls` enviado por el juego. Añade protocolo y el mando aparecería tarde.
- **Sí:** solo con `(pointer: coarse)`, por decisión del usuario.
- **Sí:** solo los botones que usa cada juego, por decisión del usuario. ARKANOID y SNAKE no tienen rombo.
- **Sí:** auto-repetición 170/50 ms solo en ← → ↓ de TETRIS, por decisión del usuario, para imitar el autorepeat del teclado.
- **Sí:** semitransparente que se ilumina al pulsar, por decisión del usuario.
- **Sí:** vertical y horizontal; en horizontal, modo inmersivo sin nav ni pie del CRT, por decisión del usuario.
- **Sí:** barra compacta (sin datos de partida, que ya están en el HUD del canvas), por decisión del usuario.
- **Sí:** aviso "REQUIERE TECLADO" para juegos sin mando, por decisión del usuario.
- **Sí:** `touch-action: none` solo en el mando. El usuario no quiso bloquear el zoom ni el scroll de toda la página.
- **Sí:** actualizar `/add-game`, por decisión del usuario, para que los juegos nuevos sean táctiles.
- **No:** vibración, gestos nativos ni botón para ocultar el mando. Quedan para otro spec.

## Riesgos

| Riesgo                                                                             | Mitigación                                                                                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Tocar el mando quita el foco al iframe y ASTEROIDS ejecuta `clearKeys` en `blur`.  | `preventDefault` en `pointerdown` para no mover el foco. Como `av:key` llega por `postMessage`, no hace falta que el iframe tenga el foco. |
| Una tecla queda pulsada si el dedo sale del botón o el navegador cancela el toque. | `setPointerCapture` y soltar en `pointerup`, `pointercancel` y `lostpointercapture`. Además se suelta todo al pausar o terminar.           |
| El mando tapa partes del juego (esquinas del HUD, bordes del tablero).             | Opacidad ~35 % en reposo, y la cruceta y el rombo pegados a los laterales del CRT.                                                         |
| ARKANOID lee `e.key` y los demás `e.code`.                                         | El `KeyboardEvent` sintético lleva `code` y `key` (`KEY_OF`).                                                                              |
| Algún dispositivo táctil con ratón (tablet + ratón) no da `pointer: coarse`.       | Se acepta. Un botón para forzar el mando queda fuera de alcance.                                                                           |
| En horizontal la barra compacta y el CRT no caben en ~360 px de alto.              | El límite de ancho del reproductor se recalcula sin el nav. Hay un criterio de aceptación a 812×375.                                       |

## Lo que **no** entra en este spec

- Gestos nativos en los juegos.
- Vibración háptica.
- Bloqueo global de zoom o scroll.
- Ocultar, mover o redimensionar el mando.
- Gamepad físico.
- Pantalla completa y bloqueo de orientación.
- Mando en `GamePlayer` simulado.
- Cambios de mecánica o HUD de los juegos.
- PWA.

Cada uno de estos, si llega, va en su propio spec.
