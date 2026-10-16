# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-15
> **Objetivo:** Implementar en Next.js las cinco pantallas del prototipo `references/templates/` (Biblioteca, Detalle, Reproductor, Login y Salón de la Fama) con navegación, footer y datos simulados, sin juegos reales ni persistencia.

## Por qué existe este spec

`app/` todavía tiene la página inicial de create-next-app. El tema neón ya está portado en `app/globals.css` (clases `av-*`, `btn`, `card`, `crt`, `cover-*`, …) y las fuentes se cargan en `app/layout.tsx`. Este spec convierte el prototipo HTML + Babel en rutas reales de App Router. Es la base visual sobre la que se montarán después la autenticación, la persistencia de puntuaciones y los juegos.

## Alcance

**Entra:**

- Datos simulados tipados en `lib/games.ts`: catálogo `GAMES`, categorías `CATEGORIES` y generador determinista `seededScores()`.
- Shell común en `app/layout.tsx`: `Nav`, `<main className="av-main">` y `Footer`.
- Nav con logo, links "Biblioteca" y "Salón de la Fama" con estado activo según la ruta, y botón "Iniciar Sesión" que lleva a `/login`.
- `/`: Biblioteca con hero, búsqueda por nombre, chips de categoría (estado de cliente), grilla de cards con inclinación 3D al mover el ratón y estado vacío "NO HAY RESULTADOS".
- `/juegos/[id]`: Detalle con portada, tags, descripción, franja de estadísticas, botones "JUGAR AHORA" y "VOLVER AL VAULT", y tabla de 10 mejores puntuaciones simuladas.
- `/juegos/[id]/jugar`: Reproductor con HUD (jugador, puntuación, vidas, nivel), arena CRT animada, puntuación que sube sola, PAUSA/REANUDAR, FIN que abre el modal "FIN DEL JUEGO", y botón "GUARDAR PUNTUACIÓN" que solo muestra el toast.
- `/login`: tarjeta de acceso con pestañas "INICIAR SESIÓN" / "CREAR CUENTA" (la segunda muestra además el campo de correo), botón de envío y "JUGAR COMO INVITADO". Ambos navegan a `/`.
- `/salon`: Salón de la Fama con chips por juego (estado de cliente), podio de 3 puestos y tabla de 12 filas simuladas con animación de entrada.
- `app/not-found.tsx`: página 404 con el estilo neón y botón "VOLVER AL VAULT".
- Pre-generación de las rutas de juegos con `generateStaticParams`. Un id inexistente llama a `notFound()`.

**Fuera de alcance (para specs futuros):**

- Autenticación real o simulada. No hay sesión, ni `av_user`, ni nombre de usuario en el nav, ni cerrar sesión.
- Fila "TU MEJOR MARCA" en el Salón de la Fama (requiere sesión).
- Persistencia de puntuaciones (`av_scores`, base de datos o API).
- Juegos reales: el Reproductor solo simula la partida.
- Menú móvil (hamburguesa + panel lateral).
- Contador "CRÉDITOS · 03" del nav.
- Botones "GOOGLE" / "GITHUB" y el separador "O CONTINÚA CON" del Login.
- Búsqueda o categoría reflejadas en la URL (query params).
- Una ruta propia por juego en el Salón (`/salon/[id]`).
- Framework de tests.

## Modelo de datos

Todo vive en `lib/games.ts`. Se porta desde `references/templates/data.jsx` conservando los mismos valores.

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | GameCategory;
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug usado en /juegos/[id], p. ej. "bloque-buster"
  title: string;       // "BLOQUE BUSTER"
  short: string;       // descripción de la card
  long: string;        // descripción del Detalle
  cat: GameCategory;
  cover: string;       // clase CSS de portada, p. ej. "cover-bricks"
  color: GameColor;    // variante del botón JUGAR en la card
  best: number;        // mejor puntuación global
  plays: string;       // "12.4K"
};

export type ScoreRow = {
  rank: number;
  name: string;        // tomado de PLAYERS
  score: number;
  date: string;        // "dd/mm/2026"
};

