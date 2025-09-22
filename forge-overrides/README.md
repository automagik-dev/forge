# Forge Overrides

This directory stays empty by default. Add a crate or module here only when we need to shadow upstream behavior wholesale (e.g., a patched service implementation that cannot be composed through `forge-extensions`).

Guidelines:
- Prefer `forge-extensions/*` for additive features.
- Treat overrides as last resort and document the upstream issue we are working around.
- Keep each override isolated (e.g., `forge-overrides/server` for a full crate replacement).
