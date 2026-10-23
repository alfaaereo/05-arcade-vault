# Checklist de plataforma para integrar un juego real

Resume lo que SPEC 05 y SPEC 06 dejaron listo y lo que **cada** juego nuevo tiene que añadir. Úsalo para escribir el Alcance, el Plan y los Criterios del spec.

## Lo que ya existe y no se toca

- `components/embedded-game-player.tsx`: iframe, barra PAUSA/REANUDAR · FIN · SALIR, overlay "EN PAUSA", foco y modal. Pasa `gameId={game.id}` a `GameOverModal`.
- `components/game-over-modal.tsx`: con `gameId` guarda de verdad con `saveScore()` y muestra "PUESTO #N" + "VER SALÓN".
- `lib/save-score.ts`: validación (`PLAYER_NAME_RE`, `MAX_SCORE = 10_000_000`), insert y cálculo del puesto.
- `lib/leaderboard.ts` + `components/hall-of-fame.tsx`: un juego usa datos reales en `/salon` si su id está en la tabla `games`; si no, `seededScores`.
- `app/juegos/[id]/jugar/page.tsx`: con `game.src` usa `EmbeddedGamePlayer`; sin él, el simulado.

Consecuencia: **dar `src` al juego y añadir su id a `games` basta** para tener partida real, guardado y Salón real. Solo hay que tocar componentes si el juego rompe alguna suposición (ver "Casos especiales").

## Lo que añade cada juego

### 1. Archivos estáticos — `public/games/<id>/`

- Modo referencia: **copiar** desde `references/started-games/<NN-nombre>/` solo lo necesario para ejecutar el juego (`index.html`, `*.js`, `*.css`, `assets/`, `favicon.svg`…). `references/` no cambia (`git status` lo comprueba).
- Modo nuevo: crear desde `plantilla-juego/` de este skill.
- Las rutas a assets deben ser relativas (`./assets/…`) para que funcionen desde `/games/<id>/`.
- No debe existir una página `app/games/<id>`: `public/games/<id>/index.html` comparte prefijo con `/games` y `next build` confirma que no hay conflicto.

### 2. `index.html` — llenar el iframe en 4:3

```css
html,
body {
  height: 100%;
  overflow: hidden;
}
body {
  margin: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Escala el lienzo 800×600 a la ventana (o al iframe) manteniendo 4:3. */
canvas {
  display: block;
  width: min(100vw, calc(100vh * 4 / 3));
  height: min(100vh, calc(100vw * 3 / 4));
}
```

Quitar bordes, márgenes y `height: 100vh` que provoquen scroll. Si el juego tiene HUD DOM alrededor del canvas, el conjunto entero tiene que caber en 4:3.

### 3. `game.js` — protocolo `av:*`

Según `protocolo-av.md`: `preventDefault` de teclas, `clearKeys` en `blur`, `EMBEDDED`, `endGame()` con envío único, listener `message` con comprobación de `source`/`origin`, `if (!paused) update(dt)`, sin overlay ni reinicio por tecla en modo embebido, comportamiento original abierto directamente.

### 4. Catálogo — `lib/games.ts`

Entrada nueva al final de `GAMES` (no altera los 6 juegos de la landing ni la pestaña inicial del Salón):

```ts
{
  id: "{{id}}",
  title: "{{TITULO}}",
  short: "{{short}}",
  long: "{{long}}",
  cat: "{{CAT}}",
  cover: "{{cover-*}}",
  color: "{{color}}",
  best: 0,
  plays: "0",
  src: "/games/{{id}}/index.html",
  // Mando táctil (SPEC 10): solo las direcciones y botones (0–4) que usa el juego.
  controls: {
    pad: [
      { code: "ArrowLeft", dir: "left" },
      { code: "ArrowRight", dir: "right" },
    ],
    buttons: [{ code: "Space", label: "{{ACCIÓN}}" }],
  },
}
```

`controls` declara el mando táctil que la plataforma superpone al CRT en pantallas táctiles: `pad` son las direcciones de la cruceta (`dir`: `up` | `down` | `left` | `right`) y `buttons` los botones en rombo (1.º abajo, 2.º derecha, 3.º izquierda, 4.º arriba), cada uno con el `code` que se envía como `av:key`. `repeat: true` repite la tecla al mantenerla (como mover piezas en TETRIS). Cada `code` debe estar en `KEY_OF` del `game.js`. Sin `controls`, en táctil se muestra "REQUIERE TECLADO".

O, si el usuario lo elige, añadir solo `src` a la entrada simulada existente (conserva id, URL y textos; `best`/`plays` pasan a `0`/`"0"` si se decide).

