# Rendimiento de los juegos

Registro de qué juegos van fluidos dentro del reproductor (`/juegos/<id>/jugar`). El método de medición, los umbrales y las técnicas de optimización están en `.claude/agents/game-performance-booster.md` (sacados del SPEC 12, `specs/12-rendimiento-reproductor-y-frogger.md`). Lo mantiene el subagente `game-performance-booster`: **trabaja un solo juego por encargo, el que le indique la persona**, y al terminar actualiza su fila y su entrada en el historial.

Un juego cumple cuando, en todas sus skins, da **≥ 55 FPS** de mediana en el reproductor a 1280×900 y la diferencia frente al juego abierto directamente es **≤ 10 %**.

## Leyenda

- ✅ Cumple: verificado por `game-performance-booster` con Playwright (capturas en `.playwright-screenshots/perf/<id>-*.png`).
- 🟡 Parcial: medido, pero sin todas las skins, o con una optimización en curso.
- ⬜ Falta: por debajo del umbral o sin auditar.

FPS: mediana de 3 tomas de 3 s. "Mín." es el peor valor entre las skins medidas. La referencia táctil (375×812, CPU ×4) no tiene umbral.

## Estado por juego

| Juego     | ID          | Mín. reproductor | Mín. directo | Δ % (peor) | Peor skin      | Táctil CPU ×4 (ref.) | Estado | Última revisión |
| --------- | ----------- | :--------------: | :----------: | :--------: | -------------- | :------------------: | :----: | --------------- |
| ASTEROIDS | `asteroids` |        47        |      —       |     —      | neón claro     |          —           |   ⬜   | —               |
| TETRIS    | `tetris`    |        59        |      —       |     —      | clásico oscuro |          —           |   🟡   | —               |
| ARKANOID  | `arkanoid`  |        40        |      —       |     —      | neón oscuro    |          —           |   ⬜   | —               |
| SNAKE     | `snake`     |        44        |      —       |     —      | clásico claro  |          —           |   ⬜   | —               |
| FROGGER   | `frogger`   |        27        |      55      |    51 %    | neón oscuro    |    21 (neón osc.)    |   🟡   | —               |

Estado inicial (25/10/2026): línea base del paso 1 del SPEC 12, antes de sus correcciones. TETRIS solo se midió en `clasico oscuro` (no tiene skins). FROGGER queda en 🟡 mientras el SPEC 12 (CSS del reproductor, fondo cacheado y sprites) no esté fusionado. Cuando lo esté, hay que volver a medirlo.

Un juego nuevo entra en la tabla al final, con su estado en ⬜, cuando se añade a `lib/games.ts`.

## Historial

Una entrada por encargo, la más reciente arriba: fecha, juego, FPS antes → después por skin, técnicas aplicadas y problemas de plataforma detectados (con su propuesta `/spec …`).

### 25/10/2026 — Línea base (SPEC 12)

- Datos copiados de la sección **Mediciones** del SPEC 12 (paso 1), en el navegador de Playwright a 1280×900.
- Diagnóstico del SPEC 12: React no re-renderiza durante la partida. El coste está en la página que envuelve el iframe (retícula animada, `backdrop-filter` del nav, `mix-blend-mode` del CRT) y en el canvas de FROGGER (fondo estático redibujado y `shadowBlur` en ~40 figuras por frame). La skin `neon` es la más lenta en FROGGER, ASTEROIDS y ARKANOID.
- La plataforma se corrige en el SPEC 12. Los otros 4 juegos quedaron fuera de su alcance y se revisan uno a uno con este agente.
