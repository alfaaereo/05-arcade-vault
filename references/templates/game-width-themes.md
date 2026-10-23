# Juegos con skins

Registro de qué juegos tienen ya las skins obligatorias (`clasico`, `neon`, `retro`, cada una en modo `oscuro` y `claro`). El contrato y los criterios de modo oscuro están en `.claude/agents/skin-designer.md`. Lo mantiene el subagente `skin-designer`: **trabaja un solo juego por encargo, el que le indique la persona**, y al terminar actualiza su fila y su entrada en el historial. Nunca aplica skins a otros juegos por su cuenta.

Un juego cumple cuando sus 6 celdas están en ✅.

## Leyenda

- ✅ Hecha: implementada con el contrato `av:skin` (`SKINS` + `applySkin` + `?skin=&mode=`) y verificada con captura de Playwright en `.playwright-screenshots/skins/<id>-<skin>-<mode>.png`.
- 🟡 Parcial: el aspecto existe, pero no sigue el contrato `av:skin` o no se ha verificado.
- ⬜ Falta.

## Estado por juego

| Juego     | ID          | Clásico oscuro | Clásico claro | Neón oscuro | Neón claro | Retro oscuro | Retro claro | Última revisión |
| --------- | ----------- | :------------: | :-----------: | :---------: | :--------: | :----------: | :---------: | --------------- |
| ASTEROIDS | `asteroids` |       ✅       |      ✅       |     ✅      |     ✅     |      ✅      |     ✅      | 22/10/2026      |
| TETRIS    | `tetris`    |       🟡       |      🟡       |     ⬜      |     ⬜     |      ⬜      |     ⬜      | —               |
| ARKANOID  | `arkanoid`  |       ✅       |      ✅       |     ✅      |     ✅     |      ✅      |     ✅      | 22/10/2026      |
| SNAKE     | `snake`     |       ✅       |      ✅       |     ✅      |     ✅     |      ✅      |     ✅      | 22/10/2026      |

Estado inicial (22/10/2026): "Clásico oscuro" es el aspecto actual de cada juego, aún sin el contrato `av:skin`. "Clásico claro" de TETRIS es su toggle LIGHT/DARK propio, que el agente integrará en el contrato.

Un juego nuevo entra en la tabla al final, con todas sus celdas en ⬜, cuando se añade a `lib/games.ts`.

## Historial

Una entrada por encargo, la más reciente arriba: fecha, juego, skins tocadas y notas (paleta elegida, sprites recoloreados, problemas de contraste resueltos).

- 22/10/2026 — `snake`: las 6 celdas (clasico, neon, retro × oscuro, claro). Solo el juego; la plataforma ya enviaba `av:skin`. Flags de paleta: `grid` (`dots`/`lines`/`blocks`), `wallStyle` (`glow`/`solid`), `snakeStyle` (`tube`/`segments`/`blocks`), `fruitStyle` (`sprite`/`tones`).
  - Clásico: oscuro = original intacto (tubo verde `#00ff88`/`#0a7a4e`, pared magenta con resplandor, retícula de puntos cyan, HUD cyan/amarillo sobre `#0f0f1a`); claro = `#f2f3f7`, HUD `#e3e5ee` con `#006b75`/`#6b5f00` (4,97 y 5,12), tubo `#00754a`/`#008a5c`, pared `#c8005a`, frutas perfiladas con `ctx.filter = drop-shadow(0 0 1px #1a1a2e)` (el ajo blanco no se leía sobre papel), brillo ×0,25.
  - Neón: "cadena de luz" (bloque redondeado por celda unido por un hilo, de cabeza a cola en degradado) en vez de tubo; oscuro = `#0a0a0f`, serpiente `#00f5ff`→`#007a85`, pared `#e8005f`, retícula de líneas magenta al 12 %, halo de fruta amarillo, HUD cyan/`#ff4d9a` con `textGlow` 4, brillo ×1,3; claro = `#eef0fa`, serpiente `#007f8a`→`#178c96` con hilo `rgba(0,127,138,.45)` (el blanco desaparecía), pared `#c8005a`, halo `#6b5f00`, HUD `#006b75`/`#a8004a`.
  - Retro: sin lienzo auxiliar; todo en 4 tonos sobre rejilla de 4 px: serpiente de bloques de 32 px con puentes y centro en el tono medio, marco sólido de 4 px que parpadea al subir de nivel, scanlines cada 4 px. Frutas recoloreadas: el recorte se reduce a 18×18, se cuantiza por luminancia a los tonos 1–3 (invertida en claro) y se cachea por fruta (`toneFruits`, se vacía en `applySkin`); verificadas las 22 frutas en `snake-retro-frutas.png`. Oscuro = `#071108`/`#1e3a1b`/`#4f8a2c`/`#d4f7a0`; claro = DMG `#9bbc0f`/`#8bac0f`/`#306230`/`#0f380f`.
  - Contrastes del oscuro: HUD ≥ 14:1 en clásico y neón, 10,51 en retro (`#d4f7a0` sobre `#1e3a1b`). Clásico serpiente/fondo 14,73, pared/fondo 5,15, serpiente/pared 2,86 (original, se respeta; distintos por tono). Neón serpiente/fondo 14,58, cola/fondo 3,88, serpiente/pared 3,37 (con `#ff006e` daba 2,83). Retro serpiente/fondo 16,12, pared/fondo 4,58, serpiente/pared 3,52; la mayoría de frutas caen en el tono 2 (3,52 contra la serpiente), pero las claras (ajo, limón…) caen en el tono 3 como la serpiente: se distinguen por forma. Muerta, la serpiente baja al tono 2 / gris.
