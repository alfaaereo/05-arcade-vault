# SPEC 05 — Juego real ASTEROIDS embebido en el reproductor

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-17
> **Objetivo:** Añadir al catálogo el juego ASTEROIDS de `references/started-games/02-asteroids/` y hacerlo jugable en `/juegos/asteroids/jugar` dentro de un iframe, conectado al modal "FIN DEL JUEGO" de la plataforma por `postMessage`.

## Por qué existe este spec

Hasta ahora `components/game-player.tsx` simula todas las partidas: la puntuación sube sola (SPEC 01). Este es el primer juego real. El juego ya existe como HTML + canvas sin dependencias, así que se sirve tal cual como archivo estático y la plataforma solo lo envuelve. El protocolo de mensajes de este spec es el que reutilizarán los siguientes juegos (`03-tetris`, `04-arkanoid`).

## Alcance

**Entra:**

- Copia de `index.html`, `game.js` y `favicon.svg` en `public/games/asteroids/`, servida en `/games/asteroids/index.html`. `references/started-games/02-asteroids/` queda intacto.
- El aspecto visual del juego no cambia: blanco sobre negro, HUD (SCORE, NIVEL, vidas, indicador 3x) dibujado en el canvas.
- Cambios en la copia de `index.html`: el canvas escala para llenar el iframe manteniendo 4:3 (sin borde ni barras de scroll).
- Cambios en la copia de `game.js`:
  - `preventDefault` en `keydown` para `Space`, `ArrowLeft`, `ArrowRight`, `ArrowUp` y `ArrowDown`.
  - Detección de modo embebido (`window.parent !== window`).
  - En modo embebido, al llegar a `gameover` no se dibuja el overlay "GAME OVER" ni se reinicia con Espacio. Se envía `av:gameover` al padre una sola vez por partida.
  - En modo embebido, escucha `av:pause`, `av:resume`, `av:restart` y `av:end` del padre.
  - Abierto directamente (no embebido), el juego se comporta como el original: overlay "GAME OVER" y reinicio con Espacio.
- Nuevo campo opcional `src` en el tipo `Game` y nueva entrada `asteroids` al final de `GAMES` en `lib/games.ts`.
- La tarjeta de `asteroids` reutiliza la portada `cover-rocas`.
- Nuevo componente `components/game-over-modal.tsx`: el modal "FIN DEL JUEGO" extraído de `GamePlayer` sin cambios visuales. Guardar sigue siendo solo visual.
- Nuevo componente `components/embedded-game-player.tsx`: marco CRT con el iframe, barra `player-hud` solo con los botones PAUSA/REANUDAR, FIN y SALIR (sin estadísticas), overlay "EN PAUSA" y el modal.
- `app/juegos/[id]/jugar/page.tsx` renderiza `EmbeddedGamePlayer` si el juego tiene `src`, y `GamePlayer` (simulado) si no.
- Pantallas pequeñas: el iframe escala con el marco CRT. No hay controles táctiles.
- Actualizar `CLAUDE.md` con una sección "Juegos embebidos (SPEC 05)".

**Fuera de alcance (para specs futuros):**

- Integrar `03-tetris` y `04-arkanoid`.
- Guardar puntuaciones (Supabase o `localStorage`) y Salón de la Fama con datos reales de ASTEROIDS.
- Mostrar en la barra de la plataforma la puntuación, vidas y nivel en vivo.
- Reskin neón del juego (colores del tema, fuente Press Start 2P).
- Portada propia `cover-asteroids`.
- Controles táctiles para móvil.
- Sonido.
- Portar el motor a TypeScript o a un Client Component con canvas.
- Cambiar la entrada `rocas`, que sigue simulada.
- Framework de tests.

## Modelo de datos

```ts
// lib/games.ts
export type Game = {
  // …campos actuales sin cambios…
  src?: string; // URL del juego embebible en public/. Sin src, el reproductor simula la partida.
};

// Nueva entrada, al final de GAMES
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Rota, propulsa y dispara en un campo de rocas.",
  long: "Tu nave vectorial flota en un espacio sin bordes: lo que sale por un lado entra por el otro. Dispara para partir las rocas grandes en medianas y las medianas en pequeñas. Recoge el power-up 3x para disparar en abanico durante 5 segundos. Tienes tres vidas.",
  cat: "SHOOTER",
  cover: "cover-rocas",
  color: "cyan",
  best: 0,
  plays: "0",
  src: "/games/asteroids/index.html",
}
```

