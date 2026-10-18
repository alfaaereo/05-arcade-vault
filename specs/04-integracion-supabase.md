# SPEC 04 — Integración base con Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 03
> **Fecha:** 2026-10-17
> **Objetivo:** Integrar Supabase en la app Next.js con `@supabase/ssr` mediante un cliente de navegador y un cliente de servidor configurados por variables de entorno, sin cambiar ninguna pantalla.

## Por qué existe este spec

La app es un MVP visual sin persistencia (SPEC 01). La autenticación, las puntuaciones y el Salón real necesitarán Supabase, pero cada uno merece su propio spec. Este spec deja solo la base común: dependencias, variables y los dos clientes.

## Alcance

**Entra:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clave `sb_publishable_…`), añadidas a `.env.template` con valores vacíos y rellenadas en `.env.local`.
- `lib/supabase/server.ts`: `createClient()` asíncrono con `createServerClient` de `@supabase/ssr` y `cookies()` de `next/headers`, para Server Components, Server Actions y Route Handlers.
- `lib/supabase/client.ts`: `createClient()` con `createBrowserClient` de `@supabase/ssr`, para Client Components.
- Actualizar `CLAUDE.md` con una sección "Supabase (SPEC 04)": clientes y variables.

**Fuera de alcance (para specs futuros):**

- `proxy.ts` de refresco de sesión. Llegará con el spec de autenticación.
- Módulo de validación de variables de entorno.
- Tipos generados de la base de datos (`database.types.ts`).
- Script o endpoint de comprobación de la conexión.
- Autenticación (login, registro, logout, sesión en el nav) y protección de rutas.
- Tablas, migraciones, políticas RLS y datos semilla.
- Guardar puntuaciones y Salón de la Fama con datos reales.
- Mover el catálogo `GAMES` a la base de datos.
- Clave `service_role` / secret key y cualquier cliente con privilegios de administrador.
- Stack local de Supabase (CLI + Docker).
- Cambios visuales en cualquier pantalla.
- Framework de tests.

## Modelo de datos

Este spec no introduce tablas ni tipos propios.

```ts
// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient>;

// lib/supabase/client.ts
export function createClient(): SupabaseClient;
```

```bash
# .env.template (se añade a las claves de SPEC 03)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Convenciones:

- Los dos clientes se llaman `createClient` y se importan por ruta (`@/lib/supabase/server` o `@/lib/supabase/client`).
- El cliente de servidor se crea en cada petición. Nunca se guarda en una variable global.
- En `server.ts`, el `setAll` de cookies va en `try/catch`: en un Server Component no se pueden escribir cookies y el error se ignora.
- Las variables `NEXT_PUBLIC_*` se leen con acceso literal (`process.env.NEXT_PUBLIC_SUPABASE_URL!`) para que Next las incruste en el bundle del cliente.

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` las guías de variables de entorno y de `cookies()`, y la guía de Supabase para Next.js con `@supabase/ssr` (`search_docs` del MCP).

1. `npm install @supabase/supabase-js @supabase/ssr`. Añadir las dos claves a `.env.template`. Rellenar `.env.local` con la URL y la publishable key del proyecto. Verificación: `next build` compila.
2. Crear `lib/supabase/server.ts` y `lib/supabase/client.ts`. Verificación: `next build` compila sin advertencias de TypeScript.
3. Actualizar `CLAUDE.md` con la sección "Supabase (SPEC 04)": los dos clientes, cuál usar en cada caso y las variables.

## Criterios de aceptación

- [ ] `next build` termina sin errores ni advertencias de TypeScript.
- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [ ] `lib/supabase/` contiene solo `client.ts` y `server.ts`.
- [ ] No existe `proxy.ts` ni `middleware.ts` en la raíz.
- [ ] Ninguna página importa todavía los clientes, y `/`, `/games`, `/about`, `/juegos/[id]` y `/salon` se renderizan igual que antes (estáticas o prerenderizadas) en la salida de `next build`.
- [ ] La consola del navegador no muestra errores nuevos en ninguna pantalla.
- [ ] `.env.template` incluye las dos claves nuevas vacías, y `.env.local` no aparece en `git status`.
- [ ] Ninguna clave `service_role` o `sb_secret_…` aparece en el repo ni en `.env.template`.
- [ ] `CLAUDE.md` documenta los clientes y las variables.

## Decisiones

- **Sí:** definición rápida sin aclaración detallada. El usuario pidió "solo la integración con supabase" y no quiso responder preguntas. Las decisiones siguientes son los valores recomendados por defecto, ajustados después por el usuario.
- **Sí:** `@supabase/ssr`. Es el paquete oficial para Next.js App Router y guarda la sesión en cookies, lo que necesitará el spec de auth.
- **No:** usar solo `@supabase/supabase-js`. Guarda la sesión en `localStorage` y no funciona en Server Components.
- **Sí:** publishable key (`sb_publishable_…`). Es el formato actual de Supabase y se puede rotar.
- **No:** anon key JWT antigua.
- **Sí:** solo `client.ts` y `server.ts` en `lib/supabase/`, por decisión del usuario. Cubren Client Components y Server Components/Actions.
- **Sí:** los clientes en `lib/supabase/`, por decisión del usuario. Sigue la convención de `lib/games.ts` y `lib/home.ts`.
- **No:** `proxy.ts`, `env.ts` y `database.types.ts`, por decisión del usuario. Se implementaron y se retiraron porque no entran en este alcance. El proxy irá con el spec de auth y los tipos con el primer spec de esquema.
- **No:** script `supabase:check`, por decisión del usuario. Las credenciales ya están en `.env.local`.
- **No:** Route Handler `/api/health`. Sería un endpoint público solo para depurar.
- **No:** stack local con Docker. Se trabaja contra el proyecto remoto enlazado en `.mcp.json`.

## Riesgos

| Riesgo                                                                          | Mitigación                                                                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Leer `cookies()` en un componente vuelve dinámica la ruta con Cache Components. | Ninguna página usa todavía el cliente de servidor. Los specs siguientes envuelven en `<Suspense>` lo que use datos de Supabase. |
| Sin `proxy.ts`, la sesión no se refresca entre peticiones.                      | Hoy no hay sesión. El spec de autenticación debe añadir el proxy.                                                               |
| Si falta una variable, el cliente falla con un error genérico de Supabase.      | Las dos variables están en `.env.template`. Se añadirá validación si da problemas.                                              |
| Se versiona por error una clave secreta.                                        | Solo se usa la publishable key, que es pública por diseño. `.env*` sigue ignorado salvo `.env.template`.                        |

## Lo que **no** entra en este spec

- `proxy.ts`, validación de variables y tipos generados.
- Autenticación y protección de rutas.
- Tablas, migraciones y RLS.
- Puntuaciones y Salón reales.
- Catálogo en base de datos.
- Clave secreta / cliente administrador.
- Stack local y tests.

Cada uno de estos, si llega, va en su propio spec.
