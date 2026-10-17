# SPEC 02 — Landing page y Acerca de

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-15
> **Objetivo:** Convertir `/` en la landing del prototipo `references/templates/home-about/`, mover la Biblioteca a `/games` y añadir la página `/about` con formulario de contacto visual, más los enlaces "Inicio" y "Acerca de" en el nav.

## Por qué existe este spec

Hoy `/` es la Biblioteca. La plantilla `home-about` define una landing que presenta el producto antes del catálogo y una página "Acerca de" con contacto. La landing pasa a ser la puerta de entrada, así que la Biblioteca necesita su propia ruta y los enlaces de "volver" que hoy llevan a `/` deben llevar ahora a `/games`.

## Alcance

**Entra:**

- Mover la Biblioteca actual (hero "ARCADE VAULT" + `Library`) de `app/page.tsx` a `app/games/page.tsx`, sin cambios visuales.
- Nueva landing en `app/page.tsx`, portada de `home.jsx`, con estas secciones en orden:
  - Hero: eyebrow "▸ INSERTA UNA MONEDA_", título en tres líneas ("EL ARCADE / CLÁSICO ESTÁ / DE VUELTA"), subtítulo, botones "▶ EXPLORAR JUEGOS" (→ `/games`) y "✦ CREAR CUENTA" (→ `/login`), indicador "DESLIZA ▼" y las 8 siluetas pixel flotantes.
  - "// 01 ¿POR QUÉ ARCADE VAULT?": 4 feature cards con iconos pixel SVG.
  - "// 02 JUEGOS DISPONIBLES AHORA": mini-rail con los 6 primeros juegos de `GAMES` (cada uno → `/juegos/[id]`) y el botón "VER TODOS LOS JUEGOS →" (→ `/games`).
  - Franja de estadísticas: "12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING".
  - "// 03 ACTIVIDAD EN VIVO": "▸ ÚLTIMAS PUNTUACIONES" (7 filas) y "▸ TOP JUGADORES · HOY" (5 filas con barra) con el enlace "VER SALÓN →" (→ `/salon`).
  - "// 04 PRECIOS": tarjeta "JUGADOR VAULT $0 / SIEMPRE" con la lista de beneficios, el sello "FREE PLAY", el botón "EMPEZAR GRATIS →" (→ `/login`) y 3 preguntas de FAQ.
  - CTA final: "¿LISTO PARA JUGAR?" con "INSERTAR MONEDA →" (→ `/games`).
- Nueva página `app/about/page.tsx`, portada de `about.jsx`:
  - Hero "ACERCA DE ARCADE VAULT" con texto de misión y 3 highlights con iconos pixel (corazón, navegador, planta).
  - Divisor animado de 24 píxeles.
  - Bloque "CONTÁCTANOS" con 3 tips (LED de colores) y formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE.
- Formulario de contacto solo visual. Si falta algún campo (tras `trim`), el formulario tiembla 400 ms y no se envía. Si están los tres, se muestra la terminal "VAULT-OS // TERMINAL" con "MENSAJE RECIBIDO… GRACIAS, {NOMBRE}." y el botón "ENVIAR OTRO MENSAJE", que limpia el formulario.
- Animación de aparición `.reveal` al hacer scroll (IntersectionObserver, umbral 0.12, una sola vez por elemento).
- La animación `.reveal` respeta `prefers-reduced-motion` (contenido visible sin transición). Sin JavaScript, el contenido sigue visible.
- Nav (escritorio y menú móvil): enlaces en el orden "Inicio" (`/`), "Biblioteca" (`/games`), "Salón de la Fama" (`/salon`), "Acerca de" (`/about`).
- Estados activos del nav: "Inicio" en `/`. "Biblioteca" en `/games` y `/juegos/*`. "Salón de la Fama" en `/salon`. "Acerca de" en `/about`.
- Redirigir a `/games` los enlaces que hoy van a `/`: "VOLVER AL VAULT" en Detalle (`app/juegos/[id]/page.tsx`) y Reproductor (`components/game-player.tsx`), "VOLVER A LA BIBLIOTECA" en `app/salon/page.tsx`, y el envío y "JUGAR COMO INVITADO" en `components/auth-form.tsx`.
- La 404 (`app/not-found.tsx`) y el logo del nav siguen apuntando a `/`.
- Portar a `app/globals.css` las clases de las secciones `HOME PAGE`, `ABOUT PAGE`, `ACTIVITY` y `PRICING` de `references/templates/home-about/styles.css`. Incluye `.reveal`, `.kicker`, `.section-head`, `.shake`, `.press`, `.caret` y las keyframes que falten (`float`, `shake`, …).

