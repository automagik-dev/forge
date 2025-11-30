#!/bin/bash
# dev-core-helper.sh - Centralized dev-core workflow management
#
# Usage:
#   ./scripts/dev-core-helper.sh setup [branch]   - Enable local forge-core development
#   ./scripts/dev-core-helper.sh teardown         - Restore git dependencies
#   ./scripts/dev-core-helper.sh check            - Health check / diagnostics
#   ./scripts/dev-core-helper.sh versions         - Check version consistency
#
# Exit codes:
#   0 - Success
#   1 - Error (with message)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Symbols
CHECKMARK="✓"
CROSS="✗"
WARNING="⚠️"
INFO="ℹ️"

# Config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FORGE_CORE_REPO="https://github.com/namastexlabs/forge-core.git"
CARGO_FILES=(
    "Cargo.toml"
    "forge-app/Cargo.toml"
    "forge-extensions/config/Cargo.toml"
)

cd "$REPO_ROOT"

# =============================================================================
# Utility Functions
# =============================================================================

log_info() { echo -e "${CYAN}${INFO} $1${NC}"; }
log_success() { echo -e "${GREEN}${CHECKMARK} $1${NC}"; }
log_warning() { echo -e "${YELLOW}${WARNING} $1${NC}"; }
log_error() { echo -e "${RED}${CROSS} $1${NC}"; }
log_header() { echo -e "\n${PURPLE}=== $1 ===${NC}"; }

is_dev_core_active() {
    [ -f ".dev-core-active" ]
}

get_expected_tag() {
    grep -oP 'tag\s*=\s*"\K[^"]+' forge-app/Cargo.toml 2>/dev/null | head -1 || echo ""
}

get_local_tag() {
    if [ -d "forge-core" ]; then
        (cd forge-core && git describe --tags --abbrev=0 2>/dev/null) || echo "unknown"
    else
        echo "not-cloned"
    fi
}

# Rollback function for transactional operations
rollback_swap() {
    log_warning "Rolling back file changes..."
    for f in "${CARGO_FILES[@]}"; do
        if [ -f "${f%.toml}.git.toml" ]; then
            mv "${f%.toml}.git.toml" "$f" 2>/dev/null || true
        fi
    done
    rm -f .dev-core-active
    log_info "Rollback complete"
}

# =============================================================================
# setup - Enable local forge-core development (transactional)
# =============================================================================

