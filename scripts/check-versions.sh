#!/bin/bash
# check-versions.sh - Validates version consistency across all files
#
# Usage: ./scripts/check-versions.sh [--ci]
#
# Exit codes:
#   0 - All versions consistent
#   1 - Version mismatch detected
#   2 - Missing forge-core tag (git tag doesn't exist)
#
# Note: Member crates use `version.workspace = true` to inherit version
# from their workspace root. This script validates:
#   1. All package.json versions match
#   2. Workspace root Cargo.toml versions match npm version
#   3. Member crates use version.workspace = true (not hardcoded versions)
#   4. forge-core git tag references are consistent

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FORGE_CORE_REPO="https://github.com/namastexlabs/forge-core.git"

CI_MODE=false
[[ "${1:-}" == "--ci" ]] && CI_MODE=true

cd "$REPO_ROOT"

get_json_version() {
    node -e "console.log(require('$1').version)" 2>/dev/null || echo ""
}

# Get version from workspace root Cargo.toml [workspace.package] section
get_workspace_version() {
    local file="$1"
    # Check if file exists first
    if [ ! -f "$file" ]; then
        echo ""
        return 0
    fi
    # Look for version in [workspace.package] section using sed range
    sed -n '/^\[workspace\.package\]/,/^\[/p' "$file" 2>/dev/null | grep -E '^version\s*=' | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo ""
}

# Check if a Cargo.toml uses workspace inheritance for version
uses_workspace_version() {
    local file="$1"
    grep -qE 'version\.workspace\s*=\s*true' "$file" 2>/dev/null
}

get_cargo_git_tags() {
    grep -oP 'tag\s*=\s*"\K[^"]+' "$1" 2>/dev/null | sort -u || echo ""
}

echo -e "${GREEN}=== Version Consistency Check ===${NC}"
ERRORS=0

# 1. Check package.json versions match
echo ""
echo "Package.json versions:"
ROOT_VERSION=$(get_json_version "$REPO_ROOT/package.json")
NPX_VERSION=$(get_json_version "$REPO_ROOT/npx-cli/package.json")
FRONTEND_VERSION=$(get_json_version "$REPO_ROOT/frontend/package.json")

echo "  Root:     ${ROOT_VERSION:-<missing>}"
echo "  NPX CLI:  ${NPX_VERSION:-<missing>}"
echo "  Frontend: ${FRONTEND_VERSION:-<missing>}"

if [ -n "$ROOT_VERSION" ]; then
    if [ "$ROOT_VERSION" != "$NPX_VERSION" ]; then
        echo -e "${RED}ERROR: Root ($ROOT_VERSION) != npx-cli ($NPX_VERSION)${NC}"
        $CI_MODE && echo "::error::Version mismatch: root vs npx-cli"
        ERRORS=$((ERRORS+1))
    fi
    if [ "$ROOT_VERSION" != "$FRONTEND_VERSION" ]; then
        echo -e "${RED}ERROR: Root ($ROOT_VERSION) != frontend ($FRONTEND_VERSION)${NC}"
        $CI_MODE && echo "::error::Version mismatch: root vs frontend"
        ERRORS=$((ERRORS+1))
    fi
fi

# 2. Check Cargo workspace root versions match npm
echo ""
echo "Cargo workspace root versions:"
WORKSPACE_VERSION=$(get_workspace_version "$REPO_ROOT/Cargo.toml")
FORGE_CORE_VERSION=$(get_workspace_version "$REPO_ROOT/forge-core/Cargo.toml")

echo "  automagik-forge workspace: ${WORKSPACE_VERSION:-<missing>}"
echo "  forge-core workspace:      ${FORGE_CORE_VERSION:-<missing>}"

if [ -n "$ROOT_VERSION" ]; then
    if [ "$WORKSPACE_VERSION" != "$ROOT_VERSION" ]; then
        echo -e "${YELLOW}WARNING: Cargo workspace ($WORKSPACE_VERSION) != npm ($ROOT_VERSION)${NC}"
        ERRORS=$((ERRORS+1))
    fi
    # Only check forge-core if it exists (dev-core mode)
    if [ -f "$REPO_ROOT/forge-core/Cargo.toml" ] && [ -n "$FORGE_CORE_VERSION" ]; then
        if [ "$FORGE_CORE_VERSION" != "$ROOT_VERSION" ]; then
            echo -e "${YELLOW}WARNING: forge-core workspace ($FORGE_CORE_VERSION) != npm ($ROOT_VERSION)${NC}"
            ERRORS=$((ERRORS+1))
        fi
    fi
fi

# 2b. Verify member crates use version.workspace = true (not hardcoded)
echo ""
echo "Checking member crates use version inheritance:"
MEMBER_CRATES=(
    "forge-app/Cargo.toml"
    "forge-extensions/omni/Cargo.toml"
    "forge-extensions/config/Cargo.toml"
)

