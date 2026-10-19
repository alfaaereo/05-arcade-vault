# SPEC 06 — Leaderboard de ASTEROIDS en Supabase: tablas, guardado y Salón

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-10-18
> **Objetivo:** Crear en Supabase las tablas `games` (solo con `asteroids`) y `leaderboard`, guardar ahí la puntuación de ASTEROIDS desde el modal "FIN DEL JUEGO" y mostrarla en la pestaña ASTEROIDS de `/salon`.

## Por qué existe este spec

El Salón de la Fama y el detalle muestran puntuaciones inventadas por `seededScores` (SPEC 01), y "GUARDAR PUNTUACIÓN" es solo visual. ASTEROIDS ya es un juego real (SPEC 05), así que necesita un leaderboard real de punta a punta: esquema, escritura y lectura. Todavía no hay autenticación. El jugador escribe su nombre y el navegador inserta directamente con la publishable key, así que se aceptan puntuaciones falsas: la base de datos solo impone límites básicos. El catálogo sigue en `lib/games.ts`. La tabla `games` solo sirve de referencia para `leaderboard.game_id`, y los demás juegos se añadirán a ella cuando sean reales.

## Alcance

**Entra:**

- Migración versionada en `supabase/migrations/` que crea `games` y `leaderboard`, activa RLS, da lectura pública e inserción pública limitada a `leaderboard`, e inserta la fila `asteroids` en `games`. Se aplica al proyecto remoto con `apply_migration` del MCP.
- `leaderboard` arranca vacía. No hay datos semilla de puntuaciones.
- Tipos generados con el MCP en `lib/supabase/database.types.ts`. Los dos clientes de `lib/supabase/` pasan a `createServerClient<Database>` y `createBrowserClient<Database>`.
- `lib/leaderboard.ts`: `getLeaderboards()`, solo para servidor, que lee los ids de `games` y el top 12 de cada uno.
- `lib/save-score.ts`: `saveScore()`, para el navegador, que valida, inserta en `leaderboard` con el cliente de `lib/supabase/client.ts` y calcula el puesto obtenido.
- `components/game-over-modal.tsx`:
  - Nueva prop opcional `gameId`. Con `gameId`, "GUARDAR PUNTUACIÓN" guarda de verdad. Sin `gameId`, sigue siendo solo visual.
  - Estados con `useActionState`: idle, pendiente ("GUARDANDO…"), éxito y error ("REINTENTAR").
  - Éxito: "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y enlace "VER SALÓN" a `/salon`.
  - Una sola vez por partida: tras el éxito no se puede volver a guardar.
  - El campo de nombre solo admite `A-Z`, `0-9`, `_` y espacio, en mayúsculas y con un máximo de 10 caracteres.
- `components/embedded-game-player.tsx` pasa `gameId={game.id}` al modal. `components/game-player.tsx` (simulado) no lo pasa.
- `/salon`: un Server Component asíncrono llama a `getLeaderboards()` dentro de `<Suspense>` y pasa el resultado a `HallOfFame`.
- `components/hall-of-fame.tsx`:
  - Juegos presentes en `games`: podio y tabla con datos de Supabase.
  - Juegos ausentes de `games`: siguen con `seededScores`, igual que hoy.
  - Estado vacío: "SIN PUNTUACIONES TODAVÍA" en lugar del podio y la tabla.
  - Estado de error: "NO SE PUDO CARGAR EL SALÓN" en lugar del podio y la tabla, en todas las pestañas.
  - Con 1 o 2 filas, los puestos del podio sin fila muestran `---`.
- Actualizar `CLAUDE.md` con una sección "Leaderboard (SPEC 06)".

**Fuera de alcance (para specs futuros):**

- Autenticación y columna `user_id` en `leaderboard`.
- Antitrampas más allá de los límites básicos: token de partida, duración mínima, firma de la puntuación, rate limit.
- Server Action o Route Handler para guardar.
- Guardado real desde el reproductor simulado.
- Añadir a `games` los demás juegos del catálogo.
- Mover el resto de campos de `Game` (`short`, `long`, `cat`, `cover`, `color`, `src`…) a la base de datos.
- Leer el leaderboard real en `/juegos/[id]` (top 10 y récord).
- Récord real en las tarjetas de `/` y `/games`.
- Contador de partidas (`plays`) real.
- Moderación de nombres, edición o borrado de puntuaciones.
- Caché con `"use cache"` / `cacheLife` y revalidación.
- Supabase Realtime (leaderboard en vivo).
- Paginación o más de 12 filas por juego.
- Stack local de Supabase (CLI + Docker).
- Framework de tests.

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_games_and_leaderboard.sql
create table public.games (
  id text primary key,                 -- igual al id de lib/games.ts
  title text not null,
  created_at timestamptz not null default now()
);