cmd_setup() {
    local BRANCH="${1:-dev}"

    log_header "Dev-Core Setup (branch: $BRANCH)"

    # Pre-flight checks
    log_header "Pre-flight Checks"

    # Check all .dev-core.toml files exist
    log_info "Checking all dev-core templates present..."
    for f in "${CARGO_FILES[@]}"; do
        if [ ! -f "${f%.toml}.dev-core.toml" ]; then
            log_error "Missing ${f%.toml}.dev-core.toml"
            echo "    Create this file with path dependencies to forge-core"
            exit 1
        fi
    done
    log_success "All dev-core templates present"

    # Clone or update forge-core
    log_header "Forge-Core Repository"

    if [ ! -d "forge-core" ]; then
        log_info "Cloning forge-core (branch: $BRANCH)..."
        if ! git clone -b "$BRANCH" "$FORGE_CORE_REPO" forge-core 2>&1; then
            log_error "Failed to clone forge-core"
            echo ""
            echo "Possible causes:"
            echo "  - Network connectivity issues"
            echo "  - Branch '$BRANCH' doesn't exist"
            echo "  - Repository access denied"
            echo ""
            echo "Available branches:"
            git ls-remote --heads "$FORGE_CORE_REPO" 2>/dev/null | sed 's/.*refs\/heads\//  /' | head -10
            exit 1
        fi
        log_success "forge-core cloned"
    else
        log_info "forge-core exists, fetching latest..."
        (cd forge-core && git fetch --tags origin 2>/dev/null) || true

        local CURRENT
        CURRENT=$(cd forge-core && git branch --show-current 2>/dev/null || echo "detached")

        if [ "$CURRENT" != "$BRANCH" ]; then
            log_info "Switching from $CURRENT to $BRANCH..."
            if ! (cd forge-core && git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH" 2>/dev/null); then
                log_error "Could not checkout branch '$BRANCH'"
                echo ""
                echo "Available branches:"
                (cd forge-core && git branch -r | head -10)
                exit 1
            fi
        fi
        log_success "forge-core on branch $BRANCH"
    fi

    # Show current state
    echo -e "    Commit: $(cd forge-core && git log -1 --format='%h %s')"

    # Transactional file swap
    log_header "Cargo.toml Swap (Transactional)"

    # Set trap for rollback on error
    trap rollback_swap ERR

    # Backup original files (only if not already backed up)
    for f in "${CARGO_FILES[@]}"; do
        if [ ! -f "${f%.toml}.git.toml" ]; then
            cp "$f" "${f%.toml}.git.toml"
            log_info "Backed up $f"
        fi
    done

    # Swap to dev-core versions
    for f in "${CARGO_FILES[@]}"; do
        cp "${f%.toml}.dev-core.toml" "$f"
    done
    log_success "Swapped to path dependencies"

    # Regenerate Cargo.lock
    log_info "Regenerating Cargo.lock..."
    rm -f Cargo.lock
    cargo fetch 2>/dev/null || true

    # Create marker file
    echo "$(date -Iseconds)" > .dev-core-active
    echo "branch=$BRANCH" >> .dev-core-active

    # Install hooks
    log_header "Safety Hooks"
    mkdir -p .git/hooks
    if [ -f scripts/hooks/pre-push ]; then
        cp scripts/hooks/pre-push .git/hooks/pre-push
        chmod +x .git/hooks/pre-push
        log_success "Pre-push hook installed"
    else
        log_warning "Pre-push hook not found at scripts/hooks/pre-push"
    fi

    # Version mismatch check
    log_header "Version Check"
    local LOCAL_TAG EXPECTED_TAG
    LOCAL_TAG=$(get_local_tag)
    EXPECTED_TAG=$(get_expected_tag)

    if [ -n "$EXPECTED_TAG" ] && [ "$LOCAL_TAG" != "$EXPECTED_TAG" ]; then
        log_warning "Version mismatch detected!"
        echo "    Local forge-core: $LOCAL_TAG"
        echo "    Expected (git dep): $EXPECTED_TAG"
        echo ""
        echo "    To sync: cd forge-core && git checkout $EXPECTED_TAG"
    else
        log_success "Version aligned: $LOCAL_TAG"
    fi

    # Clear trap
    trap - ERR

    # Summary
    log_header "Setup Complete"
    log_success "Dev-core mode enabled"
    echo ""
    echo -e "${YELLOW}${INFO} Hot reload will pick up changes from ./forge-core${NC}"
    echo -e "${YELLOW}${INFO} Run 'make dev-core-off' to switch back to git dependencies${NC}"
    echo -e "${YELLOW}${INFO} Pre-push hook will BLOCK pushes until dev-core is disabled${NC}"
}

# =============================================================================
# teardown - Restore git dependencies
# =============================================================================

cmd_teardown() {
    log_header "Dev-Core Teardown"

    if ! is_dev_core_active; then
        log_info "Dev-core mode is not active"
        return 0
    fi

    # Restore backups
    log_info "Restoring git dependencies..."
    local RESTORED=0
    for f in "${CARGO_FILES[@]}"; do
        if [ -f "${f%.toml}.git.toml" ]; then
            mv "${f%.toml}.git.toml" "$f"
            ((RESTORED++))
        fi
    done

    if [ $RESTORED -eq 0 ]; then
        log_warning "No backup files found - workspace may be in inconsistent state"
    else
        log_success "Restored $RESTORED Cargo.toml files"
    fi

    # Remove marker
    rm -f .dev-core-active

    # Regenerate Cargo.lock
    log_info "Regenerating Cargo.lock..."
    rm -f Cargo.lock
    cargo fetch 2>/dev/null || cargo generate-lockfile 2>/dev/null || true

    log_success "Dev-core mode disabled"
}

# =============================================================================
# check - Health check / diagnostics
# =============================================================================

cmd_check() {
    log_header "Dev-Core Health Check"

    local ISSUES=0

    # Mode status
    log_header "Mode Status"
    if is_dev_core_active; then
        local TIMESTAMP BRANCH
        TIMESTAMP=$(head -1 .dev-core-active 2>/dev/null || echo "unknown")
        BRANCH=$(grep "branch=" .dev-core-active 2>/dev/null | cut -d= -f2 || echo "unknown")
        log_success "Dev-core mode: ACTIVE"
        echo "    Since: $TIMESTAMP"
        echo "    Branch: $BRANCH"
    else
        log_info "Dev-core mode: OFF (using git dependencies)"
    fi

    # Forge-core status
    log_header "Forge-Core Status"
    if [ -d "forge-core" ]; then
        if [ -d "forge-core/.git" ]; then
            log_success "forge-core cloned and valid"
            local FC_BRANCH FC_COMMIT
            FC_BRANCH=$(cd forge-core && git branch --show-current 2>/dev/null || echo "detached")
            FC_COMMIT=$(cd forge-core && git log -1 --format='%h %s' 2>/dev/null || echo "unknown")
            echo "    Branch: $FC_BRANCH"
            echo "    Commit: $FC_COMMIT"
        else
            log_error "forge-core exists but is not a valid git repo"
            ((ISSUES++))
        fi
    else
        log_info "forge-core not cloned (normal for git-dependency mode)"
    fi

    # Cargo.toml files
    log_header "Cargo.toml Files"
    for f in "${CARGO_FILES[@]}"; do
        local STATUS=""
        local HAS_PATH_DEP=false
        local HAS_BACKUP=false

        if grep -q 'path.*=.*".*forge-core' "$f" 2>/dev/null; then
            HAS_PATH_DEP=true
        fi
        [ -f "${f%.toml}.git.toml" ] && HAS_BACKUP=true

        if is_dev_core_active; then
            if $HAS_PATH_DEP && $HAS_BACKUP; then
                log_success "$f (dev-core active, backup exists)"
            elif ! $HAS_PATH_DEP; then
                log_error "$f (expected path deps but found git deps)"
                ((ISSUES++))
            elif ! $HAS_BACKUP; then
                log_warning "$f (dev-core active but no backup!)"
                ((ISSUES++))
            fi
        else
            if $HAS_PATH_DEP; then
                log_error "$f (has path deps but dev-core is OFF)"
                ((ISSUES++))
            else
                log_success "$f (using git dependencies)"
            fi
        fi
    done

    # Git hooks
    log_header "Git Hooks"
    if [ -f ".git/hooks/pre-push" ] && [ -x ".git/hooks/pre-push" ]; then
        log_success "pre-push hook installed and executable"
    elif [ -f ".git/hooks/pre-push" ]; then
        log_warning "pre-push hook exists but not executable"
        ((ISSUES++))
    else
        if is_dev_core_active; then
            log_warning "pre-push hook not installed (recommended for dev-core)"
        else
            log_info "pre-push hook not installed (not required when dev-core off)"
        fi
    fi

    # Cargo.lock status
    log_header "Cargo.lock Status"
    if [ -f "Cargo.lock" ]; then
        local LOCK_AGE
        LOCK_AGE=$(find Cargo.lock -mmin +60 2>/dev/null && echo "stale" || echo "recent")
        if [ "$LOCK_AGE" = "stale" ]; then
            log_warning "Cargo.lock exists (over 1 hour old)"
        else
            log_success "Cargo.lock exists (recently updated)"
        fi
    else
        log_warning "Cargo.lock missing (will be generated on build)"
    fi

    # Summary
    log_header "Summary"
    if [ $ISSUES -eq 0 ]; then
        log_success "All checks passed - workspace is healthy"
        return 0
    else
        log_error "$ISSUES issue(s) found - see above for details"
        return 1
    fi
}

# =============================================================================
# versions - Check version consistency
# =============================================================================

cmd_versions() {
    log_header "Version Consistency Check"

    local ISSUES=0

    # forge-core git tag references
    log_header "Forge-Core Tag References"
    local APP_TAG CONFIG_TAG
    APP_TAG=$(grep -oP 'tag\s*=\s*"\K[^"]+' forge-app/Cargo.toml 2>/dev/null | head -1 || echo "")
    CONFIG_TAG=$(grep -oP 'tag\s*=\s*"\K[^"]+' forge-extensions/config/Cargo.toml 2>/dev/null | head -1 || echo "")

    echo "    forge-app/Cargo.toml: ${APP_TAG:-<none>}"
    echo "    forge-extensions/config/Cargo.toml: ${CONFIG_TAG:-<none>}"

    if [ -n "$APP_TAG" ] && [ -n "$CONFIG_TAG" ]; then
        if [ "$APP_TAG" = "$CONFIG_TAG" ]; then
            log_success "All files reference same tag: $APP_TAG"
        else
            log_error "Tag mismatch! forge-app ($APP_TAG) != forge-config ($CONFIG_TAG)"
            echo "    Fix: ./scripts/bump-forge-core.sh $APP_TAG"
            ((ISSUES++))
        fi
    fi

    # Verify tag exists on remote (skip in dev-core mode)
    if ! is_dev_core_active && [ -n "$APP_TAG" ]; then
        log_header "Remote Tag Verification"
        log_info "Checking if $APP_TAG exists on remote..."

        if git ls-remote --tags "$FORGE_CORE_REPO" 2>/dev/null | grep -q "refs/tags/$APP_TAG"; then
            log_success "Tag $APP_TAG exists on remote"
        else
            log_error "Tag $APP_TAG NOT found on remote!"
            echo ""
            echo "    Available recent tags:"
            git ls-remote --tags "$FORGE_CORE_REPO" 2>/dev/null | grep -oP 'refs/tags/\Kv[0-9]+\.[0-9]+\.[0-9]+[^\^]*' | sort -V | tail -5 | sed 's/^/      /'
            ((ISSUES++))
        fi
    fi

    # Local forge-core vs expected
    if [ -d "forge-core" ]; then
        log_header "Local vs Expected"
        local LOCAL_TAG
        LOCAL_TAG=$(get_local_tag)

        echo "    Local forge-core: $LOCAL_TAG"
        echo "    Expected (Cargo.toml): ${APP_TAG:-<unknown>}"

        if [ -n "$APP_TAG" ] && [ "$LOCAL_TAG" != "$APP_TAG" ]; then
            log_warning "Local forge-core doesn't match expected tag"
            echo "    Sync: cd forge-core && git checkout $APP_TAG"
        else
            log_success "Local matches expected"
        fi
    fi

    # Package versions (npm + Cargo)
    log_header "Package Versions"

    local ROOT_NPM FORGE_APP_CARGO FORGE_OMNI_CARGO FORGE_CONFIG_CARGO
    ROOT_NPM=$(node -e "console.log(require('./package.json').version)" 2>/dev/null || echo "")
    FORGE_APP_CARGO=$(grep -E '^version\s*=' forge-app/Cargo.toml | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo "")
    FORGE_OMNI_CARGO=$(grep -E '^version\s*=' forge-extensions/omni/Cargo.toml | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo "")
    FORGE_CONFIG_CARGO=$(grep -E '^version\s*=' forge-extensions/config/Cargo.toml | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo "")

    echo "    package.json: ${ROOT_NPM:-<unknown>}"
    echo "    forge-app/Cargo.toml: ${FORGE_APP_CARGO:-<unknown>}"
    echo "    forge-omni/Cargo.toml: ${FORGE_OMNI_CARGO:-<unknown>}"
    echo "    forge-config/Cargo.toml: ${FORGE_CONFIG_CARGO:-<unknown>}"

    # Check if all match
    if [ -n "$ROOT_NPM" ]; then
        local ALL_MATCH=true
        [ "$FORGE_APP_CARGO" != "$ROOT_NPM" ] && ALL_MATCH=false
        [ "$FORGE_OMNI_CARGO" != "$ROOT_NPM" ] && ALL_MATCH=false
        [ "$FORGE_CONFIG_CARGO" != "$ROOT_NPM" ] && ALL_MATCH=false

        if $ALL_MATCH; then
            log_success "All package versions unified: $ROOT_NPM"
        else
            log_warning "Package versions not unified"
            echo "    Run: node scripts/sync-versions.js $ROOT_NPM"
            ((ISSUES++))
        fi
    fi

    # Summary
    log_header "Summary"
    if [ $ISSUES -eq 0 ]; then
        log_success "All version checks passed"
        return 0
    else
        log_error "$ISSUES version issue(s) found"
        return 1
    fi
}

# =============================================================================
# Main
# =============================================================================

case "${1:-help}" in
    setup)
        cmd_setup "${2:-dev}"
        ;;
    teardown)
        cmd_teardown
        ;;
    check)
        cmd_check
        ;;
    versions)
        cmd_versions
        ;;
    help|--help|-h)
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  setup [branch]   Enable local forge-core development (default: dev)"
        echo "  teardown         Restore git dependencies"
        echo "  check            Health check / diagnostics"
        echo "  versions         Check version consistency"
        echo ""
        exit 0
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Run '$0 help' for usage"
        exit 1
        ;;
esac