```ts
// Protocolo postMessage entre la plataforma (padre) y el juego (iframe)
type ParentToGame =
  | { type: "av:pause" } // congela update(); el canvas sigue dibujando el último frame
  | { type: "av:resume" } // reanuda sin salto de dt
  | { type: "av:restart" } // initGame()
  | { type: "av:end" }; // fuerza gameover y responde av:gameover

type GameToParent = { type: "av:gameover"; score: number };
```

```ts
// components/game-over-modal.tsx
type GameOverModalProps = {
  score: number;
  onRestart: () => void; // "JUGAR DE NUEVO"
};
// Gestiona internamente el nombre (INVITADO, máx. 10, mayúsculas) y el estado "guardado".
```

Convenciones:

- Todos los tipos de mensaje llevan el prefijo `av:`. Los mensajes con otro `type` se ignoran.
- El padre envía con `targetOrigin = window.location.origin` y solo acepta mensajes cuyo `event.source` sea el `contentWindow` del iframe y cuyo `event.origin` sea el propio.
- El juego solo acepta mensajes cuyo `event.source` sea `window.parent` y cuyo `event.origin` sea `location.origin`.
- Tras cargar el iframe, tras `av:resume` y tras `av:restart`, el padre llama a `iframe.contentWindow.focus()` para que el teclado llegue al juego.
- El iframe lleva `title="ASTEROIDS"` y ocupa todo `.crt-screen`, que ya es 4:3 como el canvas de 800×600.

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` la guía de la carpeta `public` (archivos estáticos). Usar `/frontend-design` para la barra de botones y el marco del iframe, como indica `CLAUDE.md`.

1. Copiar `index.html`, `game.js` y `favicon.svg` a `public/games/asteroids/`. Ajustar el CSS de `index.html` para que el canvas llene la ventana manteniendo 4:3 y quitar el borde. Añadir `preventDefault` a las teclas del juego en `game.js`. Verificación: `/games/asteroids/index.html` se juega como el original, incluido "GAME OVER — ESPACIO PARA REINICIAR".
2. Añadir a `game.js` la detección de modo embebido, el listener de `av:pause`/`av:resume`/`av:restart`/`av:end` y el envío único de `av:gameover`. En modo embebido no se dibuja el overlay ni se reinicia con Espacio. Verificación: abierto directamente sigue igual que en el paso 1.
3. Añadir `src?: string` a `Game` y la entrada `asteroids` al final de `GAMES`. Verificación: `/games` muestra la tarjeta ASTEROIDS con `cover-rocas`, `/juegos/asteroids` muestra el detalle, y `/juegos/asteroids/jugar` todavía usa el reproductor simulado.
4. Extraer el modal de `GamePlayer` a `components/game-over-modal.tsx` y usarlo desde `GamePlayer`. Verificación: el reproductor simulado de cualquier juego se ve y se comporta igual que antes.
5. Crear `components/embedded-game-player.tsx` (iframe, botones PAUSA/REANUDAR, FIN, SALIR, overlay "EN PAUSA", modal al recibir `av:gameover`, "JUGAR DE NUEVO" envía `av:restart`) y elegirlo en `app/juegos/[id]/jugar/page.tsx` cuando `game.src` existe. Verificación: se juega ASTEROIDS en `/juegos/asteroids/jugar` y al perder las 3 vidas aparece el modal con la puntuación real.
6. Actualizar `CLAUDE.md` con la sección "Juegos embebidos (SPEC 05)": dónde van los archivos, el campo `src`, el protocolo `av:*` y la regla de modo embebido vs. abierto directamente.

## Criterios de aceptación

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/asteroids` y `/juegos/asteroids/jugar` aparecen prerenderizadas.
- [ ] `references/started-games/02-asteroids/` no tiene cambios en `git status`.
- [ ] `/games` muestra la tarjeta ASTEROIDS (SHOOTER, cyan, portada `cover-rocas`) y el filtro SHOOTER la incluye.
- [ ] Al entrar en `/juegos/asteroids/jugar`, las flechas y Espacio controlan la nave sin hacer clic antes en el juego.
- [ ] Pulsar Espacio o las flechas no hace scroll en la página.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, en 4:3 y sin barras de scroll dentro del iframe.
- [ ] La barra superior muestra solo PAUSA, FIN y SALIR, sin Jugador, Puntuación, Vidas ni Nivel.
- [ ] PAUSA congela asteroides, nave y balas, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin que los objetos salten de posición.
- [ ] Al perder las 3 vidas aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el canvas, y el canvas no dibuja "GAME OVER".
- [ ] FIN durante la partida abre el modal con la puntuación actual del canvas.
- [ ] Con el modal abierto, Espacio no reinicia el juego.
- [ ] "JUGAR DE NUEVO" cierra el modal y reinicia el juego con SCORE 0, NIVEL 1 y 3 vidas.
- [ ] "GUARDAR PUNTUACIÓN" muestra "▸ PUNTUACIÓN GUARDADA_" y no hace ninguna petición de red.
- [ ] SALIR lleva a `/juegos/asteroids` y "VOLVER AL VAULT" a `/games`.
- [ ] Abrir `/games/asteroids/index.html` directamente sigue mostrando "GAME OVER — ESPACIO PARA REINICIAR" y Espacio reinicia.
- [ ] `/juegos/rocas/jugar` y el resto de juegos siguen con el reproductor simulado, que se ve igual que antes.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/asteroids/jugar`.
- [ ] `CLAUDE.md` documenta los juegos embebidos y el protocolo `av:*`.

## Decisiones

- **Sí:** nueva entrada `asteroids`, por decisión del usuario. `rocas` queda como está y sigue simulada.
- **No:** reutilizar o renombrar `rocas`. Renombrar cambiaría URLs existentes.
- **Sí:** entrada al final de `GAMES`. No altera los 6 juegos de la landing ni la pestaña inicial del Salón.
- **Sí:** iframe con archivos estáticos en `public/games/asteroids/`, por decisión del usuario. El juego no necesita build y la copia queda aislada de React.
- **No:** portar el motor a TypeScript o a un Client Component. Más trabajo y más riesgo para el primer juego.
- **No:** cargar `game.js` como script en la página. Usa globales y listeners en `window`.
- **Sí:** copiar en vez de mover. `references/` sigue siendo la fuente original de referencia.
- **Sí:** HUD dentro del canvas, por decisión del usuario. La barra de la plataforma solo tiene botones para no duplicar datos.
- **No:** enviar score/vidas/nivel en vivo al padre. Solo haría falta si la barra mostrara estadísticas.
- **Sí:** modal "FIN DEL JUEGO" de la plataforma en lugar del overlay del canvas. Unifica el cierre de partida con el resto de juegos.
- **Sí:** protocolo `postMessage` bidireccional con prefijo `av:`. Hace que PAUSA, FIN y JUGAR DE NUEVO funcionen de verdad y servirá para los siguientes juegos.
- **No:** recargar el iframe para reiniciar. Es más lento y pierde el foco.
- **Sí:** el juego conserva el comportamiento original cuando se abre directamente. Permite probarlo fuera de la plataforma.
- **Sí:** campo opcional `src` en `Game` para decidir entre reproductor real y simulado. No obliga a tocar las demás entradas.
- **Sí:** extraer el modal a `components/game-over-modal.tsx`. Lo comparten los dos reproductores sin duplicar marcado.
- **Sí:** aspecto visual original, por decisión del usuario. El reskin neón queda fuera.
- **Sí:** portada `cover-rocas` reutilizada, por decisión del usuario. Habrá dos tarjetas con la misma portada hasta que exista `cover-asteroids`.
- **Sí:** `best: 0` y `plays: "0"`. Es un juego nuevo y no hay puntuaciones reales.
- **Sí:** escalar con el marco CRT y sin controles táctiles, por decisión del usuario.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El iframe no tiene el foco y el teclado no llega al juego.                                    | El padre llama a `contentWindow.focus()` al cargar, al reanudar y al reiniciar. Un clic en el juego también le da el foco. Hay un criterio que lo comprueba.  |
| Otra ventana envía mensajes `av:*` falsos (p. ej. un `av:gameover` con puntuación inventada). | Ambos lados comprueban `event.source` y `event.origin`. Hoy no se guardan puntuaciones; el spec de persistencia no debe confiar en la puntuación del cliente. |
| `/games/asteroids/index.html` comparte prefijo con la ruta `/games` de la biblioteca.         | No hay página en `/games/asteroids`, así que no hay conflicto entre `public/` y `app/`. `next build` lo confirma.                                             |
| Al pausar, el siguiente frame calcula un `dt` enorme y los objetos saltan.                    | Al reanudar se reinicia `lastTime`. Además `dt` ya está limitado a 50 ms.                                                                                     |
| El juego envía `av:gameover` varias veces en la misma partida.                                | Una bandera en `game.js` asegura un único envío hasta el siguiente `av:restart`.                                                                              |
| Las copias en `public/` y en `references/` divergen.                                          | `references/` es solo la fuente original. Los cambios futuros se hacen en `public/games/asteroids/`.                                                          |

## Lo que **no** entra en este spec

- Tetris y Arkanoid.
- Guardar puntuaciones y Salón real.
- Estadísticas en vivo en la barra de la plataforma.
- Reskin neón y portada propia.
- Controles táctiles y sonido.
- Port del motor a TypeScript.
- Cambios en `rocas`.
- Tests.

Cada uno de estos, si llega, va en su propio spec.
