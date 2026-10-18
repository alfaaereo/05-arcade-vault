# SPEC 04 — Integración base con Supabase

> **Estado:** Aprobado
> **Depende de:** SPEC 03
> **Fecha:** 2026-10-17
> **Objetivo:** Integrar Supabase en la app Next.js con `@supabase/ssr` (cliente de navegador, cliente de servidor y `proxy.ts` de sesión), tipado y configurado por variables de entorno, sin cambiar ninguna pantalla.

## Por qué existe este spec

La app es un MVP visual sin persistencia (SPEC 01). La autenticación, las puntuaciones y el Salón real necesitarán Supabase, pero cada uno merece su propio spec. Este spec deja solo la base común: dependencias, variables, clientes y una forma de comprobar la conexión. Así los specs siguientes parten de una integración ya verificada.

## Alcance

**Entra:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clave `sb_publishable_…`), añadidas a `.env.template` con valores vacíos y rellenadas en `.env.local`.
- `lib/supabase/server.ts`: `createClient()` asíncrono con `createServerClient` de `@supabase/ssr` y `cookies()` de `next/headers`, para Server Components, Server Actions y Route Handlers.
- `lib/supabase/client.ts`: `createClient()` con `createBrowserClient` de `@supabase/ssr`, para Client Components.
- `lib/supabase/proxy.ts`: `updateSession(request)`, que crea un `createServerClient` sobre las cookies de la petición y la respuesta, llama a `supabase.auth.getClaims()` para refrescar el token y devuelve el `NextResponse` con las cookies actualizadas. No redirige a nadie.
- `proxy.ts` en la raíz (convención de Next 16, que sustituye a `middleware.ts`): exporta `proxy(request)`, que delega en `updateSession`, con un `matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` e imágenes.
- `lib/supabase/env.ts`: lee y valida las dos variables. Si falta alguna, lanza un error con un mensaje claro (nombre de la variable, nunca su valor).
- `lib/supabase/database.types.ts`: tipos generados del esquema `public` (vacío por ahora) y pasados como genérico `Database` a los clientes.
- Script `npm run supabase:check` (`scripts/supabase-check.mjs`, ejecutado con `node --env-file=.env.local`). Llama a `GET {URL}/auth/v1/health` con la cabecera `apikey`, imprime `SUPABASE OK` y sale con código 0, o imprime el error y sale con código 1.
- Actualizar `CLAUDE.md` con una sección "Supabase (SPEC 04)": clientes, variables y script.

**Fuera de alcance (para specs futuros):**

- Autenticación (login, registro, logout, sesión en el nav).
- Proteger rutas o redirigir a `/login` desde `proxy.ts`.
- Tablas, migraciones, políticas RLS y datos semilla.
- Guardar puntuaciones y Salón de la Fama con datos reales.
- Mover el catálogo `GAMES` a la base de datos.
- Clave `service_role` / secret key y cualquier cliente con privilegios de administrador.
- Stack local de Supabase (CLI + Docker).
- Cambios visuales en cualquier pantalla.
- Framework de tests.

## Modelo de datos

Este spec no introduce tablas. Solo añade la configuración y los tipos del cliente.

```ts
// lib/supabase/env.ts
export function getSupabaseEnv(): { url: string; publishableKey: string };

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient<Database>>;

// lib/supabase/client.ts
export function createClient(): SupabaseClient<Database>;

// lib/supabase/proxy.ts
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse>;

// proxy.ts (raíz)
export async function proxy(request: NextRequest): Promise<NextResponse>;
export const config: { matcher: string[] };

// lib/supabase/database.types.ts — generado, no se edita a mano
export type Database = {
  public: {
    Tables: {};
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
```

```bash
# .env.template (se añade a las claves de SPEC 03)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Convenciones:

- Los clientes de navegador y servidor se llaman `createClient` y se importan por ruta (`@/lib/supabase/server` o `@/lib/supabase/client`).
- El cliente de servidor se crea en cada petición. Nunca se guarda en una variable global.
- En `server.ts`, el `setAll` de cookies va en `try/catch`: en un Server Component no se pueden escribir cookies y el error se ignora.
- Las variables `NEXT_PUBLIC_*` se leen con acceso literal (`process.env.NEXT_PUBLIC_SUPABASE_URL`) para que Next las incruste en el bundle del cliente.
- En `updateSession`, no se ejecuta código entre `createServerClient` y `getClaims()`, y siempre se devuelve la misma `response` cuyas cookies escribió `setAll`. Si se pierde una cookie, la sesión se cierra sin aviso.
- Se usa `getClaims()` (valida el JWT) y no `getSession()` (no valida) para decidir nada en el servidor.
- Los tipos se regeneran con `generate_typescript_types` del MCP de Supabase cada vez que un spec cambie el esquema.

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` las guías de variables de entorno y de `cookies()`, y la guía de Supabase para Next.js con `@supabase/ssr` (`search_docs` del MCP).

1. `npm install @supabase/supabase-js @supabase/ssr`. Añadir las dos claves a `.env.template`. Rellenar `.env.local` con la URL y la publishable key del proyecto (`get_project_url` y `get_publishable_keys` del MCP). Verificación: `next build` compila.
2. Crear `lib/supabase/database.types.ts` con `generate_typescript_types` y `lib/supabase/env.ts` con `getSupabaseEnv`. Verificación: `next build` compila.
3. Crear `lib/supabase/server.ts` y `lib/supabase/client.ts` tipados con `Database`. Verificación: `next build` compila sin advertencias de TypeScript.
4. Crear `lib/supabase/proxy.ts` con `updateSession` y `proxy.ts` en la raíz con su `matcher`. Leer antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Verificación: `next build` lista el Proxy y `next dev` sirve todas las pantallas sin errores.
5. Crear `scripts/supabase-check.mjs` y el script `supabase:check` en `package.json`. Verificación: `npm run supabase:check` imprime `SUPABASE OK`.
6. Actualizar `CLAUDE.md` con la sección "Supabase (SPEC 04)": los tres módulos (`client.ts`, `server.ts` y `proxy.ts`), cuál usar en cada caso, las variables y el script.

