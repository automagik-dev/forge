# Frontend Forge

Forge's standalone frontend powered by Vite + React. The bundle produced here is embedded by `forge-app` and served at `/`, while the upstream UI remains available at `/legacy`.

## Getting Started

```bash
pnpm install
pnpm --filter frontend-forge dev
```

## Build

```bash
pnpm --filter frontend-forge build
```

Build artifacts are emitted to `frontend-forge/dist` and embedded by the Rust application via `rust-embed`.

## Lint / Type-check

```bash
pnpm --filter frontend-forge lint
```

This runs TypeScript in no-emit mode to ensure the forge UI stays in sync with the backend contracts exposed at `/api/forge/*`.

## Next Steps

- Port forge-specific surfaces from the forked frontend.
- Replace the temporary status panel with real Omni/branch template management views.
- Add Vitest coverage for forge UI components once extracted.