Si la portada es nueva (`cover-<id>`), se define en `app/globals.css` junto a los demás `cover-*` y se diseña con `/frontend-design`.

### 5. Supabase — fila en `games`

```sql
-- supabase/migrations/<version>_add_{{id}}_to_games.sql
insert into public.games (id, title) values ('{{id}}', '{{TITULO}}');
```

- Aplicar con `apply_migration` del MCP (nombre `add_{{id}}_to_games`).
- Renombrar el archivo al `version` que reporte `list_migrations`.
- Verificar con `execute_sql`: `select * from games order by id` muestra el juego nuevo.
- Revisar `get_advisors` (security): no debe aparecer ningún aviso nuevo.
- Solo se insertan datos: **no** hace falta regenerar `lib/supabase/database.types.ts`.
- Sin esta fila, el insert del modal falla por clave foránea y muestra "REINTENTAR".

### 6. `CLAUDE.md`

- Sección "Embedded games (SPEC 05)": actualizar qué juegos tienen `src` ("Only `asteroids` has `src` today…").
- Sección "Leaderboard (SPEC 06)": actualizar qué juegos están en `games` ("Only `asteroids` is in `games`…").
- Si el juego introduce una convención nueva (p. ej. variante de bucle, reproductor no 4:3), documentarla en una línea.

## Casos especiales (solo si aplican)

- **Proporción distinta de 4:3:** `.crt-screen` es 4:3 y `EmbeddedGamePlayer` limita el ancho con `max-w-[min(1100px,max(420px,calc((100dvh-296px)*4/3+96px)))]`. O se adapta el juego a 4:3 (preferible, sin tocar la plataforma) o se añade un campo opcional en `Game` (p. ej. `aspect`) y se ajustan el reproductor y la fórmula. Esto último es un cambio de plataforma: decisión explícita en el spec.
- **Texto fijo del marco CRT** (`CARGA · 1MB`): es decorativo; no se cambia salvo que el spec lo pida.
- **Juego que sustituye a uno simulado:** el detalle `/juegos/<id>` sigue mostrando el top 10 simulado y el récord de `best` (fuera de alcance, igual que en SPEC 06).

## Criterios de aceptación estándar

Copiar al spec adaptando `<id>`/`<TITULO>`:

- [ ] `next build` termina sin errores ni advertencias de TypeScript, y `/juegos/<id>` y `/juegos/<id>/jugar` aparecen prerenderizadas.
- [ ] `references/started-games/<NN-nombre>/` no tiene cambios en `git status` (modo referencia).
- [ ] `/games` muestra la tarjeta `<TITULO>` (categoría, color y portada del spec) y el filtro de su categoría la incluye.
- [ ] Al entrar en `/juegos/<id>/jugar`, los controles responden sin hacer clic antes en el juego.
- [ ] Las teclas del juego no hacen scroll en la página.
- [ ] A 1280px y a 375px de ancho, el juego se ve entero dentro del marco CRT, sin barras de scroll dentro del iframe.
- [ ] PAUSA congela el juego, muestra "EN PAUSA" y cambia a REANUDAR. REANUDAR continúa sin saltos.
- [ ] Al perder aparece el modal "FIN DEL JUEGO" con la misma puntuación que mostraba el juego, y el juego no dibuja su propio "GAME OVER".
- [ ] FIN durante la partida abre el modal con la puntuación actual.
- [ ] Con el modal abierto, las teclas del juego no lo reinician.
- [ ] "JUGAR DE NUEVO" cierra el modal y reinicia el juego desde cero.
- [ ] Guardar con `INVITADO` muestra "GUARDANDO…", luego "▸ PUNTUACIÓN GUARDADA_", "PUESTO #N" y "VER SALÓN"; la fila tiene `game_id = '<id>'` y la puntuación del juego.
- [ ] La pestaña `<TITULO>` de `/salon` muestra la puntuación guardada (o "SIN PUNTUACIONES TODAVÍA" con la tabla vacía).
- [ ] Abrir `/games/<id>/index.html` directamente se comporta como el original (overlay de fin y reinicio propio).
- [ ] `games` contiene la fila `<id>` / `<TITULO>` y `list_migrations` muestra `add_<id>_to_games`.
- [ ] El resto de juegos (reales y simulados) siguen igual que antes.
- [ ] La consola del navegador no muestra errores ni advertencias de hidratación en `/juegos/<id>/jugar` ni en `/salon`.
- [ ] Las filas de prueba de `leaderboard` creadas durante la verificación se borran.
- [ ] `CLAUDE.md` refleja que `<id>` es un juego real y está en `games`.