create table public.leaderboard (
  id bigint generated always as identity primary key,
  game_id text not null references public.games (id),
  player_name text not null
    check (player_name ~ '^[A-Z0-9_ ]{1,10}$' and player_name = btrim(player_name)),
  score integer not null check (score between 0 and 10000000),
  created_at timestamptz not null default now()
);

create index leaderboard_game_score_idx
  on public.leaderboard (game_id, score desc, created_at);

-- RLS activo en ambas tablas.
-- games: política SELECT "using (true)" para anon y authenticated. Sin escritura.
-- leaderboard: política SELECT "using (true)" y política INSERT para anon y authenticated
--   con with check que repite los límites de nombre y puntuación. Sin UPDATE ni DELETE.
-- grant select on games, leaderboard to anon, authenticated;
-- grant insert (game_id, player_name, score) on leaderboard to anon, authenticated;
--   (privilegio por columnas: el cliente no puede fijar id ni created_at)

insert into public.games (id, title) values ('asteroids', 'ASTEROIDS');
```

```ts
// lib/leaderboard.ts (solo servidor)
export type Leaderboards =
  | { status: "ok"; games: Record<string, ScoreRow[]> } // clave: games.id; [] si no hay filas
  | { status: "error" };

export async function getLeaderboards(): Promise<Leaderboards>;
```

```ts
// lib/save-score.ts (navegador)
export const PLAYER_NAME_RE = /^[A-Z0-9_ ]{1,10}$/;
export const MAX_SCORE = 10_000_000;

export type SaveScoreState =
  | { status: "idle" }
  | { status: "success"; rank: number }
  | { status: "error" };

export async function saveScore(
  gameId: string,
  playerName: string, // se recorta con trim() antes de validar
  score: number,
): Promise<SaveScoreState>;
```

```ts
// components/game-over-modal.tsx
type GameOverModalProps = {
  score: number;
  onRestart: () => void;
  gameId?: string; // con gameId guarda en Supabase; sin él, solo visual
};

// components/hall-of-fame.tsx
type HallOfFameProps = {
  leaderboards: Leaderboards;
};
```

Convenciones:

- `ScoreRow` es el tipo existente de `lib/games.ts` (`rank`, `name`, `score`, `date`). `player_name` → `name`.
- Orden del top: `score` descendente y, en empate, `created_at` ascendente (gana quien llegó antes). Límite 12 filas por juego.
- `rank` se calcula en servidor según ese orden, empezando en 1.
- `date` se formatea en servidor como `dd/mm/aaaa` con `Intl.DateTimeFormat("es-ES", { timeZone: "UTC" })`. El cliente recibe el texto ya formateado y no hay riesgo de hidratación.
- Un juego usa datos reales en el Salón si su id aparece como clave en `leaderboards.games`. Si no aparece, usa `seededScores`.
- `getLeaderboards()` usa `await createClient()` de `lib/supabase/server.ts`.
- `saveScore()` usa `createClient()` de `lib/supabase/client.ts`. Hace `insert(...).select("score, created_at").single()` y después cuenta, con `head: true`, las filas del mismo juego con más puntuación o con la misma y `created_at` anterior. El puesto es ese número más 1.
- `saveScore()` valida antes de la red: nombre con `PLAYER_NAME_RE` tras `trim()`, y puntuación entera entre 0 y `MAX_SCORE`. Si no pasa, devuelve `{ status: "error" }` sin hacer petición.
- `getLeaderboards()` y `saveScore()` nunca lanzan. Si algo falla, hacen `console.error` y devuelven `{ status: "error" }`.
- Si el insert funciona y falla el conteo del puesto, la puntuación cuenta como guardada: estado de éxito sin "PUESTO #N".

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` las guías de Cache Components, `<Suspense>` y obtención de datos en Server Components. Revisar con `search_docs` del MCP la guía de RLS, la de permisos de tablas nuevas en `public` y la de `insert().select()` con RLS. Usar `/frontend-design` para los estados de carga, vacío, error y guardado, como indica `CLAUDE.md`.

