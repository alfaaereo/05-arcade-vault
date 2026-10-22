# Sugerencias de juegos — To Do

> Mantenido por el subagente `game-planner` (`.claude/agents/game-planner.md`). Cada sugerencia se integra con `/add-game <descripción>` y se implementa con `/spec-impl`. Los juegos ya reales están en `implemented-games.md`.

## Pendientes

- [ ] ⭐ **PALAS NEÓN** (`palas`) · VERSUS · yellow · desde cero · esfuerzo S · sugerido 2026-10-21 — estrena VERSUS (vacía) y el amarillo (sin uso); duelo contra CPU con dificultad creciente, ritmo analógico distinto de `snake`, y la puntuación por golpes y tantos diferencia bien en el Salón.
- [ ] **CICLOS DE LUZ** (`ciclos`) · VERSUS · magenta · desde cero · esfuerzo M · sugerido 2026-10-21 — VERSUS contra 1–3 motos CPU con estelas neón; reutiliza el acumulador de ticks de `snake`, pero la IA y el parecido con `snake` lo dejan detrás de `palas`.
- [ ] **INVASIÓN PIXEL** (`invasion`) · SHOOTER · yellow · desde cero · esfuerzo M · sugerido 2026-10-21 — oleadas de alienígenas en formación, refugios y nave bonus; muy competitivo, pero sería el segundo SHOOTER.

<!-- Lote 2026-10-21 (4 instancias en paralelo, 5 por categoría). Orden dentro de cada categoría = prioridad. Puntuación T·P·C = Técnico · Producto · Coste. -->

- [ ] **HOCKEY NEÓN** (`hockey`) · VERSUS · cyan · desde cero · esfuerzo S · T·P·C 5·4·5 · sugerido 2026-10-21 — hockey de aire contra mazo CPU; gana la ronda a 7 y la partida acaba al perder una ronda.
- [ ] **DUELO DE CAÑONES** (`artilleria`) · VERSUS · yellow · desde cero · esfuerzo M · T·P·C 4·4·4 · sugerido 2026-10-21 — artillería por turnos con viento y terreno destructible contra tanque CPU.
- [ ] **TANQUES DE NEÓN** (`tanques`) · VERSUS · green · desde cero · esfuerzo M · T·P·C 4·4·3 · sugerido 2026-10-21 — duelo de tanques en arena-laberinto con balas que rebotan contra 1–3 CPU, 3 vidas.
- [ ] **DUELO ORBITAL** (`orbital`) · VERSUS · magenta · desde cero · esfuerzo M · T·P·C 4·3·4 · sugerido 2026-10-21 — duelo de naves con la gravedad de una estrella contra CPU.
- [ ] **BOMBAS PIXEL** (`bombas`) · VERSUS · yellow · desde cero · esfuerzo L · T·P·C 4·5·2 · sugerido 2026-10-21 — laberinto de bloques destructibles con bombas contra 3 rivales CPU.
- [ ] **DEFENSA ORBITAL** (`defensa`) · SHOOTER · yellow · desde cero · esfuerzo M · T·P·C 5·5·4 · sugerido 2026-10-21 — proteger 6 ciudades de misiles con interceptores (ratón, alternativa teclado).
- [ ] **CIEMPIÉS NEÓN** (`ciempies`) · SHOOTER · green · desde cero · esfuerzo M · T·P·C 5·4·4 · sugerido 2026-10-21 — ciempiés que baja entre setas y se parte al disparar, 3 vidas.
- [ ] **ARENA VECTOR** (`vector`) · SHOOTER · magenta · desde cero · esfuerzo M · T·P·C 4·4·4 · sugerido 2026-10-21 — twin-stick con enjambres geométricos y multiplicador.
- [ ] **ESCUADRÓN HORIZONTE** (`horizonte`) · SHOOTER · cyan · desde cero · esfuerzo L · T·P·C 4·4·2 · sugerido 2026-10-21 — scroll horizontal con paralaje, power-ups y jefe por sector.
- [ ] **TÚNEL ESPECTRAL** (`tunel`) · SHOOTER · magenta · desde cero · esfuerzo L · T·P·C 3·4·2 · sugerido 2026-10-21 — tubo vectorial pseudo-3D, disparar a enemigos por carriles.
- [ ] **GEMAS NEÓN** (`gemas`) · PUZZLE · yellow · desde cero · esfuerzo M · T·P·C 5·5·3 · sugerido 2026-10-21 — match-3 8×8 contrarreloj de 90 s con cascadas.
- [ ] **FLUJO DE PLASMA** (`plasma`) · PUZZLE · green · desde cero · esfuerzo M · T·P·C 5·4·3 · sugerido 2026-10-21 — colocar tuberías antes de que el plasma (por ticks) se derrame.
- [ ] **BURBUJAS NEÓN** (`burbujas`) · PUZZLE · cyan · desde cero · esfuerzo L · T·P·C 4·4·2 · sugerido 2026-10-21 — disparar burbujas en rejilla hexagonal con techo que baja.
- [ ] **FUSIÓN BINARIA** (`fusion`) · PUZZLE · green · desde cero · esfuerzo S · T·P·C 5·3·5 · sugerido 2026-10-21 — rejilla 4×4: deslizar y fusionar fichas.
- [ ] **ECO NEÓN** (`eco`) · PUZZLE · magenta · desde cero · esfuerzo S · T·P·C 5·2·5 · sugerido 2026-10-21 — repetir secuencias de 4 paneles; pide sonido y la plataforma no lo tiene (riesgo).
- [ ] **SALTO CÓSMICO** (`salto`) · ARCADE · yellow · desde cero · esfuerzo S · T·P·C 5·4·5 · sugerido 2026-10-21 — saltador vertical infinito con plataformas móviles y frágiles.
- [ ] **CRUCE NEÓN** (`cruce`) · ARCADE · magenta · desde cero · esfuerzo M · T·P·C 5·4·4 · sugerido 2026-10-21 — rana que cruza tráfico y troncos hasta 5 nidos, 3 vidas.
- [ ] **LABERINTO VORAZ** (`laberinto`) · ARCADE · yellow · desde cero · esfuerzo L · T·P·C 4·5·3 · sugerido 2026-10-21 — comer puntos en un laberinto con 4 fantasmas con IA propia.
- [ ] **ALUNIZAJE** (`alunizaje`) · ARCADE · green · desde cero · esfuerzo M · T·P·C 4·3·4 · sugerido 2026-10-21 — aterrizar un módulo vectorial con gravedad y combustible.
- [ ] **AUTOPISTA NEÓN** (`autopista`) · ARCADE · cyan · desde cero · esfuerzo M · T·P·C 4·4·3 · sugerido 2026-10-21 — carrera cenital infinita esquivando tráfico, con combustible.

## En curso

## Implementados

- [x] **ASTEROIDS** (`asteroids`) · SPEC 05 · implementado 2026-10-19
- [x] **TETRIS** (`tetris`) · SPEC 07 · implementado 2026-10-20
- [x] **ARKANOID** (`arkanoid`) · SPEC 08 · implementado 2026-10-20
- [x] **SNAKE** (`snake`) · SPEC 09 · implementado 2026-10-21

## Descartados
