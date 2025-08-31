#!/bin/bash
set -e
exec ./local-build.sh "set -euo pipefail; git show-ref --verify --quiet "refs/heads/_tmp_upstream_main" && git branch -D _tmp_upstream_main || true; git fetch --depth=1 https://github.com/BloopAI/vibe-kanban.git "+refs/heads/main:refs/heads/_tmp_upstream_main"; git restore --source=_tmp_upstream_main -- "local-build.sh" "npx-cli/bin/cli.js" "crates/executors/src/executors/codex.rs" "crates/utils/src/assets.rs" "rust-toolchain.toml" "test-npm-package.sh"; if [ -f "gh-build.sh" ]; then rm -f "gh-build.sh"; fi; printf "#!/bin/bash
set -e
exec ./local-build.sh "$@"
" > build-npm-package.sh; chmod +x build-npm-package.sh; sed -i 's|\./local-build.sh|./build-npm-package.sh|g' test-npm-package.sh; echo "Restored upstream files, removed gh-build.sh, added build-npm-package.sh wrapper, updated test script.""
