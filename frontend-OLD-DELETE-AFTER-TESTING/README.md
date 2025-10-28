# Frontend

Automagik Forge's frontend built with Vite + React. Uses overlay architecture where `forge-overrides/frontend/src/` customizations are merged with `upstream/frontend/src/` base at build time. The resulting bundle is embedded by `forge-app` via rust-embed and served at `/`.

## Development

```bash
# From repository root
pnpm run dev              # Start both frontend + backend

# Or frontend only
cd frontend && pnpm run dev
```

## Build

```bash
cd frontend && pnpm run build
```

Build artifacts are emitted to `frontend/dist/` and embedded by `forge-app` via rust-embed.

## Lint / Type-check

```bash
cd frontend && pnpm run lint
```

This runs TypeScript in no-emit mode to ensure types stay in sync with backend contracts at `/api/*` and `/api/forge/*`.

## Architecture

- **Base:** `upstream/frontend/src/` (automagik-forge submodule)
- **Overlays:** `forge-overrides/frontend/src/` (Automagik Forge customizations)
- **Build:** Vite resolves imports from overlays first, falls back to upstream
- **Deployment:** `forge-app` embeds `frontend/dist/` and serves at `/`

See `frontend/vite.config.ts` for overlay resolver implementation.