**Fuera de alcance (para specs futuros):**

- Envío real del formulario de contacto (Server Action, correo, API o almacenamiento).
- Validación del formato del correo más allá de `type="email"` del navegador.
- Actividad en vivo y top jugadores con datos reales o derivados de puntuaciones.
- La sección `GAMEPAD` (`gp-*`, `dp-*`) del `styles.css` de la plantilla.
- Abrir `/login` directamente en la pestaña "CREAR CUENTA".
- Renombrar `/juegos/[id]` a `/games/[id]`.
- Redirección de URLs antiguas (no hacen falta: `/` sigue existiendo).
- Autenticación, persistencia y juegos reales (igual que en SPEC 01).
- Framework de tests.

## Modelo de datos

Los textos fijos de la landing viven en `lib/home.ts`. Se copian tal cual de `home.jsx`. No se derivan de `GAMES` ni de `seededScores`.

```ts
import type { GameColor } from "@/lib/games";

export type Feature = {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;       // "JUEGOS CLÁSICOS"
  desc: string;
  color: GameColor;
};

export type HomeStat = { n: string; u: string; s: string }; // "12+", "JUEGOS", "Y CONTANDO"

export type RecentScore = {
  player: string;      // "NEONFOX"
  game: string;        // "Caída"
  score: number;       // 184220
  ago: string;         // "hace 2 min"
  color: GameColor;
};

export type TopPlayer = { rank: number; player: string; score: number };

export type Faq = { q: string; a: string };

export const FEATURES: Feature[];         // 4
export const HOME_STATS: HomeStat[];      // 3
export const RECENT_SCORES: RecentScore[]; // 7
export const TOP_PLAYERS: TopPlayer[];    // 5
export const PRICING_PERKS: string[];     // 6
export const FAQS: Faq[];                 // 3
```

Convenciones:

- Las puntuaciones se muestran con `formatScore` de `lib/games.ts`. La plantilla usa `toLocaleString`, que no se usa aquí.
- El ancho de la barra de `TOP_PLAYERS` se calcula en el render como `100 - i * 16` % (valor dinámico, va en `style`).
- Los textos de "Acerca de" (misión, highlights, tips) son pocos y se quedan dentro de su componente.
- El estado del formulario de contacto es local al componente: `{ name, email, msg }`, `sent: string | null` y `shake: boolean`.

## Plan de implementación

Antes de crear rutas nuevas, consultar `node_modules/next/dist/docs/` para páginas estáticas y Client Components con `cacheComponents: true`. Usar `/frontend-design` para el diseño de la interfaz, como indica `CLAUDE.md`.

