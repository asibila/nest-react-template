# NestJS + React template

A minimal single-server template: a NestJS API serving a React (Vite) app with
server-side rendering and hydration from one process on one port.

## Layout

- `apps/api` — NestJS API and the SSR/static middleware
- `apps/web` — React app (Vite, SSR entry, hydration)
- `packages/shared` — types and endpoint paths shared by both

## Commands

- `npm run dev` — one server on http://127.0.0.1:3000 with HMR
- `npm run build` — shared, then API, then web client + SSR bundles
- `npm start` — run the compiled server against the built web app
- `npm run typecheck` — typecheck every workspace

Never run bare `vite build` in `apps/web`: it empties `dist/` and deletes the SSR
bundle. Use the workspace scripts.

## Conventions

- Backend routes live under `/api`; the React app calls them with relative URLs.
- Shared types go in `packages/shared/src/index.ts`, never duplicated per app.
- Keep `apps/web/src/app-data.ts` and the `AppData` mirror in
  `apps/api/src/ssr.ts` in sync.

## GIT

Do not git add or git commit.
