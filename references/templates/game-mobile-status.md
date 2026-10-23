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

Estado inicial (22/10/2026): los 4 juegos tienen mando, adaptador y modo inmersivo de la SPEC 10, pero `mobile-porte` aún no los ha auditado.

Un juego nuevo entra en la tabla al final, con todas sus celdas en ⬜, cuando se añade a `lib/games.ts`.

## Historial

Una entrada por encargo, la más reciente arriba: fecha, juego, qué se corrigió y problemas de plataforma detectados (con su propuesta `/spec …`).