1. Mover la Biblioteca a `app/games/page.tsx`. Dejar en `app/page.tsx` un placeholder mínimo. Actualizar `LINKS` en `components/nav-links.tsx`: "Biblioteca" → `/games`, activa en `/games` y `/juegos/*`. Verificación: `/games` muestra la Biblioteca y filtrar por "PUZZLE" deja solo CAÍDA.
2. Redirigir a `/games` los enlaces de Detalle, Reproductor, Salón y `auth-form.tsx`. La 404 y el logo se quedan en `/`. Verificación: "VOLVER AL VAULT" en `/juegos/caida` lleva a `/games`.
3. Añadir "Inicio" (`/`) y "Acerca de" (`/about`) a `LINKS`, en el orden indicado en el alcance. `MobileMenu` los hereda de `LINKS`. Verificación: los 4 enlaces se ven en escritorio y en el panel móvil.
4. Portar a `app/globals.css` las clases de las secciones HOME PAGE, ACTIVITY y PRICING, y `.reveal`, con la regla `prefers-reduced-motion`. Verificación: `next build` compila.
5. Crear `lib/home.ts` con los tipos y constantes del modelo de datos.
6. Crear `components/reveal-observer.tsx` (cliente). Observa los `.reveal` del documento y les añade `.in`. Se desconecta en el cleanup. Para que sin JS el contenido sea visible, el estado oculto de `.reveal` se activa solo cuando el observer marca el documento (por ejemplo, una clase `reveal-ready` en `<html>`).
7. Crear `components/home-silhouettes.tsx` (8 siluetas SVG) y `components/pixel-icons.tsx` (`FeatureIcon` y `HighlightIcon`). Ambos son componentes de servidor.
8. Construir la landing en `app/page.tsx` (servidor): hero, "¿Por qué?", mini-rail, estadísticas, actividad, precios y CTA final, con `RevealObserver` montado. Los `transitionDelay` y `animationDelay` escalonados van en `style`. Verificación: `/` coincide con la plantilla a 1280px.
9. Portar a `app/globals.css` las clases de la sección ABOUT PAGE y las keyframes `shake` y `caret` que falten.
10. Crear `components/contact-form.tsx` (cliente) con validación, temblor, terminal de éxito y reinicio.
11. Crear `app/about/page.tsx` (servidor): hero, highlights, divisor, intro de contacto y `ContactForm`, con `RevealObserver` montado.
12. Pasar a utilidades Tailwind con tokens los `style={{…}}` estáticos de la plantilla. Ejemplos: `textAlign: "center"`, `marginTop: 24`, `width: "100%"`. Dejar en `style` solo valores dinámicos.
13. Actualizar la sección "App structure" de `CLAUDE.md`: rutas `/`, `/games`, `/about` y `lib/home.ts`.

## Criterios de aceptación

- [x] `next build` termina sin errores ni advertencias de TypeScript.
- [x] La consola del navegador no muestra errores ni advertencias de hidratación en `/`, `/games` ni `/about`.
- [x] `/` muestra el título "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA" y las 8 siluetas animadas.
- [x] "▶ EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/games`.
- [x] "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/login`.
- [x] El mini-rail muestra los 6 primeros juegos de `GAMES` en orden, y pulsar uno navega a `/juegos/<id>`.
- [x] "VER SALÓN →" navega a `/salon`.
- [x] La fila de NEONFOX en "ÚLTIMAS PUNTUACIONES" muestra "+184.220".
- [x] El primer puesto de "TOP JUGADORES · HOY" muestra "312.840" con la barra al 100%.
- [x] Las secciones `.reveal` aparecen con fundido al entrar en pantalla.
- [x] Con `prefers-reduced-motion: reduce` emulado, todas las secciones son visibles sin transición.
- [x] Con JavaScript desactivado, todas las secciones de `/` y `/about` son visibles.
- [x] `/games` muestra la Biblioteca de SPEC 01 con el hero "ARCADE VAULT", las 8 cards, la búsqueda y los chips.
- [x] El nav muestra en orden "Inicio", "Biblioteca", "Salón de la Fama", "Acerca de", también en el menú móvil.
- [x] "Inicio" está activo solo en `/`. "Biblioteca" está activa en `/games`, `/juegos/<id>` y `/juegos/<id>/jugar`. "Acerca de" está activo en `/about`.
- [x] El logo del nav lleva a `/`.
- [x] "VOLVER AL VAULT" en Detalle y en el modal del Reproductor lleva a `/games`.
- [x] "VOLVER A LA BIBLIOTECA" en el Salón lleva a `/games`.
- [x] Enviar el login o pulsar "JUGAR COMO INVITADO" navega a `/games`.
- [x] El botón de la 404 lleva a `/`.
- [x] `/about` muestra "ACERCA DE ARCADE VAULT", 3 highlights, el divisor de píxeles y el formulario de contacto.
- [x] Enviar el formulario con algún campo vacío o solo con espacios lo hace temblar y no muestra la terminal.
- [x] Enviar con los 3 campos completos y nombre "px_kai" muestra la terminal con "GRACIAS, PX_KAI.".
- [x] El envío del formulario no hace ninguna petición de red ni escribe en `localStorage`.
- [x] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [x] Comparadas lado a lado con `references/templates/home-about/arcade-vault-standalone.html` a 1280px, `/` y `/about` coinciden en colores, fuentes, espaciado y animaciones.