for crate in "${MEMBER_CRATES[@]}"; do
    crate_path="$REPO_ROOT/$crate"
    if [ -f "$crate_path" ]; then
        if uses_workspace_version "$crate_path"; then
            echo -e "  ${GREEN}✓${NC} $crate uses version.workspace = true"
        else
            echo -e "${RED}ERROR: $crate has hardcoded version (should use version.workspace = true)${NC}"
            $CI_MODE && echo "::error::$crate should use version.workspace = true"
            ERRORS=$((ERRORS+1))
        fi
    fi
done

# Check forge-core member crates if forge-core exists
if [ -d "$REPO_ROOT/forge-core/crates" ]; then
    FORGE_CORE_CRATES=(
        "forge-core/crates/server/Cargo.toml"
        "forge-core/crates/db/Cargo.toml"
        "forge-core/crates/executors/Cargo.toml"
        "forge-core/crates/services/Cargo.toml"
        "forge-core/crates/utils/Cargo.toml"
        "forge-core/crates/local-deployment/Cargo.toml"
        "forge-core/crates/deployment/Cargo.toml"
    )
    for crate in "${FORGE_CORE_CRATES[@]}"; do
        crate_path="$REPO_ROOT/$crate"
        if [ -f "$crate_path" ]; then
            if uses_workspace_version "$crate_path"; then
                echo -e "  ${GREEN}✓${NC} $crate uses version.workspace = true"
            else
                echo -e "${RED}ERROR: $crate has hardcoded version (should use version.workspace = true)${NC}"
                $CI_MODE && echo "::error::$crate should use version.workspace = true"
                ERRORS=$((ERRORS+1))
            fi
        fi
    done
fi

# 3. Check forge-core git tags are consistent
echo ""
echo "forge-core git tag references:"
FORGE_APP_TAGS=$(get_cargo_git_tags "$REPO_ROOT/forge-app/Cargo.toml")
FORGE_CONFIG_TAGS=$(get_cargo_git_tags "$REPO_ROOT/forge-extensions/config/Cargo.toml")

echo "  forge-app:    ${FORGE_APP_TAGS:-<none>}"
echo "  forge-config: ${FORGE_CONFIG_TAGS:-<none>}"

# Get unique tags
UNIQUE_TAGS=$(echo -e "$FORGE_APP_TAGS\n$FORGE_CONFIG_TAGS" | sort -u | grep -v '^$' || true)
if [ -z "$UNIQUE_TAGS" ]; then
    TAG_COUNT=0
else
    TAG_COUNT=$(echo "$UNIQUE_TAGS" | wc -l | tr -d ' ')
fi

if [ "$TAG_COUNT" -gt 1 ]; then
    echo -e "${RED}ERROR: Multiple different forge-core tags referenced!${NC}"
    echo "  Found: $UNIQUE_TAGS"
    $CI_MODE && echo "::error::Multiple forge-core tags: $UNIQUE_TAGS"
    ERRORS=$((ERRORS+1))
elif [ "$TAG_COUNT" -eq 1 ]; then
    echo -e "${GREEN}All files reference same tag: $UNIQUE_TAGS${NC}"
fi

# 4. Verify forge-core tag exists (skip in dev-core mode)
# Dev-core mode is detected by checking for uncommented [patch. section in .cargo/config.toml
DEV_CORE_ACTIVE=false
if grep -q '^\[patch\.' "$REPO_ROOT/.cargo/config.toml" 2>/dev/null; then
    DEV_CORE_ACTIVE=true
fi
if [ "$DEV_CORE_ACTIVE" = "false" ] && [ -n "$UNIQUE_TAGS" ]; then
    FORGE_CORE_TAG=$(echo "$UNIQUE_TAGS" | head -1)
    echo ""
    echo "Verifying forge-core tag $FORGE_CORE_TAG exists..."

    if git ls-remote --tags "$FORGE_CORE_REPO" 2>/dev/null | grep -q "refs/tags/$FORGE_CORE_TAG"; then
        echo -e "${GREEN}  Tag exists on remote${NC}"
    else
        echo -e "${RED}ERROR: Tag $FORGE_CORE_TAG NOT found on remote!${NC}"
        $CI_MODE && echo "::error::forge-core tag $FORGE_CORE_TAG does not exist"
        echo ""
        echo "Available recent tags:"
        git ls-remote --tags "$FORGE_CORE_REPO" 2>/dev/null | grep -oP 'refs/tags/\Kv[0-9]+\.[0-9]+\.[0-9]+[^\^]*' | sort -V | tail -5 | sed 's/^/  /'
        ERRORS=$((ERRORS+1))
    fi
fi

# Summary
echo ""
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Version check FAILED ($ERRORS errors)${NC}"
    $CI_MODE && echo "::error::Version mismatch detected ($ERRORS issues)"
    exit 1
fi

echo -e "${GREEN}Version check PASSED${NC}"
exit 0
