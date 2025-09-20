# Upstream: vibe-kanban

This directory is reserved for the upstream vibe-kanban repository. The submodule cannot be initialized inside the current sandbox, so run the following locally to complete setup:

```
git submodule add https://github.com/BloopAI/vibe-kanban.git upstream
git submodule update --init --recursive
```

Do not modify upstream sources directly; extend through `forge-extensions/` and `forge-app/` instead.
