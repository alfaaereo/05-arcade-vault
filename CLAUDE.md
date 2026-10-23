# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online platform for playing retro-style games and competing for high scores. The UI and product copy are in Spanish.

Development follows Spec Driven Design using the `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) (install with `npx skills@latest add Klerith/fernando-skills`).

There is no test framework set up yet.

## Stack and configuration

- **Next.js 16.4 (App Router) + React 19.3 + TypeScript (strict).** This Next version differs from what you may know. Before writing Next-specific code, check the bundled docs in `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …).
- `next.config.ts` turns on `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback`. Cache Components changes the defaults for data fetching and rendering (dynamic by default, `"use cache"`, Suspense boundaries around dynamic data). Read the relevant docs before you add data fetching or caching.
- Tailwind CSS v4 runs through the `@tailwindcss/turbopack` loader set in `next.config.ts` (`turbopack.rules`), not PostCSS. Theme tokens live in `app/globals.css` via `@theme inline`.
- Typed route helpers such as `LayoutProps<"/">` are global types generated into `.next/types` by `next dev`/`next build`.
- The path alias `@/*` maps to the repo root.

## Tooling and conventions

- Scripts: `npm run dev`, `build`, `start`, `lint` (ESLint 9 flat config, `eslint-config-next` + `eslint-config-prettier`), `format` (Prettier, `.prettierrc.json`: double quotes, semicolons; `.prettierignore` skips `references/`).
- ESLint enforces `no-multiple-empty-lines` with `max: 0`: code has no blank lines (template literals are respected). Markdown keeps its blank lines.
- PostToolUse hook `.claude/hooks/format-lint.mjs` (`.claude/settings.json`, on `Write|Edit`): runs Prettier on `.ts/.tsx/.js/.jsx/.mjs/.md` files inside the project and `eslint --fix --max-warnings 0` on code files. If ESLint still reports problems it exits with code 2 and you must fix them.
- MCP servers: Supabase (`.mcp.json`, enabled in `.claude/settings.local.json`) for migrations, SQL and type generation; Playwright for visual checks. Save Playwright screenshots in `.playwright-screenshots/` (git-ignored except `.gitkeep`).

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

- `/spec <requirement>` and `/spec-impl <NN-spec-name>`: from Klerith/fernando-skills, pinned in `skills-lock.json` (installed in `.agents/skills/` and `.claude/skills/`). `/spec` writes `specs/NN-<name>.md`; `/spec-impl` checks the spec is approved, creates a branch named after it and implements it step by step (one commit per step: `spec NN: paso N — …`).
- `/add-game <folder|description>` (`.claude/skills/add-game/`, project-local): drafts the spec for a new real game. See "Embedded games".
- Subagent `game-planner` (`.claude/agents/game-planner.md`): decides which game to add next. It proposes 1–3 candidates without repeating earlier ones, keeps the To Do in `references/game-suggestions-todo.md` and its persistent project memory in `.claude/agent-memory/game-planner/MEMORY.md` (versioned). Its recommendation ends with `/add-game <description>`.
- Subagent `game-jam` (`.claude/agents/game-jam.md`): takes a theme and autonomously designs 1 game for it. It creates `specs/game-jam/<id>/` with two complete, self-contained and mutually exclusive specs in `Borrador` and without a number, in the format of SPEC 07–09 (game + iframe + leaderboard each): `01-juego-<id>-<enfoque-a>.md` (proposal A, the recommended one) and `02-juego-<id>-<enfoque-b>.md` (proposal B, an alternative design, not an evolution). Pick one, move it to `specs/NN-juego-<id>.md`, approve it and run `/spec-impl`; the other stays discarded in `specs/game-jam/`. Its memory (themes and used ids) lives in `.claude/agent-memory/game-jam/` (versioned).
- Subagent `skin-designer` (`.claude/agents/skin-designer.md`): gives ONE game, the one you name, the 3 required skins (`clasico` default, `neon`, `retro`), each with a dark and a light mode and checked for dark-mode contrast. The platform sends `av:skin { skin, mode }` to the iframe; the game also reads `?skin=&mode=` when opened directly. The agent verifies with Playwright and tracks status per game in `references/templates/game-width-themes.md`; its memory (reusable palettes and techniques) lives in `.claude/agent-memory/skin-designer/` (versioned).
- `/worktree <requirement>` (user-level skill, may not be installed for every contributor): runs the requirement in an isolated git worktree under `.trees/<name>`.
- Specs written so far: `specs/01` to `specs/09` (MVP screens, landing/about, Resend contact, Supabase, Asteroids, leaderboard, Tetris, Arkanoid, Snake).

## Design reference (`references/`)

`references/` is the original source material and stays untouched: `templates/` (design prototype), `started-games/` (original game builds: `02-asteroids`, `03-tetris`, `04-arkanoid`) and `souce-assets/` (sic; e.g. `snake-assets/` sprites).

`references/templates/` holds the design prototype for the app. It is a standalone React 18 + Babel-in-browser HTML mock (`Arcade Vault.html`), not part of the Next build; `home-about/` holds the landing and about prototype. Use it as the visual and functional spec when you implement screens:

- Screens: `biblioteca.jsx` (game library), `detalle.jsx` (game detail), `reproductor.jsx` (game player and score saving), `auth.jsx` (login), `salon.jsx` (hall of fame / leaderboard), `nav.jsx` (navigation).
- `data.jsx` holds the mock game catalog (`GAMES`: id, title, category, cover class, accent color, best score, play count).
- `app.jsx` does hash-based routing and stores the user and scores in `localStorage` (`av_user`, `av_scores`). These are prototype stand-ins, not the target architecture.
- `styles.css` defines the retro neon theme: CSS variables (`--bg`, `--cyan`, `--magenta`, `--yellow`, …), the "Press Start 2P" and "JetBrains Mono" fonts, and the `av-*` / `cover-*` classes. Port these tokens into the Tailwind theme instead of copying the raw CSS.

## App structure (SPEC 01, SPEC 02)

- Routes: `/` (landing), `/games` (library), `/about` (about + visual-only contact form), `/juegos/[id]` (detail), `/juegos/[id]/jugar` (player), `/login`, `/salon` (hall of fame), plus `app/not-found.tsx`. Game routes are pre-generated with `generateStaticParams`; unknown ids call `notFound()`.
- The catalog lives in `lib/games.ts` (`GAMES`, `CATEGORIES`, `getGame`, `seededScores`, `formatScore`). It only holds real games (`asteroids`, `tetris`, `arkanoid`, `snake` and more...(see `implemented-games.md`) when you need to check wich games are implemented and how to implement new ones); the 8 simulated games of SPEC 01 were removed, so their `/juegos/<id>` URLs now 404. Fixed landing copy (features, stats, activity, pricing, FAQ) lives in `lib/home.ts`. Always format visible numbers with `formatScore` to avoid hydration mismatches.
- Shared components live in `components/`. `Nav` wraps `NavLinks` (`usePathname`) in `<Suspense>` because, with Cache Components, `usePathname` suspends on non-pre-generated params.
- Nav links come from `LINKS` in `components/nav-links.tsx` (shared with `MobileMenu`). "Back" links in the game flow point to `/games`; the logo and the 404 point to `/`.
- Scroll-in sections use the `.reveal` class plus `<RevealObserver />` mounted inside each page. Hidden state only applies once it adds `.reveal-ready` to `<html>`, so content stays visible without JS and with `prefers-reduced-motion`.
- Styling reuses the ported `av-*` classes from `app/globals.css`; one-off styles use Tailwind utilities with the theme tokens (`text-ink-faint`, `font-pixel`, …). `style` is only for dynamic values.
- Visual-only MVP: no session, no score persistence, no real games.

## Contact form (SPEC 03)

- The `/about` contact form sends a real email with Resend through the Server Action `sendContact` in `app/about/actions.ts`. `components/contact-form.tsx` calls it with `useActionState` and shows idle, pending ("ENVIANDO…"), success and error ("REINTENTAR") states. The error terminal uses the `.terminal-success.is-error` modifier.
- The email body comes from `buildContactEmail` in `lib/contact-email.ts`, which escapes user values in the HTML.
- Server-only env vars in `.env.local` (template in `.env.template`, the only versioned `.env*` file; Next does not load it, copy it to `.env.local`): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. `onboarding@resend.dev` as sender only delivers to the Resend account owner. Missing vars make the action return `{ status: "error" }` and log with `console.error`; it never throws.

## Supabase (SPEC 04)

- Integration via `@supabase/ssr` + `@supabase/supabase-js`. No tables, auth or UI use yet.
- `lib/supabase/client.ts` → `createClient()` for Client Components. `lib/supabase/server.ts` → `await createClient()` for Server Components, Server Actions and Route Handlers (create per request; reading `cookies()` makes the route dynamic, so wrap it in `<Suspense>`).
- Env vars in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), read directly in both clients. Never use the secret/`service_role` key.
- No `proxy.ts` session refresh, env validation module or generated types yet; those come with the auth/schema specs.

## Embedded games (SPEC 05)