1. Crear `supabase/migrations/<timestamp>_games_and_leaderboard.sql` con el SQL del modelo de datos y aplicarlo con `apply_migration` (nombre `games_and_leaderboard`). Verificación: `list_tables` muestra `games` y `leaderboard` con RLS activo, `select * from games` devuelve solo `asteroids` y `get_advisors` (security) se revisa.
2. Generar los tipos con `generate_typescript_types` en `lib/supabase/database.types.ts` y tipar los dos clientes con `Database`. Verificación: `next build` compila sin advertencias de TypeScript.
3. Crear `lib/leaderboard.ts` con `getLeaderboards()`. Verificación: `next build` compila. Todavía ninguna página lo usa.
4. Añadir a `HallOfFame` la prop `leaderboards`, los estados vacío y error, y los puestos `---` del podio. En `app/salon/page.tsx`, un componente asíncrono llama a `getLeaderboards()` y renderiza `HallOfFame`, envuelto en `<Suspense>` con un fallback "CARGANDO SALÓN…". Verificación: la pestaña ASTEROIDS muestra "SIN PUNTUACIONES TODAVÍA", y BLOQUE BUSTER y las demás muestran las mismas filas simuladas que antes.
5. Crear `lib/save-score.ts` con `PLAYER_NAME_RE`, `MAX_SCORE` y `saveScore()`. Verificación: `next build` compila. Todavía nadie lo usa.
6. Añadir a `GameOverModal` la prop `gameId`, el filtro de caracteres del nombre y los estados con `useActionState`. Pasar `gameId={game.id}` desde `EmbeddedGamePlayer`. Verificación: al terminar una partida de ASTEROIDS y guardar, aparece "PUESTO #1" y la fila se ve en la pestaña ASTEROIDS de `/salon`. En `/juegos/rocas/jugar`, guardar sigue siendo solo visual.
7. Actualizar `CLAUDE.md` con la sección "Leaderboard (SPEC 06)": tablas y permisos, migraciones en `supabase/migrations/`, tipos generados, `getLeaderboards()`, `saveScore()`, la regla real vs. simulado según `games` y el riesgo aceptado de puntuaciones falsas.

## Criterios de aceptación

**Esquema y permisos**

- [ ] `supabase/migrations/` contiene un único archivo `.sql`, y `list_migrations` muestra la migración `games_and_leaderboard`.
- [ ] `games` tiene exactamente una fila: `asteroids` / `ASTEROIDS`.
- [ ] `leaderboard` está vacía tras la migración.
- [ ] Con el rol `anon`, insertar en `games` falla, y actualizar o borrar filas de `leaderboard` no afecta a ninguna fila.
- [ ] Con el rol `anon`, insertar en `leaderboard` un `id` o un `created_at` explícito falla por permisos.
- [ ] Un insert con `player_name` vacío, con minúsculas, con espacios al principio o al final, de más de 10 caracteres, con `score` negativo o mayor que 10.000.000, o con un `game_id` inexistente falla.
- [ ] `get_advisors` (security) no muestra avisos sobre `games` ni `leaderboard`, salvo, si aparece, el de la política de INSERT pública, que es un riesgo aceptado en este spec.

**Guardado**

- [ ] Al terminar una partida de ASTEROIDS con el nombre `INVITADO` y pulsar "GUARDAR PUNTUACIÓN", el botón muestra "GUARDANDO…" y luego aparecen "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y el enlace "VER SALÓN".
- [ ] La fila insertada tiene `game_id = 'asteroids'`, el nombre escrito y la misma puntuación que mostraba el canvas.
- [ ] Con `leaderboard` vacía, el primer guardado muestra "PUESTO #1". Una segunda partida con menos puntos muestra "PUESTO #2".
- [ ] Tras el éxito ya no se puede guardar otra vez en esa partida. "JUGAR DE NUEVO" y una nueva partida permiten guardar de nuevo.
- [ ] El campo de nombre no deja escribir caracteres fuera de `A-Z`, `0-9`, `_` y espacio, convierte a mayúsculas y no pasa de 10 caracteres.
- [ ] Con el nombre vacío o solo con espacios, pulsar guardar muestra el estado de error sin hacer petición de red.
- [ ] Sin red (o con `NEXT_PUBLIC_SUPABASE_URL` inválida), guardar muestra "REINTENTAR", la consola registra el error y el modal no se cierra. Reintentar con la red restaurada guarda una sola fila.
- [ ] En `/juegos/rocas/jugar` y el resto de juegos simulados, "GUARDAR PUNTUACIÓN" muestra "▸ PUNTUACIÓN GUARDADA_" sin ninguna petición de red, como antes.
- [ ] "VER SALÓN" lleva a `/salon` y la pestaña ASTEROIDS muestra la puntuación recién guardada.

**Salón**

