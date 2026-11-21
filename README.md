# NestJS + React template

A minimal single-server starter: a NestJS API that serves a React app built with
Vite. The page is rendered on the server and hydrated in the browser, and it
shows the response of `GET /api/hello`. One process, one port, no proxy, no CORS.

## Layout

```
.
├── apps/
│   ├── api/                 # NestJS API + SSR middleware   — @app/api
│   └── web/                 # React + Vite app              — @app/web
├── packages/
│   └── shared/              # Types shared by both          — @app/shared
└── package.json             # Workspaces root
```

npm workspaces with a single root `node_modules` and a single `package-lock.json`.
Vite would normally create its own `node_modules` for the dependency cache, so
`cacheDir` is pinned to `<root>/node_modules/.vite/web` in
`apps/web/vite.config.ts`. Pin any similar tool the same way rather than
accepting a second install tree.

## Quick start

```sh
npm install          # installs all workspaces and builds @app/shared
npm run dev          # http://127.0.0.1:3000
```

`npm run dev` runs one process: Nest boots in development mode, mounts Vite as
middleware, and serves the API, the SSR-rendered HTML and HMR from the same
port. There is no second dev port.

### Hot reload

| You edit | What happens |
|---|---|
| `apps/web/**` | Vite HMR updates the page in place; React state survives |
| `apps/api/src/**` | Node's watcher restarts the whole process (Nest and Vite) |
| `packages/shared/src/**` | Run `npm run build -w @app/shared`; the new `dist` file is watched, so the API restarts |
| `apps/api/.env` | Restart manually (it is read at boot) |

The watcher is `nodemon`, configured in `apps/api/nodemon.json` and scoped to
`apps/api/src` only. Scoping matters: Vite runs inside the same process and keeps
touching files in `node_modules`, so watching the whole module graph would
restart the server every few seconds even when nothing changed. `nodemon` gives
us an include list, and it behaves the same on Windows, macOS and Linux.

```json
"start:dev": "nodemon"
```

Each restart recompiles TypeScript through `ts-node`, so type errors also stop the
server until fixed. Add `.env` to `watch` in `nodemon.json` if you want config
changes to restart automatically.

### Starting a new project from this template

Copy the source only — never `node_modules` and never `dist`. The workspace
packages (`@app/api`, `@app/web`, `@app/shared`) are linked into
`node_modules` as junctions/symlinks, and those links break when the folder is
copied, which shows up as `Cannot find module '@app/shared'` during the build.

```sh
npm ci          # reinstalls from the lockfile and recreates the workspace links
npm run dev
```

`npm ci` is quick on a machine that has installed this template before: npm
reuses its package cache instead of downloading again.

## How the two halves meet

One server, one port, in both modes. The API is the host; React is mounted into it.

| | Development (`npm run dev`) | Production (`npm start`) |
|---|---|---|
| Process | one (`ts-node src/main.ts --dev`) | one (`node dist/main.js`) |
| React | Vite middleware mode, compiled on demand | `vite build` output in `apps/web/dist` |
| HTML | rendered per request via `entry-server.tsx` | rendered per request via the SSR bundle |
| Hydration | client attaches to the server markup | same |
| HMR | yes, websocket on the same port | n/a |
| URL | `http://127.0.0.1:3000` | `http://127.0.0.1:3000` |

`apps/api/src/main.ts` registers a middleware that hands `/api/**` to the Nest
router and everything else to the React renderer. In development Vite serves the
assets and compiles the modules; in production `express.static` serves
`apps/web/dist`. Because both halves live on one origin there is no proxy and no
CORS handling between them.

The `/api` prefix is the only boundary. Any backend route is reachable from the
UI with a plain relative `fetch('/api/...')`.

### Server-side rendering

Every HTML response is rendered on the server and the browser hydrates it. Three
files carry this:

| File | Role |
|---|---|
| `apps/web/src/entry-server.tsx` | `render(data): string` — `renderToString` |
| `apps/web/src/main.tsx` | hydrates when markup exists, mounts when it does not |
| `apps/api/src/ssr.ts` | resolves data, injects markup + payload into the template |

`index.html` holds an `<!--app-html-->` marker inside `#root`. The middleware
replaces it with the rendered markup and appends `window.__APP_DATA__ = {...}`
before `</body>`, so the first paint already has the data and hydration starts
from an identical state.

Data loading is a self-request to the API (`/api/hello`), which keeps the
boundary honest: the server calls the same endpoint the browser would. Extend
`AppData` in `apps/web/src/app-data.ts` and the mirror in `apps/api/src/ssr.ts`
together when a page needs more.

### Serving modes