- 22/10/2026 — `arkanoid`: las 6 celdas (clasico, neon, retro × oscuro, claro). Solo el juego; la plataforma ya enviaba `av:skin`. `C.style` elige el dibujo: `sprite` (spritesheet), `neon` (vectorial) o `retro` (rejilla de 4 px, sin imágenes).
  - Clásico: oscuro = original intacto (spritesheet sobre `#000`, HUD `#fff`); claro = papel `#f2efe6`, HUD `#111`, sprites con contorno `#111` (silueta del spritesheet tintada con `source-in`, 2 px mayor, regenerada en `applySkin`) y borde de 1 px en los ladrillos, porque la pelota y la pala gris claro no se leían sobre papel.
  - Neón: oscuro = `#0a0a0f`, pala `#ff006e`, pelota `#f5ff00`, HUD `#e6e9ff`, ladrillos con trazo + relleno al 28 % (rojo `#ff3355`, amarillo `#f5ff00`, verde `#00ff88`, violeta `#b026ff`, naranja `#ff8c1a`, azul `#00f5ff`, gris `#8a8fb5`), retícula cyan al 6 %, `shadowBlur` 12 (texto 4), "Press Start 2P"; claro = `#eef0fa`, pala `#c8005a`, pelota `#0a0a0f`, ladrillos `#c8102e` / `#6b5f00` / `#00754a` / `#6a1fc0` / `#b35900` / `#007f8a` / `#4a4f70` con relleno al 20 %, brillo 3. Explosión: contorno que se expande y se desvanece.
  - Retro: ladrillos lisos en el tono 3 diferenciados por motivo de una tinta (liso, puntos, raya, marco, damero, barras, ladrillo), pelota 4×4 sin esquinas, pala con extremos redondeados, explosión de píxeles parpadeantes, scanlines; oscuro = `#071108` / `#1e3a1b` / `#4f8a2c` (ladrillos, pala) / `#d4f7a0` (pelota, HUD); claro = DMG `#9bbc0f` / `#8bac0f` / `#306230` / `#0f380f`.
  - Contrastes del oscuro: HUD 21 (clásico), 16,43 (neón), 16,12 (retro). Neón: pala/fondo 5,15, pelota/pala 3,50, pelota/relleno de ladrillo ≥ 7,89 (trazo de ladrillo/fondo ≥ 4,30, el violeta el más justo). Retro: ladrillos y pala/fondo 4,58, pelota/ladrillos y pelota/pala 3,52. Casos justos asumidos: en clásico oscuro pelota y pala son ambas gris claro (original, 1:1); en neón la pelota amarilla contra el trazo de los ladrillos amarillos o azules es 1,0–1,24, pero contra su relleno (la superficie dominante) es ≥ 7,89; rojo/naranja en neón 1,54 (filas distintas, se separan por tono); en retro claro pelota/pala 1,83 (se distinguen por forma).
  - Los nombres de color del spritesheet no son su tono real (`cyan` = verde azulado, `green` = azul, `magenta` = violeta, `hotpink` = naranja): las paletas vectoriales siguen el tono real. Se quitaron las constantes sin uso `BLOCK_ROWS` y `BLOCK_COLORS` (ESLint del hook).
- 22/10/2026 — `asteroids`: las 6 celdas (clasico, neon, retro × oscuro, claro). Primera implementación de `av:skin` también en la plataforma (botones SKIN/MODO en `EmbeddedGamePlayer`, persistencia `av_skin_<id>`).
  - Clásico: oscuro = original intacto (todo `#fff` sobre `#000`, power-up `#0ff`); claro = papel `#f2efe6`, tinta `#111`, power-up `#006b75`, llama `#c2410c`.
  - Neón: oscuro = `#0a0a0f`, nave `#00f5ff`, rocas `#e8005f`, balas `#f5ff00`, power-up `#00ff88`, HUD `#e6e9ff`, retícula cyan al 6 %, `shadowBlur` 12 (texto 4), "Press Start 2P"; claro = `#eef0fa`, nave `#007f8a`, rocas `#c8005a`, balas `#6b5f00`, power-up `#00754a`, brillo 3.
  - Retro: escena a media resolución (400×300) cuantizada a 4 tonos y reescalada sin suavizado, balas cuadradas, scanlines; oscuro = `#071108` / `#1e3a1b` / `#4f8a2c` (rocas) / `#d4f7a0` (nave, balas, HUD); claro = DMG `#9bbc0f` / `#8bac0f` / `#306230` / `#0f380f`.
  - Contrastes del oscuro: HUD ≥ 16:1 en las tres; neón rocas/fondo 4,32, nave/rocas 3,37, balas/rocas 4,17, power-up/rocas 3,41 (rocas `#ff006e` daban 2,83 y se oscurecieron); retro rocas/fondo 4,58, nave/rocas 3,52 (con `#5c9a34` daban 2,69). Casos justos asumidos: en neón nave, balas y power-up tienen luminancia parecida (1,0–1,2:1) y se distinguen por tono y forma; en clásico oscuro todo es blanco por fidelidad al original; en retro claro nave/rocas 1,83 (modo claro, se distinguen por forma).
- 22/10/2026 — Registro creado. Sin skins implementadas todavía.
