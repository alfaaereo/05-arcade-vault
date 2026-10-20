<!-- Esqueleto para /add-game. Sustituye todos los {{…}}, borra los comentarios y los pasos/criterios que no apliquen. Mismos encabezados que SPEC 05 y SPEC 06. -->

# SPEC {{NN}} — Juego real {{TITULO}} embebido y con leaderboard

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** {{AAAA-MM-DD}}
> **Objetivo:** {{Añadir el juego {{TITULO}} de `references/started-games/{{NN-nombre}}/` | Crear el juego {{TITULO}}}} y hacerlo jugable en `/juegos/{{id}}/jugar` dentro de un iframe, con su puntuación guardada en Supabase y visible en `/salon`.

## Por qué existe este spec

{{Por qué este juego, de dónde viene y qué cambia respecto a lo que hay hoy (p. ej. sustituye a la entrada simulada X o es una entrada nueva). Una vez el juego esté en `games`, el guardado real y el Salón real llegan solos (SPEC 06).}}

## Alcance

**Entra:**

- {{Copia de `index.html`, `game.js`, … en `public/games/{{id}}/`; `references/started-games/{{NN-nombre}}/`queda intacto. | Juego nuevo en`public/games/{{id}}/`a partir de la plantilla de`/add-game`, con el tema neón del Vault, diseñado con `/frontend-design`.}}
- Cambios en `index.html`: el canvas escala para llenar el iframe manteniendo 4:3, sin borde ni barras de scroll. {{Ocultar overlays/botones DOM en modo embebido, si los hay.}}
- Cambios en `game.js`, según el protocolo `av:*` de SPEC 05:
  - `preventDefault` en `keydown` para {{teclas}}.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al terminar la partida no se muestra {{overlay propio}} ni se reinicia con {{tecla/botón}}. Se envía `av:gameover` una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart` y `av:end`. {{Variante: intervalo, pausa propia, sonido, ratón…}}
  - Abierto directamente, el juego se comporta como el original.
- {{Nueva entrada `{{id}}`al final de`GAMES`| Campo`src`en la entrada existente`{{id}}`}} en `lib/games.ts`.
- {{Portada: reutiliza `cover-*` | nueva clase `cover-{{id}}`en`app/globals.css`}}.
- Migración `supabase/migrations/<version>_add_{{id}}_to_games.sql` que inserta `{{id}}` en `games`, aplicada con `apply_migration`.
- Actualizar `CLAUDE.md` (secciones SPEC 05 y SPEC 06).

**Fuera de alcance (para specs futuros):**

- {{Reskin del juego, si se conserva el original.}}
- Controles táctiles y sonido {{si no los tiene ya}}.
- Puntuación, vidas o nivel en vivo en la barra de la plataforma.
- Leaderboard real en `/juegos/{{id}}` (top 10 y récord) y en las tarjetas; `plays` real.
- Antitrampas más allá de los límites de SPEC 06.
- Portar el motor a TypeScript o a un Client Component.
- Framework de tests.
- {{Otros que salieron en las preguntas.}}

## Modelo de datos

```ts
// lib/games.ts — {{entrada nueva al final de GAMES | cambio en la entrada existente}}
{
  id: "{{id}}",
  title: "{{TITULO}}",
  short: "{{short}}",
  long: "{{long}}",
  cat: "{{CAT}}",
  cover: "{{cover}}",
  color: "{{color}}",
  best: 0,
  plays: "0",
  src: "/games/{{id}}/index.html",
}
```

```sql
-- supabase/migrations/<version>_add_{{id}}_to_games.sql
insert into public.games (id, title) values ('{{id}}', '{{TITULO}}');
```

Convenciones:

- Protocolo `av:*` igual que SPEC 05: el juego solo acepta mensajes con `event.source === window.parent` y `event.origin === location.origin`, y responde `av:gameover { score }` una vez por partida.
- `score` enviado: {{la variable `score` del juego, entera | `Math.min(Math.floor(score), 10_000_000)`}}.
- Fin de partida: {{función/estado donde se llama a `endGame()`}}.
- {{Teclas del juego y su mapeo.}}
- El iframe lleva `title="{{TITULO}}"` (lo pone `EmbeddedGamePlayer` desde `game.title`).

## Plan de implementación

Antes de empezar, leer `specs/05-juego-asteroids-en-iframe.md`, `specs/06-leaderboard-en-supabase.md` y `public/games/asteroids/game.js` como referencia del protocolo. {{Modo nuevo o portada nueva: usar `/frontend-design`, como indica `CLAUDE.md`.}}

1. {{Copiar a `public/games/{{id}}/`los archivos {{lista}} | Crear`public/games/{{id}}/`desde la plantilla de`/add-game`e implementar la mecánica}}. Ajustar el CSS de`index.html`para que el canvas llene la ventana manteniendo 4:3 y añadir`preventDefault`a las teclas del juego. Verificación:`/games/{{id}}/index.html` se juega {{como el original | completo}}, incluido {{su pantalla de fin}}.
2. Añadir a `game.js` la detección de modo embebido, el listener de `av:pause`/`av:resume`/`av:restart`/`av:end` y el envío único de `av:gameover`. En modo embebido no se muestra {{overlay}} ni se reinicia con {{tecla}}. {{Variantes de la ficha.}} Verificación: abierto directamente sigue igual que en el paso 1.
3. {{Añadir la entrada `{{id}}`al final de`GAMES`| Añadir`src`a la entrada`{{id}}`}}{{ y la clase `cover-{{id}}`}}. Verificación: `/games`muestra la tarjeta,`/juegos/{{id}}`muestra el detalle y`/juegos/{{id}}/jugar` usa el reproductor embebido.
4. Crear `supabase/migrations/<version>_add_{{id}}_to_games.sql` y aplicarlo con `apply_migration` (nombre `add_{{id}}_to_games`); renombrar el archivo con la versión de `list_migrations`. Verificación: `select * from games` incluye `{{id}}`, `get_advisors` (security) no muestra avisos nuevos, y al terminar una partida y guardar aparece "PUESTO #1" y la fila en la pestaña `{{TITULO}}` de `/salon`.

<!-- Paso 5 solo si la proporción no es 4:3 o hay otro cambio de plataforma. -->

5. {{Ajuste del reproductor.}} Verificación: {{…}}.
6. Actualizar `CLAUDE.md`: `{{id}}` tiene `src` (sección SPEC 05) y está en `games` (sección SPEC 06). {{Convención nueva, si la hay.}}

## Criterios de aceptación

<!-- Copiar los criterios estándar de checklist-plataforma.md adaptados y añadir los propios del juego. -->

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/{{id}}` y `/juegos/{{id}}/jugar` aparecen prerenderizadas.
- [ ] {{Criterios estándar…}}
- [ ] {{Criterios propios del juego (controles concretos, ratón, intervalos, overlays ocultos…).}}

