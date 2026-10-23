# Memoria de skin-designer

Aprendizajes reutilizables entre encargos: paletas que funcionaron, técnicas para sprites y trampas encontradas. El estado de skins por juego vive en `references/templates/game-width-themes.md`, no aquí.

## Paletas

- Neón oscuro (vectorial): fondo `#0a0a0f`, jugador cyan `#00f5ff`, enemigos magenta oscurecido `#e8005f` (el `#ff006e` puro solo da 2,83:1 contra el cyan; `#e8005f` da 3,37 y 4,32 sobre el fondo), proyectiles `#f5ff00`, extra `#00ff88`, HUD `#e6e9ff`. Retícula de fondo `rgba(0,245,255,0.06)` cada 40 px da identidad sin tocar contrastes.
- Neón claro: fondo `#eef0fa`, cyan `#007f8a`, magenta `#c8005a`, amarillo → oliva `#6b5f00`, verde `#00754a`, tinta `#1a1a2e`, `shadowBlur` 3.
- Retro fósforo oscuro (4 tonos): `#071108` / `#1e3a1b` / `#4f8a2c` / `#d4f7a0`. Enemigos en el tono 3 (4,58 sobre fondo, 3,52 contra el tono 4); con `#5c9a34` no llegaba a 3:1.
- Retro claro: DMG `#9bbc0f` / `#8bac0f` / `#306230` / `#0f380f` (oscuro/medio entre sí solo 1,83: distinguir por forma).
- Clásico claro de un juego blanco sobre negro: papel `#f2efe6` + tinta `#111` + acento cyan `#006b75`.

## Técnicas

- Retro "píxel duro" en canvas: dibujar la escena en un lienzo auxiliar a media resolución (`ctx` como `let` que se cambia en `draw()`, `setTransform(1/p…)`), cuantizar al tono más cercano y reescalar con `imageSmoothingEnabled = false`; además `image-rendering: pixelated` en el `<canvas>` vía `html[data-skin="retro"]`. Cuantizar con `Uint32Array` + caché `Map` color → tono (se vacía en `applySkin`). Coste ~6 ms/frame en headless a 400×300.
- En la escena de baja resolución los textos se vuelven ilegibles: separar etiquetas (p. ej. "3x" de un power-up) en un pase a resolución completa después del reescalado, igual que el HUD.
- Los proyectiles redondos de 2 px desaparecen al cuantizar: dibujarlos como cuadrados de 4 px en retro.
- Partículas con `rgba(...,alpha)` en el código original: pasar a `globalAlpha` + color de la paleta para que la paleta solo guarde colores.
- Brillo: helper `glow(color, blur = C.glow)` que pone `shadowColor`/`shadowBlur` dentro de `save/restore`; texto con un `textGlow` menor (4) para no empastar.
- "Press Start 2P" en el iframe: `<link>` de Google Fonts en `index.html` + `document.fonts.load()` en `applySkin`; ocupa ~1 px por px de tamaño, usar 14 px en HUD y 8 px en etiquetas.
- Verificación: congelar una escena representativa con `browser_evaluate` (variables `let` globales del juego accesibles; `paused = true`, `Math.random = () => 0.9` para que salga la llama) y capturar a 800×600.
- Juego con spritesheet: un flag de paleta `C.style` (`sprite` | `neon` | `retro`) y funciones `drawBlock/drawPaddle/drawBall…` que ramifican por él; clásico sigue usando los sprites, neón y retro se dibujan vectoriales. Más limpio que recolorear el PNG.
- Sprites claros sobre papel (clásico claro): silueta del spritesheet tintada (`source-in` + `fillRect` con `C.outline`) en un lienzo aparte, dibujada 2 px más grande detrás del sprite; se regenera en `applySkin` y tras cargar la hoja.
- Retro sin cuantizar: si todo se dibuja ya con los 4 tonos y las coordenadas se ajustan a la rejilla (`snap(v) = round(v / P) * P`, P = 4), no hace falta lienzo auxiliar ni `getImageData`. Los elementos del mismo tono (ladrillos) se distinguen con motivos de una tinta (puntos, rayas, damero, marco).
- Neón con elementos rellenos: trazo brillante + relleno con `globalAlpha` 0,2–0,28; la pelota/proyectil contrasta con el relleno (superficie dominante) aunque empate en luminancia con el trazo.
- Congelar un juego sin flag de pausa visible: reasignar la función global (`update = () => {}`; las declaraciones `function` son reasignables). Desde la página del reproductor, las `let` del juego se leen con `iframe.contentWindow.eval("score")`.
- Juego por ticks con acumulador: congelar con `acc = -Infinity` (sigue dibujando, nunca avanza) sin activar la pausa que pinta overlay.
- Sprites a color en retro (frutas de `snake`): reducir el recorte a ~18×18 en un lienzo aparte, mapear cada píxel opaco por luminancia a los tonos 1–3 (invertida en modo claro; umbrales 0,2 / 0,55) y cachear por sprite (vaciar en `applySkin`); dibujar ×2 sin suavizado. Envolver en `try/catch` (lienzo contaminado en `file://`) con un bloque de reserva.
- Sprites claros sobre fondo claro, versión barata: `ctx.filter = "drop-shadow(0 0 1px <tinta>)"` solo al dibujar el sprite y `"none"` después.
- Si la skin clásica ya es neón del Vault (p. ej. `snake`), la skin `neon` necesita otra forma, no solo otros colores: cambiar el estilo del jugador (tubo → bloques de luz), la retícula (puntos → líneas) y el color del jugador.

## Trampas

- Con 3+ elementos jugables y fondo oscuro es imposible que todos tengan ≥ 3:1 entre sí por luminancia: priorizar jugador/enemigos y proyectiles/enemigos, y separar lo demás por tono y forma (anotarlo en el registro).
- Variables usadas por `applySkin` (cachés, lienzos) deben declararse antes de la llamada inicial con `?skin=` o hay error de TDZ.
- El fondo del modal de fin (`.modal-bd`, z 80) tapa la barra del reproductor: los botones SKIN/MODO llevan `relative z-[90]`.
- `index.html` de los juegos puede tener CRLF: los reemplazos con `node -e` deben normalizar `\r\n`.
- `npm run lint` del repo falla por cientos de errores previos ajenos; validar con `npx eslint --max-warnings 0 <archivos tocados>`.
- La página `/juegos/[id]/jugar` registra en consola un error previo de Next ("URL data during prerendering…") que no tiene que ver con las skins.
- Líneas o "núcleos" blancos semitransparentes que en oscuro dan brillo desaparecen en modo claro: usar el color de acento con alfa (p. ej. `rgba(0,127,138,.45)`).
- Los nombres de un atlas de sprites pueden no ser su dibujo real (`snake`: `strawberry` es un ajo, `cherry` una berenjena): elegir la fruta de la captura mirándola.
- Los nombres de color de un spritesheet pueden no ser su tono real (arkanoid: `cyan` es verde azulado, `green` azul, `hotpink` naranja): mirar la captura del clásico antes de mapear colores de neón.
- El hook de ESLint (`--max-warnings 0`) bloquea por avisos previos del original (constantes sin uso) en cuanto se reescribe el archivo: quitarlas si no afectan a la mecánica.
- Navegador de Playwright compartido con otros agentes: la URL y el tamaño del viewport pueden cambiar entre llamadas. Navegar y evaluar comprobando `location.href` en la misma tanda y capturar con `target: "canvas"` en lugar del viewport.
