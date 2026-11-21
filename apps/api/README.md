# API

The NestJS half of the template. It exposes the JSON API under `/api` and, in
every non-`api-only` mode, serves the React app on the same port.

See the top-level `README.md` for architecture, commands and deployment.

## Endpoints

### `GET /api/hello`

Returns the message rendered by the page:

```json
{ "message": "Hello, World!" }
```

### `GET /api/health`

Liveness check for hosts and uptime monitors:

```json
{ "status": "ok", "service": "api" }
```

## Run

From the repository root:

```sh
npm run dev     # ts-node src/main.ts --dev — API + Vite SSR + HMR on :3000
npm run build   # tsc -> dist
npm start       # node dist/main.js — serves the prebuilt web app
```

`--dev` mounts the Vite dev server as middleware instead of serving static files,
so a single process on `http://127.0.0.1:3000` answers both API calls and the UI.

Build the web half too before `npm start`; without it the server boots into
`api-only` mode. `WEB_DIST_DIR` points at a different build output (production
only).

## Configuration

Copy `.env.example` to `.env` in this folder. Every value has a default.

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind interface; use `0.0.0.0` when a platform proxies to the container |
| `PORT` | `3000` | API, assets and HMR port |
| `WEB_DIST_DIR` | `apps/web/dist` | React build folder served in production |

The shared request/response types live in `packages/shared` (`@app/shared`).
Change them there, not here.