## Decisiones

- **Sí:** {{entrada nueva | src sobre la simulada}}, por decisión del usuario. {{Motivo.}}
- **Sí:** {{aspecto original | tema neón}}, por decisión del usuario.
- **Sí:** {{portada reutilizada | portada nueva}}, por decisión del usuario.
- **Sí:** en modo embebido se desactivan {{pausa/reinicio/overlays propios}}; la plataforma controla PAUSA, FIN y JUGAR DE NUEVO.
- **Sí:** `best: 0` y `plays: "0"`. No hay puntuaciones reales todavía.
- **Sí:** solo se inserta la fila en `games`; no cambia el esquema ni hay que regenerar los tipos.
- **No:** tocar `EmbeddedGamePlayer`, `GameOverModal`, `saveScore` ni `HallOfFame` {{salvo el paso 5}}.
- {{Otras decisiones de la ficha.}}

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                     |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                            | El padre ya llama a `contentWindow.focus()` al cargar, reanudar y reiniciar. Hay un criterio que lo comprueba. |
| El juego envía `av:gameover` varias veces en la misma partida.                        | Bandera `gameOverSent` hasta el siguiente `av:restart`.                                                        |
| Al reanudar, el juego da un salto de tiempo.                                          | `lastTime = null` al reanudar {{y reiniciar intervalos/acumuladores}}.                                         |
| Se guarda antes de que exista la fila en `games` y el insert falla por clave foránea. | El paso 4 aplica la migración antes de verificar el guardado.                                                  |
| La puntuación no es entera o supera 10.000.000 y el insert falla.                     | {{El juego envía un entero acotado                                                                             | La puntuación máxima posible es {{X}}, muy por debajo del límite}}. |
| Las copias en `public/` y en `references/` divergen.                                  | `references/` es solo la fuente original; los cambios se hacen en `public/games/{{id}}/`.                      |
| {{Riesgos propios del juego.}}                                                        | {{…}}                                                                                                          |

## Lo que **no** entra en este spec

- {{Lista corta, igual que "Fuera de alcance".}}

Cada uno de estos, si llega, va en su propio spec.