## Criterios de aceptación

- [ ] `next build` termina sin errores ni advertencias de TypeScript.
- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [ ] Con `.env.local` válido, `npm run supabase:check` imprime `SUPABASE OK` y sale con código 0.
- [ ] Con una publishable key inválida, `npm run supabase:check` imprime un error y sale con código 1.
- [ ] Si falta `NEXT_PUBLIC_SUPABASE_URL`, llamar a `createClient()` lanza un error que nombra la variable.
- [ ] `lib/supabase/server.ts` y `lib/supabase/client.ts` devuelven `SupabaseClient<Database>`.
- [ ] Existe `proxy.ts` en la raíz (no `middleware.ts`), y `next build` lo reconoce sin avisos de deprecación.
- [ ] Una petición a `/_next/static/…` no pasa por el proxy (excluida por el `matcher`).
- [ ] Navegar por `/`, `/games`, `/juegos/caida`, `/salon` y `/about` con el proxy activo no produce errores en el servidor ni en el navegador.
- [ ] Ninguna página importa todavía los clientes, y `/`, `/games`, `/about`, `/juegos/[id]` y `/salon` se renderizan igual que antes (estáticas o prerenderizadas) en la salida de `next build`.
- [ ] La consola del navegador no muestra errores nuevos en ninguna pantalla.
- [ ] `.env.template` incluye las dos claves nuevas vacías, y `.env.local` no aparece en `git status`.
- [ ] Ninguna clave `service_role` o `sb_secret_…` aparece en el repo ni en `.env.template`.
- [ ] `CLAUDE.md` documenta los clientes, las variables y `npm run supabase:check`.

## Decisiones

- **Sí:** definición rápida sin aclaración detallada. El usuario pidió "solo la integración con supabase" y no quiso responder preguntas. Las decisiones siguientes son los valores recomendados por defecto.
- **Sí:** `@supabase/ssr`. Es el paquete oficial para Next.js App Router y guarda la sesión en cookies, lo que necesitará el spec de auth.
- **No:** usar solo `@supabase/supabase-js`. Guarda la sesión en `localStorage` y no funciona en Server Components.
- **Sí:** publishable key (`sb_publishable_…`). Es el formato actual de Supabase y se puede rotar.
- **No:** anon key JWT antigua.
- **Sí:** configuración SSR completa (cliente de navegador, cliente de servidor y `proxy.ts` de refresco de sesión), por petición del usuario. El spec de auth solo tendrá que añadir pantallas y lógica.
- **Sí:** `proxy.ts` y no `middleware.ts`. Next 16 marca `middleware` como obsoleto.
- **No:** proteger rutas desde el proxy en este spec. No hay auth todavía.
- **Sí:** tres módulos en `lib/supabase/` (`client.ts`, `server.ts` y `proxy.ts`). Es el patrón documentado por Supabase y cubre Client Components, Server Components/Actions y el proxy.
- **Sí:** `getSupabaseEnv` falla con un mensaje claro. Una variable ausente se detecta enseguida y no aparece como un error opaco de red.
- **Sí:** tipos generados desde ya, aunque el esquema esté vacío. Los specs siguientes solo tienen que regenerarlos.
- **Sí:** script `supabase:check` para verificar la conexión. Sin tablas, es la única prueba real, y no expone ningún endpoint ni toca la UI.
- **No:** Route Handler `/api/health`. Sería un endpoint público solo para depurar.
- **No:** stack local con Docker. Se trabaja contra el proyecto remoto enlazado en `.mcp.json`.

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                                                                                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leer `cookies()` en un componente vuelve dinámica la ruta con Cache Components.        | Ninguna página usa todavía el cliente de servidor. El criterio sobre la salida de `next build` lo comprueba. Los specs siguientes envuelven en `<Suspense>` lo que use datos de Supabase. |
| El proxy añade una llamada a Supabase Auth en cada petición y ralentiza la navegación. | Sin sesión, `getClaims()` no tiene token que validar y no hace llamadas de red. El `matcher` excluye los estáticos.                                                                       |
| Si Supabase no responde o faltan variables, el proxy rompe todas las páginas.          | `updateSession` captura el error, lo registra con `console.error` y devuelve `NextResponse.next()` para que la página siga cargando.                                                      |
| Se versiona por error una clave secreta.                                               | Solo se usa la publishable key, que es pública por diseño. `.env*` sigue ignorado salvo `.env.template`, y un criterio comprueba que no hay claves `sb_secret_`/`service_role`.           |
| La API de `@supabase/ssr` difiere de lo conocido (versión nueva).                      | Consultar `search_docs` del MCP de Supabase antes del paso 3.                                                                                                                             |
| El proyecto gratuito se pausa por inactividad y `supabase:check` falla.                | El script imprime el error real. Basta con reanudar el proyecto desde el panel.                                                                                                           |

## Lo que **no** entra en este spec

- Autenticación y protección de rutas.
- Tablas, migraciones y RLS.
- Puntuaciones y Salón reales.
- Catálogo en base de datos.
- Clave secreta / cliente administrador.
- Stack local y tests.

Cada uno de estos, si llega, va en su propio spec.
