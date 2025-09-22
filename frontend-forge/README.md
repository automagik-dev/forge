# Automagik Forge Frontend

This package contains the forge-specific React application that now serves as the default UI at `/` when `forge-app` is running. It mirrors the former forked `frontend/` package and continues to rely on shared types under `../shared/`.

## Development

```
pnpm install
pnpm run dev
```

Forge routes call the new composition APIs exposed under `/api/forge/*`. During development the upstream UI can still be accessed from `forge-app` at `/legacy` provided a legacy build exists in `frontend/dist`.

## Production Builds

`forge-app` expects built assets in `frontend-forge/dist`. The local packaging flow (`pnpm run build:npx`) invokes `pnpm run build` here before bundling the binaries. Override the asset directory with `FORGE_FRONTEND_DIST` if you relocate the build output.