- [ ] Con `leaderboard` vacía, la pestaña ASTEROIDS de `/salon` muestra "SIN PUNTUACIONES TODAVÍA" y no muestra podio ni tabla.
- [ ] Con 2 filas de ASTEROIDS, la pestaña muestra oro y plata con esos datos, bronce con `---`, y la tabla con 2 filas.
- [ ] Con 13 filas de ASTEROIDS, la tabla muestra las 12 de mayor puntuación en orden descendente, con fecha `dd/mm/aaaa`.
- [ ] Las pestañas de los otros 8 juegos muestran las mismas filas simuladas que antes de este spec.
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` inválida, `/salon` carga, las pestañas muestran "NO SE PUDO CARGAR EL SALÓN", la consola del servidor registra el error y la página no lanza.
- [ ] Mientras carga, se ve el fallback "CARGANDO SALÓN…" con la cabecera y el botón "VOLVER A LA BIBLIOTECA" ya visibles.

**General**

- [ ] `next build` termina sin errores ni advertencias de TypeScript.
- [ ] En la salida de `next build`, `/salon` es parcialmente prerenderizada (shell estático + contenido dinámico), y `/`, `/games`, `/about`, `/juegos/[id]` y `/juegos/[id]/jugar` siguen como antes.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/salon` ni en `/juegos/asteroids/jugar`.
- [ ] `/juegos/asteroids` sigue mostrando el top 10 simulado y el récord `0`.
- [ ] Las filas de prueba creadas durante la verificación se borran y `leaderboard` queda vacía al cerrar el spec.
- [ ] Ninguna clave `service_role` o `sb_secret_…` aparece en el repo.
- [ ] `CLAUDE.md` documenta las tablas, los permisos, las migraciones, el guardado y la regla real vs. simulado.

## Decisiones

- **Sí:** guardar puntuaciones entra en este spec, por decisión del usuario, tras una primera versión que lo dejaba fuera.
- **Sí:** tabla `games` en Supabase, por decisión del usuario. Da integridad referencial a `leaderboard.game_id`.
- **Sí:** `games` mínima (`id`, `title`, `created_at`), por decisión del usuario. El resto del catálogo no se duplica.
- **Sí:** `lib/games.ts` sigue siendo la fuente del catálogo, por decisión del usuario. Mantiene el prerender estático de la landing, la biblioteca y el detalle.
- **No:** Supabase como fuente del catálogo. Rompería el prerender y obligaría a `<Suspense>` en muchas rutas.
- **Sí:** solo `asteroids` en `games`, por decisión del usuario. Es el único juego real. Los demás se añadirán cuando lo sean.
- **Sí:** tabla `leaderboard` con `id`, `game_id`, `player_name`, `score`, `created_at`, por decisión del usuario.
- **Sí:** `player_name` como texto libre, por decisión del usuario. Coincide con el modal "FIN DEL JUEGO" y no hay autenticación.
- **No:** columna `user_id` todavía. Llegará con el spec de autenticación.
- **Sí:** insert directo desde el navegador con la publishable key, por decisión del usuario. Menos código y sin Server Action.
- **No:** Server Action con la publishable key. Habría añadido validación en servidor, pero el usuario prefirió el insert directo.
- **No:** Server Action con la clave secreta. `CLAUDE.md` prohíbe usar la clave `service_role` / secret.
- **Sí:** límites básicos como única defensa, por decisión del usuario: nombre `^[A-Z0-9_ ]{1,10}$` sin espacios en los extremos y puntuación entera entre 0 y 10.000.000. Se imponen en la base de datos (check y política de INSERT) y se repiten en `saveScore()` para no gastar una petición.
- **No:** token de partida ni rate limit. Bastante más trabajo. Se acepta el riesgo de puntuaciones falsas hasta que haya autenticación.
- **Sí:** privilegio de INSERT por columnas (`game_id`, `player_name`, `score`). El cliente no puede falsear `created_at` y alterar los desempates.
- **Sí:** ninguna política de UPDATE ni DELETE. Una puntuación guardada no se puede tocar desde el cliente.
- **Sí:** solo guardan de verdad los juegos presentes en `games`, por decisión del usuario. En la práctica se activa con la prop `gameId`, que hoy solo pasa `EmbeddedGamePlayer`.
- **No:** guardar desde el reproductor simulado. Serían puntuaciones inventadas.
- **Sí:** modal con estados y "PUESTO #N" tras guardar, por decisión del usuario. Usa `useActionState` como el formulario de contacto (SPEC 03).
- **Sí:** el puesto se calcula con una consulta de conteo tras el insert. Evita leer todo el top y respeta la regla de desempate.
- **Sí:** un único guardado por partida. Evita filas duplicadas al pulsar varias veces.
- **Sí:** leaderboard vacía, sin semilla, por decisión del usuario. Los criterios crean y borran filas de prueba.
- **Sí:** migraciones en `supabase/migrations/` aplicadas con el MCP, por decisión del usuario. Quedan versionadas y son reproducibles.
- **Sí:** tipos generados en `lib/supabase/database.types.ts`, por decisión del usuario. SPEC 04 los dejó para el primer spec de esquema.
- **Sí:** de las pantallas de lectura, solo `/salon` lee datos reales, por decisión del usuario. El detalle y las tarjetas quedan para otro spec.
- **Sí:** los juegos ausentes de `games` siguen con `seededScores` en el Salón, por decisión del usuario. El Salón no se vacía mientras solo hay un juego real.
- **No:** ocultar del Salón los juegos ausentes de `games`. Dejaría el Salón con una sola pestaña.
- **Sí:** lectura dinámica con `createClient()` de servidor dentro de `<Suspense>`, por decisión del usuario. Una puntuación recién guardada se ve al entrar en `/salon` sin invalidar caché.
- **No:** `"use cache"` con `cacheLife`. Mostraría datos con retraso y obligaría a invalidar al guardar.
- **Sí:** mensajes "SIN PUNTUACIONES TODAVÍA" y "NO SE PUDO CARGAR EL SALÓN", por decisión del usuario. La página nunca lanza.
- **No:** caer a `seededScores` si falla Supabase. Ocultaría errores reales.
- **Sí:** el error del Salón se muestra en todas las pestañas. Si falla la lectura de `games`, no se sabe qué juegos son reales.
- **Sí:** fecha formateada en servidor con zona `UTC`. El texto llega fijo al cliente y no hay desajuste de hidratación.
- **Sí:** en empate gana el `created_at` más antiguo. Es la regla arcade clásica y hace el orden determinista.

