---
name: sesiones-y-sugerencias
description: Registro de sesiones del game-planner: candidatos propuestos (ids), recomendado, decisiones del usuario y estado del catálogo que influyó
metadata:
  type: project
---

Registro de propuestas para no repetir candidatos. El To Do vivo está en `references/game-suggestions-todo.md`; esto guarda el porqué.

## Estado del catálogo (2026-10-21)

- Reales: `asteroids` (SHOOTER, cyan), `tetris` (PUZZLE, magenta), `arkanoid` (ARCADE, cyan), `snake` (ARCADE, green).
- Huecos: VERSUS sin ningún juego (el filtro sale vacío); color yellow sin usar.
- `references/started-games/` ya está agotado (02–04 integrados) y `souce-assets/` solo tiene `snake-assets/`: todo candidato nuevo es "desde cero" con la plantilla de `/add-game` salvo que aparezca material nuevo.

## Sesión 2026-10-21 (primera ejecución)

- Propuestos: `palas` (PALAS NEÓN, VERSUS yellow, S), `ciclos` (CICLOS DE LUZ, VERSUS magenta, M), `invasion` (INVASIÓN PIXEL, SHOOTER yellow, M).
- Recomendado: `palas`. **Why:** llena VERSUS y yellow con el menor esfuerzo, juego analógico distinto del recién hecho `snake`. `ciclos` se parece a `snake` (rejilla + ticks) y necesita IA de CPU más compleja; `invasion` duplicaría SHOOTER.
- Decisión del usuario: pendiente (sin feedback todavía).

## Sesión 2026-10-21 (lote paralelo, 4 instancias, 5 por categoría)

Registrado por encargo del coordinador; prioridad por categoría (T·P·C):

- VERSUS: `hockey` (5·4·5, S) > `artilleria` > `tanques` > `orbital` > `bombas` (L).
- SHOOTER: `defensa` (5·5·4, M) > `ciempies` > `vector` > `horizonte` (L) > `tunel` (L).
- PUZZLE: `gemas` (5·5·3, M) > `plasma` > `burbujas` (L) > `fusion` > `eco` (pide sonido, inexistente).
- ARCADE: `salto` (5·4·5, S) > `cruce` > `laberinto` (L) > `alunizaje` > `autopista`.
- Aviso: abuso del amarillo (6 del lote + `palas`, `invasion`) y colores repetidos dentro de VERSUS (yellow ×3 con `palas`; magenta `ciclos`/`orbital`), SHOOTER (magenta `vector`/`tunel`; yellow `invasion`/`defensa`), PUZZLE (green `plasma`/`fusion`) y ARCADE (yellow `salto`/`laberinto`). Reasignar color al elegir.
- Recomendado global: sigue `palas` ⭐. Decisión del usuario: pendiente.

## No repetir (ids ya sugeridos)

`palas`, `ciclos`, `invasion`, `hockey`, `artilleria`, `tanques`, `orbital`, `bombas`, `defensa`, `ciempies`, `vector`, `horizonte`, `tunel`, `gemas`, `plasma`, `burbujas`, `fusion`, `eco`, `salto`, `cruce`, `laberinto`, `alunizaje`, `autopista`.

**How to apply:** no volver a proponer ninguno de estos ids (ni su concepto con otro nombre); en la próxima sesión, sincronizar su estado con `GAMES` y `specs/` antes de proponer.
