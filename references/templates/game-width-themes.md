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
| ASTEROIDS | `asteroids` |       🟡       |      ⬜       |     ⬜      |     ⬜     |      ⬜      |     ⬜      | —               |
| TETRIS    | `tetris`    |       🟡       |      🟡       |     ⬜      |     ⬜     |      ⬜      |     ⬜      | —               |
| ARKANOID  | `arkanoid`  |       🟡       |      ⬜       |     ⬜      |     ⬜     |      ⬜      |     ⬜      | —               |
| SNAKE     | `snake`     |       🟡       |      ⬜       |     ⬜      |     ⬜     |      ⬜      |     ⬜      | —               |

Estado inicial (22/10/2026): "Clásico oscuro" es el aspecto actual de cada juego, aún sin el contrato `av:skin`. "Clásico claro" de TETRIS es su toggle LIGHT/DARK propio, que el agente integrará en el contrato.

Un juego nuevo entra en la tabla al final, con todas sus celdas en ⬜, cuando se añade a `lib/games.ts`.

## Historial

Una entrada por encargo, la más reciente arriba: fecha, juego, skins tocadas y notas (paleta elegida, sprites recoloreados, problemas de contraste resueltos).

- 22/10/2026 — Registro creado. Sin skins implementadas todavía.
