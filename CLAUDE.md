# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online platform for playing retro-style games and competing for high scores. The UI and product copy are in Spanish.

Development follows Spec Driven Design using the `/spec` and `/spec-impl` skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) (install with `npx skills@latest add Klerith/fernando-skills`).

## Commands

```bash
npm run dev     # dev server (Turbopack) on http://localhost:3000
npm run build   # production build (also runs type checking)
npm run start   # serve the production build
npm run lint    # ESLint (flat config, eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit  # type-check only
```

There is no test framework set up yet.

## Stack and configuration

- **Next.js 16.4 (App Router) + React 19.3 + TypeScript (strict).** This Next version differs from what you may know. Before writing Next-specific code, check the bundled docs in `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …).
- `next.config.ts` turns on `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback`. Cache Components changes the defaults for data fetching and rendering (dynamic by default, `"use cache"`, Suspense boundaries around dynamic data). Read the relevant docs before you add data fetching or caching.
- Tailwind CSS v4 runs through the `@tailwindcss/turbopack` loader set in `next.config.ts` (`turbopack.rules`), not PostCSS. Theme tokens live in `app/globals.css` via `@theme inline`.
- Typed route helpers such as `LayoutProps<"/">` are global types generated into `.next/types` by `next dev`/`next build`.
- The path alias `@/*` maps to the repo root.

## Design reference (`resources/`)

`resources/templates/` holds the design prototype for the app. It is a standalone React 18 + Babel-in-browser HTML mock (`Arcade Vault.html`), not part of the Next build. Use it as the visual and functional spec when you implement screens:

- Screens: `biblioteca.jsx` (game library), `detalle.jsx` (game detail), `reproductor.jsx` (game player and score saving), `auth.jsx` (login), `salon.jsx` (hall of fame / leaderboard), `nav.jsx` (navigation).
- `data.jsx` holds the mock game catalog (`GAMES`: id, title, category, cover class, accent color, best score, play count).
- `app.jsx` does hash-based routing and stores the user and scores in `localStorage` (`av_user`, `av_scores`). These are prototype stand-ins, not the target architecture.
- `styles.css` defines the retro neon theme: CSS variables (`--bg`, `--cyan`, `--magenta`, `--yellow`, …), the "Press Start 2P" and "JetBrains Mono" fonts, and the `av-*` / `cover-*` classes. Port these tokens into the Tailwind theme instead of copying the raw CSS.

The `app/` directory still holds the create-next-app starter (`page.tsx` and `layout.tsx` metadata) and has not been replaced yet.
