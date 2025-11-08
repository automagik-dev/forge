# Naming Conventions

Consistent naming conventions for Automagik Forge. Customize these patterns for your domain.

## Project Names

### Repository
- **Pattern**: namastexlabs/automagik-forge
- **Organization**: namastexlabs

### Product
- **Marketing Name**: Automagik Forge
- **Documentation**: Automagik Forge (consistent casing)
- **Short Name**: Forge

### Binary/Package
- **Pattern**: kebab-case
- **NPM Package**: automagik-forge
- **Binary**: automagik-forge
- **Rust Crates**: server, db, executors, services, utils, deployment, local-deployment
- **Forge Extensions**: forge-app, forge-extensions/*

## Environment Variables

### Prefix
- **Application**: `FORGE_` (optional, most vars unprefixed)
- **Providers**: Keep provider names as-is (e.g., `GITHUB_`, `POSTHOG_`)

### Format
- **Style**: UPPER_SNAKE_CASE
- **Examples**:
  - `BACKEND_PORT`
  - `FRONTEND_PORT`
  - `HOST`
  - `GITHUB_CLIENT_ID`
  - `POSTHOG_API_KEY`
  - `DISABLE_WORKTREE_ORPHAN_CLEANUP`

## File & Directory Names

### Directories
- **Style**: kebab-case
- **Examples**:
  - `.genie/`
  - `docs/`
  - `tests/`

### Markdown Files
- **Style**: kebab-case.md
- **Examples**:
  - `getting-started.md`
  - `environment-config.md`

### Source Files
Follow language conventions:
- **Rust**: snake_case.rs
- **TypeScript**: camelCase.ts or kebab-case.ts
- **Python**: snake_case.py

## Agent Names
- **Pattern**: template-{role}
- **Examples**:
  - `template-implementor`
  - `template-qa`
  - `template-tests`

## Wish & Report Names
- **Wishes**: `<feature-slug>-wish.md`
- **Reports**: `<agent>-<slug>-<YYYYMMDDHHmm>.md`

## Git Conventions
- **Branches**: `feat/<wish-slug>`, `fix/<issue>`, `chore/<task>`
- **Tags**: `v<major>.<minor>.<patch>`

## Timestamps
- **UTC format for reports**: `YYYYMMDDHHmm` (e.g., `20250314T1530Z` → store as `202503141530`)
- **Date format for summaries**: `YYYY-MM-DD`
- **Command examples**:
  - Current UTC timestamp: ``date -u +%Y%m%d%H%M``
  - Current date: ``date -u +%F``
  - Do not infer dates from filenames or branch names

Adapt these conventions to match your organization's standards.
