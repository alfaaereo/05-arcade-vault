---
name: add-game
description: Genera el spec para integrar un juego real en Arcade Vault (desde references/started-games/ o creado desde cero) con iframe, protocolo postMessage av:* y leaderboard en Supabase. No escribe código; el spec se implementa después con /spec-impl.
disable-model-invocation: true
argument-hint: "<carpeta de references/started-games (p. ej. 03-tetris) o descripción del juego nuevo>"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(git status:*)
---

# /add-game — Spec de integración de un juego real

## Contexto de sesión

Fecha de hoy (úsala en la cabecera del spec, nunca la inventes):
!`date +%F`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "No existe la carpeta specs/"`

Juegos de referencia disponibles:
!`ls references/started-games/ 2>/dev/null || echo "No existe references/started-games/"`

Juegos ya servidos desde public/:
!`ls public/games/ 2>/dev/null || echo "No hay juegos en public/games/"`

Migraciones de Supabase:
!`ls supabase/migrations/ 2>/dev/null || echo "No hay migraciones"`

Catálogo actual (`id` y `src`; un juego con `src` ya es real):
!`grep -n 'id:\|src:' lib/games.ts`

---

Este skill **no escribe código ni toca la base de datos**. Su único resultado es un archivo `specs/NN-juego-<id>.md` en estado `Borrador` que sigue el patrón de SPEC 05 (juego en iframe) y SPEC 06 (leaderboard en Supabase). El usuario lo revisa, lo pasa a `Aprobado` y lo implementa con `/spec-impl`.

Archivos de apoyo de este skill (léelos en la Fase 1):

- `protocolo-av.md`: contrato `postMessage` `av:*` y adaptador JS de referencia.
- `checklist-plataforma.md`: qué se toca en la plataforma y en Supabase, y criterios estándar.
- `spec-template.md`: esqueleto del spec que vas a rellenar.
- `plantilla-juego/`: base `index.html` + `game.js` para juegos creados desde cero.

## Reglas

- Responde en el idioma del prompt inicial. Los specs del repo están en español: el spec se escribe en español.
- No inventes decisiones. Si algo no se deduce del código o de los specs, pregunta.
- No edites nada fuera de `specs/`. No crees ramas, no copies archivos a `public/`, no apliques migraciones.
- `references/` es solo lectura, siempre.

---

## Fase 1 — Contexto

Lee, en este orden:

1. `CLAUDE.md` (y `AGENTS.md` si lo referencia).
2. `specs/05-juego-asteroids-en-iframe.md` y `specs/06-leaderboard-en-supabase.md`. Si ya existe algún spec `NN-juego-*.md` posterior, lee el más reciente: puede haber convenciones nuevas.
3. `lib/games.ts`, `components/embedded-game-player.tsx`, `components/game-over-modal.tsx` y `lib/save-score.ts` (por `MAX_SCORE` y `PLAYER_NAME_RE`).
4. `public/games/asteroids/game.js` e `index.html`: es la implementación de referencia del protocolo.
5. `protocolo-av.md` y `checklist-plataforma.md` de este skill.

## Fase 2 — Origen del juego

El argumento recibido es: `$ARGUMENTS`

- **Vacío:** pregunta qué juego quieres integrar. Muestra la lista de `references/started-games/` y ofrece también "crear uno nuevo". Espera la respuesta.
- **Coincide con una carpeta de `references/started-games/`** (por nombre completo `03-tetris`, por número `03` o por slug `tetris`): **modo referencia**.
- **Cualquier otra cosa:** **modo nuevo**. El argumento es la descripción del juego. Si no queda claro si se refiere a una carpeta de referencia, pregunta.

Antes de seguir, comprueba que no está ya integrado: si el juego ya tiene `src` en `GAMES` o una carpeta en `public/games/`, para y avisa. Ofrece en su lugar hacer un spec de mejora con `/spec`.

## Fase 3 — Análisis (solo lectura)

### Modo referencia

Lee todos los archivos de la carpeta (también `README.md` y `CLAUDE.md` del juego si existen) y rellena esta **ficha de adaptación**. Muéstrasela al usuario antes de preguntar:

| Aspecto               | Qué buscar                                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archivos              | `index.html`, `.js`, `.css`, `assets/` (sprites, sonidos), `levels.js`… Cuáles hay que copiar y cuáles no (`.DS_Store`, `.claude/`, `.agents/`, `.github/`, `specs/`, `skills-lock.json`, `.gitignore`). |
| Bucle                 | `requestAnimationFrame` con `dt`, `setInterval`/`setTimeout`, o mixto. Dónde se calcula `dt` y si está limitado.                                                                                         |
| Entradas              | Teclas usadas (para `preventDefault`), ratón (coordenadas y escalado), táctil. Listeners en `window` o `document`.                                                                                       |
| Puntuación            | Variable, si es entera y su orden de magnitud posible frente a `MAX_SCORE` (10.000.000).                                                                                                                 |
| Fin de partida        | Función o estado donde se pierde (`gameover`, `gameOver = true`…). Ahí va `endGame()`.                                                                                                                   |
| Mecanismos propios    | Pausa (tecla P/Esc), reinicio (Espacio, botón), overlays DOM, botones, toggle de tema, `localStorage` (récord local).                                                                                    |
| HUD                   | Dibujado en el canvas o en el DOM fuera del canvas.                                                                                                                                                      |
| Lienzo                | Tamaño y proporción. ¿Es 4:3? ¿Hay elementos alrededor del canvas que ocupen espacio?                                                                                                                    |
| Dependencias externas | CDN, fuentes web, módulos ES, rutas absolutas a assets (deben funcionar desde `/games/<id>/`).                                                                                                           |

Ejemplos de lo que encontrarás: Tetris tiene HUD y overlay en el DOM, pausa propia y toggle de tema; Arkanoid usa ratón, spritesheet, sonidos y `levels.js`. Cada uno de estos puntos se convierte en una decisión o un paso del spec.

### Modo nuevo

Pregunta (en un bloque) la mecánica principal, los controles, cómo se puntúa, cómo sube la dificultad y cuándo acaba la partida. Por defecto:

- Se parte de `plantilla-juego/` de este skill: canvas 800×600 (4:3), JS sin dependencias ni build, adaptador `av:*` ya integrado.
- Aspecto: **tema neón del Vault** (paleta y "Press Start 2P" de `app/globals.css`), HUD dentro del canvas. El spec debe pedir usar `/frontend-design` para el diseño visual del juego.
- Solo teclado. Sin sonido ni táctil, salvo que el usuario lo pida.

## Fase 4 — Preguntas

Usa `AskUserQuestion` en bloques de 3 a 5 preguntas. Propón siempre una opción recomendada basada en el análisis. Temas obligatorios:

1. **Identidad:** `id` (slug en minúsculas para la URL `/juegos/<id>`), `title` (mayúsculas), textos `short` y `long` en español (propón un borrador).
2. **Catálogo:** si se parece a un juego simulado de `GAMES` (p. ej. Tetris ↔ CAÍDA, Arkanoid ↔ BLOQUE BUSTER, Snake ↔ SERPENTINA), pregunta **siempre**: entrada nueva al final de `GAMES` (como asteroids, la simulada queda igual) o añadir `src` a la entrada simulada (conserva su URL y su id, que pasa a la tabla `games`). Si no se parece a ninguno, entrada nueva.
3. **Presentación:** `cat` (`ARCADE` | `PUZZLE` | `SHOOTER` | `VERSUS`), `color` (`cyan` | `magenta` | `yellow` | `green`) y portada: reutilizar un `cover-*` existente de `app/globals.css` o crear `cover-<id>` (nuevo trabajo de CSS).
4. **Controles propios en modo embebido:** pausa, reinicio y overlays del juego. Por defecto se desactivan en modo embebido porque la plataforma manda (PAUSA/FIN/JUGAR DE NUEVO), y se conservan abierto directamente.
5. **Aspecto visual** (modo referencia): conservar el original (como SPEC 05) o hacer reskin neón.
6. **Proporción** (solo si no es 4:3): adaptar el juego a 4:3 o adaptar el reproductor (`.crt-screen` y la fórmula de `max-w` de `EmbeddedGamePlayer` dan 4:3 por hecho).
7. **Fuera de alcance:** confirma la lista por defecto (sonido, táctil, stats en vivo en la barra, récord real en detalle y tarjetas, `plays` real, antitrampas) y pregunta si hay algo más.

No avances hasta tener respuesta a todos los puntos aplicables.

## Fase 5 — Redacción del spec

1. Calcula `NN` = siguiente número libre en `specs/`. Nombre del archivo: `specs/NN-juego-<id>.md`.
2. Rellena `spec-template.md`: sustituye todos los `{{…}}`, borra las líneas `<!-- … -->` y los pasos o criterios que no apliquen (p. ej. el paso 5 si el juego ya es 4:3). Añade decisiones y riesgos propios del juego que salieron en la ficha.
3. Usa las secciones y fórmulas de `checklist-plataforma.md` y el contrato de `protocolo-av.md`. No repitas el protocolo entero: el spec referencia SPEC 05 y lista solo lo que cambia en este juego.
4. Muestra el borrador sección por sección (Alcance, Modelo de datos, Plan, Criterios, Decisiones/Riesgos) y pide confirmación o cambios con `AskUserQuestion` tras cada bloque.
5. Guarda el archivo con `> **Estado:** Borrador`.

## Fase 6 — Cierre

Muestra:

```
✅ Spec creado: specs/NN-juego-<id>.md (Borrador)

Siguientes pasos:
  1. Revísalo y cambia el estado a "Aprobado" (lo hace la persona, no el agente).
  2. Ejecuta /spec-impl NN-juego-<id>
```

No hagas nada más.
