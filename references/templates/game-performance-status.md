# Rendimiento de los juegos

Registro de qué juegos van fluidos dentro del reproductor (`/juegos/<id>/jugar`). El método de medición, los umbrales y las técnicas de optimización están en `.claude/agents/game-performance-booster.md` (sacados del SPEC 12, `specs/12-rendimiento-reproductor-y-frogger.md`). Lo mantiene el subagente `game-performance-booster`: **trabaja un solo juego por encargo, el que le indique la persona**, y al terminar actualiza su fila y su entrada en el historial.

Un juego cumple cuando, en todas sus skins, da **≥ 55 FPS** de mediana en el reproductor a 1280×900 y la diferencia frente al juego abierto directamente es **≤ 10 %**.

## Leyenda

- ✅ Cumple: verificado por `game-performance-booster` con Playwright (capturas en `.playwright-screenshots/perf/<id>-*.png`).
- 🟡 Parcial: medido, pero sin todas las skins, o con una optimización en curso.
- ⬜ Falta: por debajo del umbral o sin auditar.

FPS: mediana de 3 tomas de 3 s. "Mín." es el peor valor entre las skins medidas. La referencia táctil (375×812, CPU ×4) no tiene umbral. "Peor `draw()`" es el coste medio de un frame en ms (mediana de 3 tandas de 200 llamadas, con `getImageData` para forzar el vaciado), en la skin más cara. Es la métrica estable cuando los FPS saturan en 60.

## Estado por juego

| Juego     | ID          | Mín. reproductor | Mín. directo | Δ % (peor) | Peor skin      | Peor `draw()` (ms) | Táctil CPU ×4 (ref.) | Estado | Última revisión |
| --------- | ----------- | :--------------: | :----------: | :--------: | -------------- | :----------------: | :------------------: | :----: | --------------- |
| ASTEROIDS | `asteroids` |        60        |      60      |    0 %     | retro oscuro   |        2,5         |    38 (retro osc.)   |   ✅   | 25/10/2026      |
| TETRIS    | `tetris`    |        60        |      60      |    0 %     | clásico oscuro |        0,07        |  59 (clásico osc.)   |   ✅   | 25/10/2026      |
| ARKANOID  | `arkanoid`  |        60        |      60      |    0 %     | retro claro    |        0,3         |    49 (neón claro)   |   ✅   | 25/10/2026      |
| SNAKE     | `snake`     |        60        |      60      |    0 %     | neón claro     |        1,1         |  54 (clásico osc.)   |   ✅   | 25/10/2026      |
| FROGGER   | `frogger`   |        53        |      60      |    12 %    | neón oscuro    |         —          |    32 (neón osc.)    |   🟡   | 25/10/2026      |

Estado inicial (25/10/2026): tanda final del paso 6 del SPEC 12, con el CSS del reproductor ya congelado. Línea base anterior, del paso 1: ASTEROIDS 47, TETRIS 59, ARKANOID 40, SNAKE 44 y FROGGER 27. TETRIS solo se midió en `clasico oscuro`, porque no tiene skins. SNAKE y TETRIS superan 55, pero falta la comparación con el juego abierto directamente. FROGGER dio 53 en neón oscuro en una sola tanda; al repetirlo en la misma página dio 58–60.

Un juego nuevo entra en la tabla al final, con su estado en ⬜, cuando se añade a `lib/games.ts`.

## Historial

Una entrada por encargo, la más reciente arriba: fecha, juego, FPS antes → después por skin, técnicas aplicadas y problemas de plataforma detectados (con su propuesta `/spec …`).

### 25/10/2026 — ASTEROIDS, TETRIS, ARKANOID y SNAKE (4 instancias en paralelo)

- Cada juego lo revisó una instancia de `game-performance-booster`, en paralelo, en la rama `perf-juegos`. Sus A/B en la misma página sirvieron para decidir. Las cifras de esta tabla salen de una medición posterior en serie, con el equipo en reposo: Chrome headless con GPU (ANGLE D3D11), 1280×900, el original de `d2f86b1` servido con `ctx.route` frente al código nuevo.
- Con el equipo en reposo, todos dan 60 FPS antes y después, en el reproductor y abiertos directamente. Las cifras bajas del SPEC 12 (ASTEROIDS 50, ARKANOID 44) dependían de la carga del equipo. La mejora real es el margen por frame, que es lo que cuenta en móviles y equipos lentos:

