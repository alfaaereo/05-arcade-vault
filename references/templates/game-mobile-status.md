# Juegos en móvil

Registro de qué juegos se juegan y se ven bien en dispositivos móviles (navegador del teléfono, vertical y horizontal). El contrato del mando táctil está en `specs/10-controles-tactiles-en-movil.md` y el checklist en `.claude/agents/mobile-porte.md`. Lo mantiene el subagente `mobile-porte`: **trabaja un solo juego por encargo, el que le indique la persona**, y al terminar actualiza su fila y su entrada en el historial.

Un juego cumple cuando sus 5 celdas están en ✅.

## Leyenda

- ✅ Hecha: cumple el checklist de `mobile-porte` y está verificada con Playwright en emulación táctil (capturas en `.playwright-screenshots/mobile/<id>-*.png`).
- 🟡 Parcial: implementada (p. ej. por la SPEC 10) pero sin auditar, o con fallos menores anotados en el historial.
- ⬜ Falta.

## Estado por juego

| Juego     | ID          | Mando (`controls`) | Adaptador `av:key` | Vertical 375×812 | Horizontal 812×375 | Legibilidad HUD | Última revisión |
| --------- | ----------- | :----------------: | :----------------: | :--------------: | :----------------: | :-------------: | --------------- |
| ASTEROIDS | `asteroids` |         🟡         |         🟡         |        🟡        |         🟡         |       🟡        | —               |
| TETRIS    | `tetris`    |         🟡         |         🟡         |        🟡        |         🟡         |       🟡        | —               |
| ARKANOID  | `arkanoid`  |         🟡         |         🟡         |        🟡        |         🟡         |       🟡        | —               |
| SNAKE     | `snake`     |         🟡         |         🟡         |        🟡        |         🟡         |       🟡        | —               |
| FROGGER   | `frogger`   |         ✅         |         ✅         |        🟡        |         ✅         |       ✅        | 23/10/2026      |

Estado inicial (22/10/2026): los 4 juegos tienen mando, adaptador y modo inmersivo de la SPEC 10, pero `mobile-porte` aún no los ha auditado.

Un juego nuevo entra en la tabla al final, con todas sus celdas en ⬜, cuando se añade a `lib/games.ts`.

## Historial

Una entrada por encargo, la más reciente arriba: fecha, juego, qué se corrigió y problemas de plataforma detectados (con su propuesta `/spec …`).

### 23/10/2026 — FROGGER (`frogger`)

- Corregido: HUD del canvas ilegible en vertical (12 px en un lienzo de 800 que se ve a ~275 px de ancho, ≈ 4 px reales). Ahora `drawHUD()` usa 24 px (≈ 8,2 px en 375×812 y 10,2 px en 812×375), vidas a escala 0,62 y barra de tiempo en y = 32 (6 px; 4 px en retro, en rejilla). Revisadas las 6 skins.
- Sin cambios: `controls` (cruceta de 4 direcciones, sin botones ni `repeat`) y adaptador `KEY_OF`, que ya cumplían. Un toque o un dedo mantenido dan un solo salto; multitoque y pausa/reanudar sin teclas pegadas.
- Vertical en 🟡 por dos problemas de plataforma:
  - El nav desborda los 375 px (hamburguesa hasta x = 403): el móvil amplía el viewport a 404 px y hay scroll horizontal en todas las páginas. Propuesta: `/spec Corregir el desbordamiento horizontal del nav en móvil (botón hamburguesa fuera de 375 px)`.
  - En el modal "FIN DEL JUEGO" el botón "GUARDAR PUNTUACIÓN" (x 282→440) se sale del modal (22→382) a 375 px. Propuesta: `/spec Ajustar el modal de fin de juego a 375 px: input y botón de guardar en columna`.
- Nota (plataforma, no bloquea): la cruceta, translúcida, tapa las columnas 0–4 del río y de la carretera en ambas orientaciones. Propuesta: `/spec Colocar el mando táctil fuera del CRT cuando haya espacio (debajo en vertical, a los lados en horizontal)`.
