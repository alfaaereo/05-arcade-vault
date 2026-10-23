# Memoria de mobile-porte

Aprendizajes reutilizables entre encargos: técnicas de emulación táctil, trampas de entrada y tamaños que funcionaron. El estado por juego vive en `references/templates/game-mobile-status.md`, no aquí.

## Emulación táctil en Playwright

- `browser_resize` no activa `(pointer: coarse)`: hace falta un contexto nuevo con `hasTouch: true` e `isMobile: true` (vía `browser_run_code_unsafe`). Comprobar `matchMedia("(pointer: coarse)").matches` antes de medir.
- El navegador de Playwright se comparte con otros agentes: la URL y el viewport pueden cambiar entre llamadas. Comprobar `location.href` en la misma tanda en que se actúa.
- Desde la página del reproductor, las `let` globales del juego se leen con `iframe.contentWindow.eval("score")`.

## Técnicas

- El `KeyboardEvent` sintético del adaptador lleva `code` y `key` (`KEY_OF`): ARKANOID lee `e.key`; ASTEROIDS, TETRIS y SNAKE leen `e.code`.

## Trampas

- ASTEROIDS ejecuta `clearKeys` en `blur`: si un toque mueve el foco fuera del iframe, se sueltan las teclas. El mando hace `preventDefault` en `pointerdown` para no robar el foco.
- El fondo del modal de fin (`.modal-bd`, z 80) tapa la barra del reproductor.
- `index.html` de los juegos puede tener CRLF: los reemplazos con `node -e` deben normalizar `\r\n`.
- `npm run lint` del repo falla por errores previos ajenos: validar con `npx eslint --max-warnings 0 <archivos tocados>`.
- `/juegos/[id]/jugar` registra en consola un error previo de Next ("URL data during prerendering…") que no tiene que ver con el móvil.
