# Forge Overrides

This directory is reserved for local overrides of upstream crates when necessary (e.g., patching bugs or adding temporary fixes that cannot be upstreamed immediately).

## Usage

- Only use this for critical patches that block development.
- Each override should have a corresponding `Cargo.toml` and mirror the upstream crate structure.
- Document the reason for the override and the upstream issue/PR in a comment or separate note.
- Aim to minimize usage; prefer `forge-extensions` for new features.

Currently empty. No overrides needed for scaffold.