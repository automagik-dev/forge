#!/bin/bash
# check-versions.sh - Validates version consistency across all files
#
# Usage: ./scripts/check-versions.sh [--ci]
#
# Exit codes:
#   0 - All versions consistent
#   1 - Version mismatch detected
#   2 - Missing forge-core tag (git tag doesn't exist)

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

get_cargo_package_version() {
    grep -E '^version\s*=' "$1" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo ""
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

# 2. Check Cargo.toml versions match npm
echo ""
echo "Cargo.toml versions:"
FORGE_APP_VERSION=$(get_cargo_package_version "$REPO_ROOT/forge-app/Cargo.toml")
FORGE_OMNI_VERSION=$(get_cargo_package_version "$REPO_ROOT/forge-extensions/omni/Cargo.toml")
FORGE_CONFIG_VERSION=$(get_cargo_package_version "$REPO_ROOT/forge-extensions/config/Cargo.toml")

echo "  forge-app:    ${FORGE_APP_VERSION:-<missing>}"
echo "  forge-omni:   ${FORGE_OMNI_VERSION:-<missing>}"
echo "  forge-config: ${FORGE_CONFIG_VERSION:-<missing>}"

if [ -n "$ROOT_VERSION" ]; then
    if [ "$FORGE_APP_VERSION" != "$ROOT_VERSION" ]; then
        echo -e "${YELLOW}WARNING: forge-app ($FORGE_APP_VERSION) != npm ($ROOT_VERSION)${NC}"
        ERRORS=$((ERRORS+1))
    fi
    if [ "$FORGE_OMNI_VERSION" != "$ROOT_VERSION" ]; then
        echo -e "${YELLOW}WARNING: forge-omni ($FORGE_OMNI_VERSION) != npm ($ROOT_VERSION)${NC}"
        ERRORS=$((ERRORS+1))
    fi
    if [ "$FORGE_CONFIG_VERSION" != "$ROOT_VERSION" ]; then
        echo -e "${YELLOW}WARNING: forge-config ($FORGE_CONFIG_VERSION) != npm ($ROOT_VERSION)${NC}"
        ERRORS=$((ERRORS+1))
    fi
fi

# 3. Check forge-core git tags are consistent
echo ""
echo "forge-core git tag references:"
FORGE_APP_TAGS=$(get_cargo_git_tags "$REPO_ROOT/forge-app/Cargo.toml")
FORGE_CONFIG_TAGS=$(get_cargo_git_tags "$REPO_ROOT/forge-extensions/config/Cargo.toml")

echo "  forge-app:    ${FORGE_APP_TAGS:-<none>}"
echo "  forge-config: ${FORGE_CONFIG_TAGS:-<none>}"

# Get unique tags
UNIQUE_TAGS=$(echo -e "$FORGE_APP_TAGS\n$FORGE_CONFIG_TAGS" | sort -u | grep -v '^$' || echo "")
TAG_COUNT=$(echo "$UNIQUE_TAGS" | grep -c . || echo "0")

if [ "$TAG_COUNT" -gt 1 ]; then
    echo -e "${RED}ERROR: Multiple different forge-core tags referenced!${NC}"
    echo "  Found: $UNIQUE_TAGS"
    $CI_MODE && echo "::error::Multiple forge-core tags: $UNIQUE_TAGS"
    ERRORS=$((ERRORS+1))
elif [ "$TAG_COUNT" -eq 1 ]; then
    echo -e "${GREEN}All files reference same tag: $UNIQUE_TAGS${NC}"
fi

# 4. Verify forge-core tag exists (skip in dev-core mode)
if [ ! -f "$REPO_ROOT/.dev-core-active" ] && [ -n "$UNIQUE_TAGS" ]; then
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