| Juego     | Skin (escena)                     | `draw()` antes → después (ms) |
| --------- | --------------------------------- | ----------------------------- |
| ASTEROIDS | neón oscuro (18 rocas)            | 1,70 → 0,48                   |
| ASTEROIDS | neón claro (18 rocas)             | 1,54 → 0,30                   |
| ASTEROIDS | retro oscuro (18 rocas)           | 5,33 → 2,48                   |
| ASTEROIDS | retro claro (18 rocas)            | 3,85 → 2,28                   |
| ARKANOID  | neón oscuro (piloto automático)   | 0,96 → 0,20                   |
| ARKANOID  | clásico oscuro                    | 0,35 → 0,19                   |
| SNAKE     | clásico claro (serpiente de 60)   | 9,67 → 1,08                   |
| SNAKE     | neón claro (serpiente de 60)      | 9,11 → 0,92                   |
| SNAKE     | neón oscuro (serpiente de 60)     | 2,56 → 0,74                   |
| TETRIS    | clásico oscuro                    | 0,07 → 0,07 (sin cambios)     |

- **ASTEROIDS:** sprites de las rocas con el brillo incluido en neón; se dibujan rotados con `ctx.rotate`, porque el desenfoque es isótropo. Además, sprite de bala por skin, `quantize()` de retro que solo consulta la caché cuando cambia el color y scanlines de retro en una capa.
- **ARKANOID:** `bgLayer` con fondo, retícula y ladrillos, que se rehace al romper un ladrillo, en `loadLevel()` y en `applySkin()`. Sprites con brillo para la pala y la bola en neón, HUD cacheado (que se invalida cuando carga la fuente) y scanlines de retro en una capa.
- **SNAKE:** la causa era `ctx.filter = "drop-shadow(…)"` en el perfil de la fruta de los modos claros, unos 20 ms por `drawImage` con el equipo cargado. Ahora la fruta se pinta en un sprite por skin y los bloques de la serpiente llevan el brillo incluido. `bgLayer` cubre fondo, retícula y pared, salvo durante el destello de subida de nivel.
- **TETRIS:** sin cambios. No usa brillo ni gradientes, `draw()` cuesta unos 0,07 ms, no hay mutaciones del DOM y `fitWrapper()` no se ejecuta en el bucle.
- **Aspecto:** las capturas de antes y después (`.playwright-screenshots/perf/<id>-<skin>-<modo>-antes|despues.png`) son equivalentes. Las diferencias son de redondeo subpíxel, de 1–2 niveles de color.
- **Protocolo:** PAUSA, REANUDAR, FIN, JUGAR DE NUEVO, `av:key` y el cambio de skin en plena partida funcionan. ESLint pasa sin avisos en los 3 archivos.
- **Plataforma:** sin problemas; el reproductor y el juego abierto directamente quedan iguales. Problema de herramientas: el MCP de Playwright no admite varias instancias a la vez ("Browser is already in use … use --isolated"), así que cada instancia lanzó su propio Chrome con `playwright-core`. Propuesta: `/spec Configurar el MCP de Playwright con --isolated (o un perfil por agente) para que varios subagentes puedan medir en paralelo`.

### 25/10/2026 — Línea base (SPEC 12)

- Datos copiados de la sección **Mediciones** del SPEC 12 (paso 1), en el navegador de Playwright a 1280×900.
- Diagnóstico del SPEC 12: React no re-renderiza durante la partida. El coste está en la página que envuelve el iframe (retícula animada, `backdrop-filter` del nav, `mix-blend-mode` del CRT) y en el canvas de FROGGER (fondo estático redibujado y `shadowBlur` en ~40 figuras por frame). La skin `neon` es la más lenta en FROGGER, ASTEROIDS y ARKANOID.
- La plataforma se corrige en el SPEC 12. Los otros 4 juegos quedaron fuera de su alcance y se revisan uno a uno con este agente.
- Tras el SPEC 12, los que siguen por debajo de 55 son ASTEROIDS neón oscuro (50) y ARKANOID neón oscuro (44), por el `shadowBlur` de su canvas. FROGGER subió a 53–60 con el fondo cacheado (`bgLayer`) y los sprites con brillo (`spriteFor()`, `paintOn()` en `public/games/frogger/game.js`): el A/B en neón oscuro dio 57 frente a 32, y casi toda la mejora vino de los sprites, no del fondo.
