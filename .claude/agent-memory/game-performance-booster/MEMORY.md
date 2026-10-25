# Memoria de game-performance-booster

Aprendizajes reutilizables entre encargos: técnicas que rindieron, trampas de medición y cómo congelar escenas. El estado por juego vive en `references/templates/game-performance-status.md`, no aquí.

## Diagnóstico (SPEC 12)

- React no es el cuello de botella: 0 mutaciones del DOM en 6 s de partida. `paused`, `finalScore` y `look` solo cambian con PAUSA, FIN, SKIN y MODO. El único estado por toque era `pressed` de `TouchControls`.
- La página que envuelve el iframe se recompone en cada frame del juego: retícula animada `.av-bg::before` (perspectiva + máscara), `backdrop-filter` del nav y `mix-blend-mode: multiply` de `.crt-screen::after` sobre el canvas. Sin la animación de la retícula, FROGGER neón pasó de 29 a ~40 FPS. El SPEC 12 congela todo esto bajo `body:has(.av-player)`.
- `neon` es la skin más lenta en los juegos con brillo: el coste es el `shadowBlur` por figura y por frame.
- FROGGER abierto directamente daba 48–60 FPS y en el reproductor 26–45: una diferencia grande frente a abierto directamente apunta a la plataforma, no al canvas.

## Medición en Playwright

- Las cifras son ruidosas y dependen de la GPU: mediana de 3 tomas de 3 s y comparar antes y después en la misma sesión.
- El navegador de Playwright se comparte con otros agentes: la URL y el viewport pueden cambiar entre llamadas. Comprobar `location.href` en la misma tanda en que se mide.
- Desde la página del reproductor, las `let` globales del juego se leen y se cambian con `iframe.contentWindow.eval("…")`. `applySkin(skin, mode)` también se llama así.
- Las variables de `browser_run_code_unsafe` no persisten entre llamadas (ni `globalThis`): recuperar el contexto con `browser.contexts().find(c => c.pages().some(p => p.url().includes(id)))`.
- `browser_resize` no activa `(pointer: coarse)`: la referencia táctil necesita un contexto nuevo con `hasTouch: true` e `isMobile: true`.
- Los juegos con temporizador se agotan solos entre llamadas y abren el modal de fin: subir `lives`/`timer` por `eval` justo antes de medir.

## Técnicas

- Escena congelada para comparar capturas: semilla fija de `Math.random`, `update()` anulado, reloj fijo (`clock = 1.7` en FROGGER) y estado fijado a mano.
- Sprites con brillo: margen igual al `shadowBlur` máximo y coordenadas enteras al dibujar; en `retro`, alinear a la rejilla de 4 px.

## Trampas

- `/juegos/[id]/jugar` registra en consola un error previo de Next ("URL data during prerendering…") que no tiene que ver con el rendimiento.
- `npm run lint` del repo puede fallar por errores previos ajenos: validar con `npx eslint --max-warnings 0 <archivos tocados>`.
- `index.html` de los juegos puede tener CRLF: los reemplazos con `node -e` deben normalizar `\r\n`.
- Ejecutar `next build` rompe los servidores abiertos: no lo hagas.