export const GAMES: Game[];                  // los 8 juegos de data.jsx
export const CATEGORIES: CategoryFilter[];   // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[];
export function formatScore(n: number): string; // Intl.NumberFormat("es-ES")
```

Convenciones:

- `seededScores` es determinista: la misma semilla produce las mismas filas en servidor y cliente.
- Semillas iguales al prototipo: Detalle usa `id.length * 17 + 3` con 10 filas. Salón usa `id.length * 23 + 7` con 12 filas.
- Todos los números visibles se formatean con `formatScore` (locale `es-ES`).

## Plan de implementación

Antes de escribir código específico de Next, consultar `node_modules/next/dist/docs/` para `generateStaticParams`, `params` asíncronos, `notFound()` y su interacción con `cacheComponents: true`.

1. Crear `lib/games.ts` con los tipos, `GAMES`, `CATEGORIES`, `PLAYERS`, `getGame`, `seededScores` y `formatScore`. Verificación: `next build` compila.
2. Crear `components/footer.tsx` y `components/nav.tsx`. `Nav` es componente de cliente y usa `usePathname()` para el estado activo: `/` y `/juegos/*` activan "Biblioteca", `/salon` activa "Salón de la Fama". Montarlos en `app/layout.tsx` alrededor de `<main className="av-main">`. Verificación: el nav y el footer se ven sobre la página actual.
3. Reemplazar `app/page.tsx` por la Biblioteca: hero (servidor) más `components/library.tsx` (cliente, búsqueda y chips) y `components/game-card.tsx` (cliente, inclinación 3D). Cada card enlaza a `/juegos/[id]`. Borrar los assets del starter que dejen de usarse (`public/*.svg`). Verificación: filtrar por "PUZZLE" deja solo CAÍDA.
4. Crear `app/not-found.tsx` con el estilo neón y un enlace a `/`.
5. Crear `app/juegos/[id]/page.tsx` (servidor) con `generateStaticParams` sobre `GAMES` y `notFound()` para ids desconocidos. Incluye portada, tags, descripción, estadísticas, acciones y la tabla de 10 puntuaciones con `top1`/`top2`/`top3`. Verificación: `/juegos/caida` muestra CAÍDA y `/juegos/xyz` muestra la 404.
6. Crear `app/juegos/[id]/jugar/page.tsx` (servidor, resuelve el juego o `notFound()`) y `components/game-player.tsx` (cliente). Este último lleva el HUD, el CRT, el intervalo de puntuación, la subida de nivel, la pausa, el modal de fin, el toast de guardado y "JUGAR DE NUEVO". El jugador se muestra siempre como "INVITADO". "SALIR" vuelve a `/juegos/[id]` y "VOLVER AL VAULT" vuelve a `/`.
7. Crear `app/login/page.tsx` y `components/auth-form.tsx` (cliente: pestañas y campos). Al enviar el formulario o pulsar "JUGAR COMO INVITADO" se navega a `/` con `useRouter().push`.
8. Crear `app/salon/page.tsx` y `components/hall-of-fame.tsx` (cliente: chip activo, podio y tabla con `animationDelay` escalonado). Incluye el botón "VOLVER A LA BIBLIOTECA".
9. Pasar a utilidades Tailwind los `style={{…}}` inline del prototipo, usando los tokens del tema (`text-ink-faint`, `font-pixel`, `text-magenta`, …). Dejar como `style` solo los valores dinámicos (`animationDelay`, `transform` de la inclinación).
10. Actualizar la línea de `CLAUDE.md` que dice que `app/` todavía tiene el starter.

## Criterios de aceptación

- [ ] `next build` termina sin errores ni advertencias de TypeScript.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en ninguna de las 5 pantallas.
- [ ] `/` muestra el hero "ARCADE VAULT" y las 8 cards en el orden de `GAMES`.
- [ ] Escribir "ser" en la búsqueda deja solo la card SERPENTINA.
- [ ] Pulsar el chip "SHOOTER" deja solo INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Mover el ratón sobre una card la inclina y sacarlo la devuelve a su posición.
- [ ] Pulsar una card o su botón "JUGAR" navega a `/juegos/<id>`.
- [ ] `/juegos/gloton` muestra el título GLOTÓN, la mejor puntuación global 96.400 y 10 filas de ranking, con las tres primeras en oro, plata y bronce.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la página 404 neón.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar`.
- [ ] En el Reproductor la puntuación aumenta sola. "PAUSA" la detiene y muestra "EN PAUSA". "REANUDAR" la reanuda.
- [ ] "FIN" abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" reemplaza el input por el toast "▸ PUNTUACIÓN GUARDADA_" y no escribe nada en `localStorage`.
- [ ] "JUGAR DE NUEVO" reinicia la puntuación a 0, las vidas a 3 y el nivel a 01.
- [ ] En `/login`, la pestaña "CREAR CUENTA" muestra el campo "Correo electrónico" y cambia el botón a "CREAR Y JUGAR".
- [ ] Enviar el formulario de login o pulsar "JUGAR COMO INVITADO" navega a `/`.
- [ ] `/login` no muestra los botones GOOGLE / GITHUB.
- [ ] `/salon` muestra el podio y 12 filas. Cambiar de chip cambia el ranking.
- [ ] El link del nav "Biblioteca" está activo en `/`, `/juegos/<id>` y `/juegos/<id>/jugar`. "Salón de la Fama" está activo en `/salon`.
- [ ] El nav no muestra el contador de créditos ni el botón hamburguesa.
- [ ] El footer muestra "© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0" en todas las páginas.
- [ ] Comparadas lado a lado con `references/templates/Arcade Vault.html` a 1280px de ancho, las 5 pantallas coinciden en colores, fuentes, espaciado y animaciones.

## Decisiones

- **Sí:** rutas reales de App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/login`, `/salon`). Dan URLs compartibles y son la base para lo que venga.
- **No:** hash routing como en `app.jsx`. Habría que rehacerlo después.
- **Sí:** login solo visual, sin sesión. La autenticación merece su propio spec.
- **No:** sesión simulada en `localStorage` (`av_user`). Sería código desechable cuando llegue la auth real.
- **Sí:** el Reproductor simula la partida como el prototipo (contador, pausa, modal). Muestra el flujo completo sin juego real.
- **No:** guardar puntuaciones en `localStorage` (`av_scores`). Ninguna pantalla las leería en este MVP.
- **Sí:** datos mock en un módulo TS tipado (`lib/games.ts`). Es fácil de reemplazar por una fuente real.
- **No:** JSON en `data/`. Se pierde el tipado directo.
- **Sí:** reutilizar las clases `av-*` de `globals.css` y pasar los estilos inline a utilidades Tailwind con los tokens. Garantiza fidelidad visual con el prototipo.
- **No:** reescribir todo en Tailwind. Más trabajo y riesgo de diferencias visuales.
- **Sí:** componentes compartidos en `components/` en la raíz.
- **No:** `app/_components/`.
- **Sí:** filtros de Biblioteca y chip del Salón como estado de cliente. Las páginas siguen siendo estáticas.
- **No:** query params en la URL. Vuelven la página dinámica y exigen Suspense con Cache Components.
- **Sí:** `notFound()` con 404 neón y `generateStaticParams` para los juegos.
- **No:** redirigir a `/` en silencio. Oculta errores de enlace.
- **Sí:** inclinación 3D de las cards.
- **No:** menú móvil, contador de créditos y botones Google/GitHub. Se difieren.
- **Sí:** un solo spec con un paso commiteable por pantalla. Todo es visual sobre los mismos datos y el mismo tema.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| En móvil (<840px) el CSS oculta los links del nav y no hay hamburguesa, así que el Salón no es accesible desde el nav. | Aceptado para este MVP. El menú móvil queda en "fuera de alcance" para un spec futuro. |
| Error de hidratación por formato numérico distinto entre servidor y cliente. | Un único `formatScore` con `Intl.NumberFormat("es-ES")`, usado en todas partes. |
| Error de hidratación por datos aleatorios. | `seededScores` es determinista. `Math.random()` solo se usa dentro de efectos de cliente del Reproductor. |
| Next 16 con `cacheComponents` cambia el comportamiento de `params` y de las rutas dinámicas respecto a lo conocido. | Leer `node_modules/next/dist/docs/` antes de los pasos 5 y 6. Los `params` se tratan como `Promise`. |
| El intervalo del Reproductor sigue corriendo al salir de la página. | Limpiar el `setInterval` en el cleanup del efecto. |

## Lo que **no** entra en este spec

- Autenticación, sesión de usuario y fila "TU MEJOR MARCA" del Salón.
- Persistencia de puntuaciones.
- Juegos reales.
- Menú móvil (hamburguesa).
- Contador de créditos del nav.
- Botones de login social (Google / GitHub).
- Filtros en la URL y rutas `/salon/[id]`.
- Tests automatizados.

Cada uno de estos, si llega, va en su propio spec.