## Riesgos

| Riesgo                                                                                                         | Mitigación                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cualquiera con la publishable key puede insertar puntuaciones falsas (hasta 10.000.000) o hacer spam de filas. | Riesgo aceptado, por decisión del usuario. Límites en la base de datos y sin UPDATE ni DELETE. El spec de autenticación debe cerrar el INSERT anónimo. Documentado en `CLAUDE.md`. |
| Un nombre ofensivo aparece en el Salón.                                                                        | Solo 10 caracteres de `A-Z0-9_` y espacio. Se borra a mano con SQL. La moderación queda fuera.                                                                                     |
| `insert().select()` falla porque RLS o los grants no permiten leer la fila insertada.                          | La política SELECT pública cubre la fila. Un criterio comprueba el guardado de punta a punta.                                                                                      |
| El insert necesita permiso sobre la secuencia de la columna identity.                                          | Comprobarlo en el paso 1 con un insert como `anon`. Si falla, añadir `grant usage` sobre la secuencia en la misma migración.                                                       |
| Las tablas nuevas de `public` no tienen permisos para `anon`.                                                  | La migración incluye los `grant` explícitos.                                                                                                                                       |
| Leer `cookies()` vuelve dinámica `/salon` y bloquea el render.                                                 | `<Suspense>` envuelve solo el componente que lee Supabase. Cabecera y botón forman parte del shell estático.                                                                       |
| Un juego embebido nuevo pasa `gameId` pero no está en `games`.                                                 | El insert falla por clave foránea y el modal muestra "REINTENTAR". Añadir el juego a `games` es parte del spec que lo integre.                                                     |
| `games` y `lib/games.ts` divergen.                                                                             | Solo se pintan los juegos de `GAMES`. Un id de la BD sin entrada en `GAMES` se ignora.                                                                                             |
| Los tipos generados quedan desfasados cuando cambie el esquema.                                                | Cada spec que cambie el esquema regenera `database.types.ts`. Queda documentado en `CLAUDE.md`.                                                                                    |
| Las filas de prueba de los criterios quedan en la BD de producción.                                            | Los criterios exigen borrarlas. `leaderboard` debe quedar vacía al cerrar el spec.                                                                                                 |
| El insert funciona pero el conteo del puesto falla.                                                            | Se muestra éxito sin "PUESTO #N". No se reintenta el insert, así que no hay duplicados.                                                                                            |

## Lo que **no** entra en este spec

- Autenticación y `user_id`.
- Antitrampas avanzadas y rate limit.
- Guardado desde el reproductor simulado.
- Los demás juegos en `games` y el resto del catálogo en la BD.
- Leaderboard real en el detalle y en las tarjetas.
- `plays` real.
- Moderación, edición y borrado de puntuaciones.
- Caché, revalidación y Realtime.
- Paginación.
- Stack local y tests.

Cada uno de estos, si llega, va en su propio spec.
