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

- **Métrica estable: ms por `draw()`.** N llamadas seguidas (200–300) más `ctx.getImageData(0, 0, 1, 1)` al final para forzar el vaciado, y la mediana de 3. Con el equipo en reposo los FPS saturan en 60 antes y después; con carga paralela se hunden por igual en A y B. Desglosar `draw()` por subfunción (anulándolas por `eval`) localiza el culpable en segundos.
- Mide con una **escena cargada**: 18 rocas en ASTEROIDS o una serpiente de 60 en SNAKE. Con la escena inicial casi todo da 60 y el coste de `shadowBlur` por entidad no se ve.
- **No subas `lives = 99`** en juegos que pintan un icono por vida en el HUD (ASTEROIDS, ARKANOID): infla el coste del original. Es mejor anular la muerte (`killShip = function () {}`) o un piloto automático que envuelva `update` y ponga la pala bajo la bola, con las vidas reales.
- **Antes y después sin revertir el código:** `ctx.route("**/games/<id>/game.js*", …)` sirve el original sacado con `git show <commit>:public/games/<id>/game.js`. Usa el commit anterior a la optimización, no `HEAD`: si alguien ya hizo commit, `HEAD` es el código nuevo y compara el nuevo consigo mismo. Comprueba que el original no tiene algún símbolo nuevo (p. ej. `typeof paintOn`).
- **El MCP de Playwright no admite varias instancias a la vez** ("Browser is already in use … use --isolated"). Con varios agentes en paralelo, cada uno lanza su propio Chrome con el `playwright-core` de la caché de npx (`chromium.launch({ channel: "chrome", headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist"] })`). En este equipo headless usa la GPU real (ANGLE D3D11). La ventana visible se puede cerrar por accidente y corta la medición.
- Desde Playwright, `frame.evaluate("<expresión>")` con un string ve las `let` y `const` globales del juego.

## Técnicas

- Escena congelada para comparar capturas: semilla fija de `Math.random`, `update()` anulado, reloj fijo (`clock = 1.7` en FROGGER) y estado fijado a mano. Compara antes y después píxel a píxel: lo normal es una diferencia de redondeo de 1–2 niveles.
- Sprites con brillo: margen igual al `shadowBlur` máximo y coordenadas enteras al dibujar; en `retro`, alinear a la rejilla de 4 px.
- **Entidades que giran:** `shadowBlur` no lo afecta la transformación y es isótropo, así que un sprite con brillo dibujado con `ctx.rotate` + `drawImage` equivale a la figura rotada. Si cada entidad tiene una forma única (rocas de ASTEROIDS), guarda el sprite en la entidad con un contador `skinGen` en vez de un `Map`. 18 rocas en neón: de 1,7 a 0,48 ms.
- **`ctx.filter` es carísimo** (p. ej. `drop-shadow` para perfilar sprites en los modos claros): unos 20 ms por `drawImage` con carga. Si un juego va lento también abierto directamente y solo en modo claro, busca `filter` primero y hornéalo en un sprite. En SNAKE claro: de 9,7 a 1,1 ms.
- **Capa de ladrillos o fondo con estado:** ponla a `null` donde cambia (al romper un ladrillo, en `loadLevel()`, en `applySkin()`) y rehazla en el siguiente `draw()`. Declara las variables de capa con `let` antes de la primera llamada a `applySkin()`, para evitar el error de TDZ, e invalídalas también cuando termina de cargar un spritesheet.
- **HUD cacheado** con clave `score|nivel|vidas`. Con fuente web, invalídalo cuando cargue (`document.fonts.load(...).then(() => hudKey = "")`), o se queda con la fuente de reserva.
- **Skins cuantizadas a baja resolución** (`getImageData` por frame, como retro en ASTEROIDS): el coste es CPU. Dos mejoras exactas: consultar la caché de tonos solo cuando cambia el color del píxel anterior y cachear las scanlines en una capa. De 5,3 a 2,5 ms.
- Los juegos sin brillo ni gradientes (TETRIS: `fillRect` y líneas) no ganan nada con capas cacheadas. Antes de tocar nada, confirma con `MutationObserver` que no se escribe en el DOM en cada frame.
- **A/B tras editar:** inyecta la sección de dibujo original envuelta en un IIFE que devuelva su `draw` y alterna `draw = __A` / `draw = __B`. El bucle llama a `draw` por su nombre global.

## Trampas

- `/juegos/[id]/jugar` registra en consola un error previo de Next ("URL data during prerendering…") que no tiene que ver con el rendimiento.
- `npm run lint` del repo puede fallar por errores previos ajenos: validar con `npx eslint --max-warnings 0 <archivos tocados>`.
- `index.html` de los juegos puede tener CRLF: los reemplazos con `node -e` deben normalizar `\r\n`.
- Ejecutar `next build` rompe los servidores abiertos: no lo hagas.