- Real games are standalone HTML/canvas builds copied from `references/started-games/` into `public/games/<id>/` and loaded in an iframe. `references/` stays untouched as the original source; edit the copy in `public/`.
- The optional `src` field on `Game` (`lib/games.ts`) picks the player: with `src`, `app/juegos/[id]/jugar/page.tsx` renders `EmbeddedGamePlayer` (`components/embedded-game-player.tsx`); without it, the simulated `GamePlayer` (unused today: every catalog entry has `src`). `asteroids`, `tetris` (SPEC 07), `arkanoid` (SPEC 08) and `snake` (SPEC 09) have `src`.
- `postMessage` protocol (all types prefixed `av:`): the platform sends `av:pause`, `av:resume`, `av:restart` and `av:end`; the game replies once per match with `av:gameover { score }`. Both sides check `event.source` and `event.origin`.
- The game detects embedding with `window.parent !== window`. Embedded, it draws no "GAME OVER" overlay and ignores Space to restart; opened directly, it behaves like the original.
- The game keeps its own look and HUD inside the canvas. The platform bar shows only PAUSA/REANUDAR, FIN and SALIR. Both players share `components/game-over-modal.tsx`.
- To add a new real game (from `references/started-games/` or from scratch), run `/add-game <folder|description>` (`.claude/skills/add-game/`). It only writes a draft spec `specs/NN-juego-<id>.md` covering the iframe, the `av:*` protocol, the catalog entry and the `games` row. Implement it with `/spec-impl`.
- A game that is not a single 4:3 canvas scales its whole layout inside the iframe (max 1, letterboxed) instead of changing the player. `tetris` does this in `fitWrapper()` (`public/games/tetris/game.js`).
- Games may use the mouse inside the iframe with no platform change (`arkanoid` scales `mousemove` with `getBoundingClientRect`). A game with several endings (lose or win) routes all of them through one `endGame()` that sends `av:gameover`; if the original has no restart, the copy adds an `initGame()` for `av:restart`.
- `snake` (SPEC 09) is the first game built from the `/add-game` template, with fruit sprites copied from `references/souce-assets/snake-assets/` to `public/games/snake/assets/`. A tick-based game runs a fixed-interval accumulator over rAF (`dt` capped at 50 ms) and resets `acc` and `lastTime` on `av:resume` and `av:restart`, so the snake never jumps several cells at once.
- Each game has a `cover-<id>` class in `app/globals.css` (card and detail). A real game's cover should look like the game: `cover-snake` draws a dot grid and glowing magenta wall on the element and an inline SVG data URI (snake tube + pixel fruit, `center/contain`) on `::after`, so it scales the same in both sizes. Check that layered `background-image` values are valid; an invalid one silently draws nothing.
- The embedded player caps its width so the whole 4:3 screen fits in the viewport height. The platform focuses the iframe after load (also when it loads before hydration), after resuming and after restarting.

## Leaderboard (SPEC 06)

- Supabase tables `games` (`id`, `title`, `created_at`; `id` matches `lib/games.ts`) and `leaderboard` (`id`, `game_id` → `games.id`, `player_name`, `score`, `created_at`). `asteroids`, `tetris`, `arkanoid` and `snake` are in `games`; add a game there (data-only migration, no type regeneration) when it becomes real. `lib/games.ts` stays the catalog source (texts, covers, `src`).
- `/games` reads the `games` table on every request: `getLibraryGames()` in `lib/library.ts` (server, `await connection()` before its `try`) returns the `GAMES` entries whose id is in the table, in catalog order, as `LibraryGame` (adds `best`, the real top score from `leaderboard`, shown on the cards). The page renders it inside `<Suspense>` ("CARGANDO BIBLIOTECA…"); on error it shows "NO SE PUDO CARGAR LA BIBLIOTECA" with a RECARGAR link. `Library` receives the list as the `games` prop. The landing, the Salón and the game routes still use `GAMES` directly.
- Migrations live in `supabase/migrations/<version>_<name>.sql` and are applied to the remote project with the MCP `apply_migration`; rename the file to the version `list_migrations` reports. After any schema change, regenerate `lib/supabase/database.types.ts` with `generate_typescript_types`. Both clients are typed with `Database`.
- RLS on both tables: public SELECT; public INSERT on `leaderboard` only for `game_id`, `player_name`, `score` (column grant), with name `^[A-Z0-9_ ]{1,10}$` (no edge spaces) and score 0–10,000,000. No UPDATE/DELETE. Accepted risk: without auth anyone with the publishable key can insert fake scores; the auth spec must close anonymous INSERT.
- Read: `getLeaderboards()` in `lib/leaderboard.ts` (server) returns the top 12 per game in `games` (score desc, earlier `created_at` wins ties), with dates preformatted `dd/mm/aaaa` in UTC. It calls `await connection()` before its `try` so the prerender rejection of `cookies()` is not caught as a Supabase error. `/salon` renders it inside `<Suspense>`.
- `HallOfFame` uses real rows for games present in `games` and `seededScores` for any catalog game missing from the table. Empty: "SIN PUNTUACIONES TODAVÍA" + "JUGAR AHORA"; error: "NO SE PUDO CARGAR EL SALÓN" in every tab. `/juegos/[id]` reads `getGameScores(id)` (`lib/leaderboard.ts`, wrapped in React `cache()`): top 10, best score and total saved scores ("Puntuaciones"; there is no play counter). Stats and list each sit in their own `<Suspense>`, so the rest of the detail stays in the static shell. `Game` no longer has `best`/`plays`.
- Write: `saveScore()` in `lib/save-score.ts` (browser) validates, inserts with the browser client and counts rows ahead to return the rank. `GameOverModal` saves for real only when it gets `gameId` (passed by `EmbeddedGamePlayer`); without it, saving stays visual-only. One save per match; states "GUARDANDO…", success with "PUESTO #N" + "VER SALÓN", error "REINTENTAR".