The API picks one mode at boot and never re-checks the disk afterwards. In
`apps/api/src/main.ts`, `bootstrap()` calls `inspectWebBuild` (`ssr.ts`) once and
switches on the result: a three-way `switch` for production, plus the `--dev`
branch chosen from `process.argv`.

| Mode | Chosen when | HTML | Log line |
|---|---|---|---|
| `dev` | `npm run dev` (passes `--dev`) | `entry-server.tsx` compiled per request, HMR live | `Vite + SSR attached; HMR shares port 3000` |
| `ssr` | `dist/index.html` **and** `dist/server/entry-server.js` exist | rendered per request from the prebuilt bundle | `Server-rendering with ...\entry-server.js` |
| `client` | `dist/index.html` exists, no SSR bundle | static shell; React renders in the browser | `Serving the web build from ... (client-only)` |
| `api-only` | no `dist/index.html` | none — every non-`/api` URL returns 404 | `No web build at ...; running API only.` |

`client` and `api-only` are deliberate fallbacks, not failures: `npm start` boots
even when a build step was skipped. What you lose is the server-rendered first
paint.

#### Why the SSR bundle can be missing

`apps/web/vite.config.ts` sets `emptyOutDir: true`, so a plain `vite build` —
including `npx vite build` inside `apps/web` — empties the *whole* `dist/`,
deleting the `dist/server/` folder the SSR step wrote. **Never run bare
`vite build`;** use `npm run build` (root) or `npm run build -w @app/web`, which
runs `tsc`, the client build and the SSR build in that order.

#### Production build and run

```sh
npm install          # once — also builds @app/shared via prepare
npm run build        # shared -> api -> web client bundle -> web SSR bundle
npm start            # node apps/api/dist/main.js, no --dev
```

Confirm both web artifacts exist before starting:

```sh
ls apps/web/dist/index.html
ls apps/web/dist/server/entry-server.js
```

Then open `http://127.0.0.1:3000` and view source: a served page contains
`window.__APP_DATA__`. That script is only injected by the SSR middleware, so its
presence proves you are in `ssr` mode.

## Adding an endpoint

1. Add the request/response types and the path to
   `packages/shared/src/index.ts`.
2. Add a controller in `apps/api/src` and register it in `app.module.ts`.
3. Call it from the web app with `fetch('/api/...')` (see
   `apps/web/src/api.ts`).
4. If the first paint needs the data, extend `AppData` in
   `apps/web/src/app-data.ts` and `loadAppData` in `apps/api/src/ssr.ts`.

Change the contract in `packages/shared`, not in either app. The API imports the
compiled package (`@app/shared` → `dist`); the web app resolves the TypeScript
source directly, so edits there are picked up without rebuilding the package.

## Commands

Run everything from the repository root.

```sh
npm install          # installs all workspaces and builds @app/shared
npm run dev          # one server on :3000 — watch API, HMR for React
npm run build        # shared -> API -> client bundle -> SSR bundle, in that order
npm start            # same server, serving the prebuilt React app
npm run typecheck    # typecheck every workspace
```

`npm start` runs `node apps/api/dist/main.js` and **does not build anything**.
Run `npm run build` first, or the server boots into `client`/`api-only` mode.

Individual packages:

```sh
npm run start:dev -w @app/api   # same as npm run dev, one level down
npm run build     -w @app/shared
npm run build     -w @app/web   # client + SSR bundle; never bare `vite build`
```

## Configuration

The API reads `.env` from `apps/api/.env`. Copy `apps/api/.env.example`; every
value has a default, so an empty file works locally.

| Variable | Default | Effect |
|---|---|---|
| `HOST` | `127.0.0.1` | Interface to bind. Set `0.0.0.0` on any platform that proxies traffic to the container |
| `PORT` | `3000` | Port for API, assets and HMR together; platforms inject this |
| `WEB_DIST_DIR` | `apps/web/dist` | Overrides the React build folder for **both** SSR and client-only serving. Keep it inside the repository: the SSR bundle resolves `react` from the nearest `node_modules` |

The web app needs no configuration: it always calls `/api` on its own origin.

## Deploying

Any host that runs Node works the same way: build once, then run the compiled
entry point. Nothing is built at startup.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Environment | `HOST=0.0.0.0`; do **not** set `PORT` if the platform assigns it |

One thing that bites on a fresh host: the build needs devDependencies
(`typescript`, `vite`). If the build fails with `tsc: not found`,
`NODE_ENV=production` made npm skip them — use
`npm install --include=dev && npm run build` instead.

## Node version

Node 20.19+ (or 22.12+). The `engines` field in the root `package.json` records
this; Vite 8 and React 19 both require it.

## Git note

The root is not a git repository. Run `git init` here to start tracking the
template as a single repository.
