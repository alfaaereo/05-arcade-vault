---
name: temas-e-ids
description: Registro de game jams — tema, fecha, juego diseñado (id, título, categoría · color, concepto), sus dos propuestas y specs creados; todos los ids listados ya están usados
metadata:
  type: project
---

# Temas e ids de las game jams

Registro del agente `game-jam`. Cada `id` de aquí ya está usado: no se repite en jams futuras.

**Why:** la regla anti-repetición exige no reutilizar ids ni rehacer los mismos juegos si un tema vuelve.
**How to apply:** antes de diseñar, comprobar los ids de abajo junto a `GAMES`, `references/game-suggestions-todo.md`, `specs/` y `specs/game-jam/`.

## Formato

Cada jam produce 1 juego con dos propuestas alternativas (`01-juego-<id>-<enfoque-a>.md` y `02-juego-<id>-<enfoque-b>.md`).

## Jams

La primera LABERINTO VORAZ (2026-10-21, formato antiguo de 3 juegos: `gloton`, `bocado`, `banquete`) se borró el 2026-10-22 y se rehízo con el formato actual. `bocado` y `banquete` quedaron libres.

### 2026-10-22 — LABERINTO VORAZ

- Juego: **GLOTÓN** (`gloton`) · ARCADE · yellow · portada `cover-glot` reutilizada (la del simulado de SPEC 01).
- Concepto: comer 208 puntos en un laberinto propio de 27×22 casillas de 24 px con túnel, perseguido por 4 espectros con IA propia. Juego descrito por el usuario (misma idea que la sugerencia `laberinto` del game-planner).
- A `clasico` (recomendada): 3 vidas, 10 niveles, dispersión/persecución, píldoras, premio; espectros ACECHO, EMBOSCADA, PINZA, ERRANTE; máx. 199.000.
- B `contrarreloj`: sin vidas, reloj 90 s (−10 por captura, +20 por ronda), racha ×1–×5, 8 rondas; espectros ACECHO, EMBOSCADA, GUARDIÁN, RASTRO; máx. 220.080.
- Archivos: `specs/game-jam/gloton/01-juego-gloton-clasico.md`, `specs/game-jam/gloton/02-juego-gloton-contrarreloj.md`.

## IDs usados

- `gloton` (2026-10-22). Reservado por el game-planner: `laberinto`.