## Decisiones

- **Sí:** la landing en `/` y la Biblioteca en `/games`. La landing es la puerta de entrada, como en la plantilla.
- **No:** dejar la Biblioteca en `/` y la landing en otra ruta. La landing perdería su papel.
- **Sí:** `/about` en inglés, en línea con `/games`.
- **No:** `/acerca`.
- **Sí:** mantener `/juegos/[id]`. Renombrarla es otro cambio y rompería enlaces sin aportar nada a este spec.
- **Sí:** los enlaces de "volver" del Detalle, Reproductor, Salón y Login van a `/games`. Esas pantallas pertenecen al flujo de juego.
- **Sí:** la 404 y el logo van a `/`. Son la salida genérica al inicio del sitio.
- **Sí:** formulario de contacto solo visual, igual que la plantilla. Coherente con el MVP visual de SPEC 01.
- **No:** Server Action o envío real. Merece su propio spec (destino, antispam, privacidad).
- **Sí:** textos fijos de la landing copiados tal cual en `lib/home.ts`. Separa contenido y presentación y será fácil de reemplazar por datos reales.
- **No:** derivar estadísticas y actividad de `GAMES` / `seededScores`. Se apartaría del copy de la plantilla ("12+ JUEGOS") y los datos seguirían siendo falsos.
- **Sí:** `formatScore` en lugar de `toLocaleString`. Mismo formato en servidor y cliente.
- **Sí:** respetar `prefers-reduced-motion` y que el contenido sea visible sin JS. El efecto `.reveal` no debe ocultar contenido de forma permanente.
- **No:** copiar `.reveal` tal cual (opacidad 0 por defecto). Sin JS o con un fallo del observer, la página quedaría en blanco.
- **Sí:** las páginas son de servidor y solo `RevealObserver` y `ContactForm` son de cliente. Las páginas siguen estáticas.
- **Sí:** reutilizar y ampliar las clases de `globals.css`, como en SPEC 01. Da fidelidad visual con la plantilla.
- **No:** portar la sección GAMEPAD del `styles.css` de la plantilla. Ninguna pantalla de este spec la usa.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Algún enlace a `/` queda sin actualizar y lleva a la landing en lugar de a la Biblioteca. | El paso 2 lista los archivos concretos. Los criterios de aceptación verifican cada botón. |
| `.reveal` deja contenido invisible si el observer no corre (sin JS, error de hidratación o elementos montados después). | El estado oculto depende de una clase que añade el observer. Regla `prefers-reduced-motion`. Criterio con JS desactivado. |
| `RevealObserver` solo ve los `.reveal` presentes al montarse. Navegar entre `/` y `/about` en cliente podría no observar los nuevos. | Montar `RevealObserver` dentro de cada página (no en el layout), para que se reinicie al cambiar de ruta. |
| Colisión de nombres al portar CSS (p. ej. `.field`, `.final`, `.stat-*` ya existen en `globals.css`). | Revisar cada selector antes de pegarlo. Las clases nuevas usan los prefijos de la plantilla (`home-`, `about-`, `contact-`, `stat-block`). Revisar visualmente Login y Reproductor tras el paso 4. |
| Error de hidratación por formato numérico. | Solo `formatScore`. |

## Lo que **no** entra en este spec

- Envío real del formulario de contacto.
- Actividad y rankings con datos reales.
- La sección GAMEPAD de la plantilla.
- Renombrar `/juegos/[id]`.
- Abrir el login directamente en "CREAR CUENTA".
- Autenticación, persistencia, juegos reales y tests.

Cada uno de estos, si llega, va en su propio spec.
