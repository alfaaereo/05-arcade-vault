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

##Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Design reference (`resources/`)

`resources/templates/` holds the design prototype for the app. It is a standalone React 18 + Babel-in-browser HTML mock (`Arcade Vault.html`), not part of the Next build. Use it as the visual and functional spec when you implement screens:

- Screens: `biblioteca.jsx` (game library), `detalle.jsx` (game detail), `reproductor.jsx` (game player and score saving), `auth.jsx` (login), `salon.jsx` (hall of fame / leaderboard), `nav.jsx` (navigation).
- `data.jsx` holds the mock game catalog (`GAMES`: id, title, category, cover class, accent color, best score, play count).
- `app.jsx` does hash-based routing and stores the user and scores in `localStorage` (`av_user`, `av_scores`). These are prototype stand-ins, not the target architecture.
- `styles.css` defines the retro neon theme: CSS variables (`--bg`, `--cyan`, `--magenta`, `--yellow`, …), the "Press Start 2P" and "JetBrains Mono" fonts, and the `av-*` / `cover-*` classes. Port these tokens into the Tailwind theme instead of copying the raw CSS.

## App structure (SPEC 01, SPEC 02)

- Routes: `/` (landing), `/games` (library), `/about` (about + visual-only contact form), `/juegos/[id]` (detail), `/juegos/[id]/jugar` (player), `/login`, `/salon` (hall of fame), plus `app/not-found.tsx`. Game routes are pre-generated with `generateStaticParams`; unknown ids call `notFound()`.
- Mock data lives in `lib/games.ts` (`GAMES`, `CATEGORIES`, `getGame`, `seededScores`, `formatScore`). Fixed landing copy (features, stats, activity, pricing, FAQ) lives in `lib/home.ts`. Always format visible numbers with `formatScore` to avoid hydration mismatches.
- Shared components live in `components/`. `Nav` wraps `NavLinks` (`usePathname`) in `<Suspense>` because, with Cache Components, `usePathname` suspends on non-pre-generated params.
- Nav links come from `LINKS` in `components/nav-links.tsx` (shared with `MobileMenu`). "Back" links in the game flow point to `/games`; the logo and the 404 point to `/`.
- Scroll-in sections use the `.reveal` class plus `<RevealObserver />` mounted inside each page. Hidden state only applies once it adds `.reveal-ready` to `<html>`, so content stays visible without JS and with `prefers-reduced-motion`.
- Styling reuses the ported `av-*` classes from `app/globals.css`; one-off styles use Tailwind utilities with the theme tokens (`text-ink-faint`, `font-pixel`, …). `style` is only for dynamic values.
- Visual-only MVP: no session, no score persistence, no real games.
