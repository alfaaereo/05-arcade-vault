# Memoria de mobile-porte

Aprendizajes reutilizables entre encargos: técnicas de emulación táctil, trampas de entrada y tamaños que funcionaron. El estado por juego vive en `references/templates/game-mobile-status.md`, no aquí.

## Emulación táctil en Playwright

- `browser_resize` no activa `(pointer: coarse)`: hace falta un contexto nuevo con `hasTouch: true` e `isMobile: true` (vía `browser_run_code_unsafe`). Comprobar `matchMedia("(pointer: coarse)").matches` antes de medir.
- El navegador de Playwright se comparte con otros agentes: la URL y el viewport pueden cambiar entre llamadas. Comprobar `location.href` en la misma tanda en que se actúa.
- Desde la página del reproductor, las `let` globales del juego se leen con `iframe.contentWindow.eval("score")`.
- Las variables de `browser_run_code_unsafe` no persisten entre llamadas (ni `globalThis`): recuperar el contexto con `browser.contexts().find(c => c.pages().some(p => p.url().includes(id)))`.
- Dedo mantenido y multitoque: `ctx.newCDPSession(p)` + `Input.dispatchTouchEvent` (`touchStart` con varios `touchPoints`, luego `touchEnd`). `page.touchscreen.tap` solo da toques sueltos.
- Los juegos con temporizador se agotan solos entre llamadas y abren el modal (el mando desaparece): recargar o subir `lives` antes de probar. Para probar saltos sin morir, vaciar los carriles peligrosos por `eval`.
- Con `isMobile` y una página más ancha que 375, Chrome amplía el layout viewport (`innerWidth` 404, `visualViewport.width` 375). Medir el ancho real en pantalla como `rect.width * 375 / innerWidth`.

## Técnicas

- El `KeyboardEvent` sintético del adaptador lleva `code` y `key` (`KEY_OF`): ARKANOID lee `e.key`; ASTEROIDS, TETRIS y SNAKE leen `e.code`.

## Tamaños que funcionaron

- HUD de un canvas 800×600: la pantalla del CRT mide ~275 px reales en vertical, así que el texto necesita ≥ 24 px en el canvas para llegar a 8 px (fórmula: `8 * 800 / ancho real`). En horizontal ese canvas se ve a ~340 px.

## Trampas

- ASTEROIDS ejecuta `clearKeys` en `blur`: si un toque mueve el foco fuera del iframe, se sueltan las teclas. El mando hace `preventDefault` en `pointerdown` para no robar el foco.
- El fondo del modal de fin (`.modal-bd`, z 80) tapa la barra del reproductor.
- Problemas de plataforma vistos el 23/10/2026 (comprobar si siguen): el nav desborda a 375 px (hamburguesa hasta x 403) y el botón GUARDAR del modal de fin se sale del modal. No son del juego: se anotan, no se corrigen.
- `index.html` de los juegos puede tener CRLF: los reemplazos con `node -e` deben normalizar `\r\n`.
- `npm run lint` del repo falla por errores previos ajenos: validar con `npx eslint --max-warnings 0 <archivos tocados>`.
- `/juegos/[id]/jugar` registra en consola un error previo de Next ("URL data during prerendering…") que no tiene que ver con el móvil.
