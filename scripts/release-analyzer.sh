#!/bin/bash

# Intelligent Release Notes Generator for automagik-forge
# Analyzes actual code changes instead of relying on commit messages

set -e

# Utility functions
log() { echo "[$(date +%H:%M:%S)] $*"; }
error() { echo "❌ $*" >&2; exit 1; }

# Get the last release tag
get_last_tag() {
    git describe --tags --abbrev=0 2>/dev/null || echo ""
}

# Get specific tag (for testing)
get_specific_tag() {
    local tag="${1:-$(get_last_tag)}"
    echo "$tag"
}

# Get current version from package.json
get_current_version() {
    grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/'
}

# Version comparison helper
version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Analyze file changes and categorize them
analyze_code_changes() {
    local last_tag="$1"
    local output_file="$2"

    if [ -z "$last_tag" ]; then
        log "No previous tags found, analyzing last 20 commits"
        last_tag="HEAD~20"
    fi

    log "Analyzing changes since $last_tag..."

    # Initialize categories
    local features=()
    local improvements=()
    local fixes=()
    local security=()
    local performance=()
    local developer=()
    local breaking=()

    # Get file changes with status
    local file_changes=$(git diff --name-status "$last_tag..HEAD" 2>/dev/null || echo "")

    if [ -z "$file_changes" ]; then
        error "No changes found since $last_tag"
    fi

    # Analyze each changed file
    while IFS=$'\t' read -r status file_path; do
        [ -z "$file_path" ] && continue

        log "Analyzing $status $file_path"

        case "$file_path" in
            # Rust backend changes
            "crates/"*.rs)
                analyze_rust_changes "$last_tag" "$file_path" "$status" features improvements fixes security performance
                ;;

            # Frontend changes
            "frontend/src/"*)
                analyze_frontend_changes "$last_tag" "$file_path" "$status" features improvements fixes
                ;;

            # Configuration and build system
            ".github/workflows/"*)
                improvements+=("Enhanced CI/CD pipeline ($file_path)")
                ;;

            "Cargo.toml"|"package.json"|"frontend/package.json")
                analyze_dependency_changes "$last_tag" "$file_path" "$status" improvements security
                ;;

            # Documentation
            "README.md"|"docs/"*|"*.md")
                developer+=("Updated documentation ($file_path)")
                ;;

            # Scripts and tooling
            "scripts/"*|"Makefile"|"*.sh")
                developer+=("Improved development tooling ($file_path)")
                ;;
        esac
    done <<< "$file_changes"

    # Generate structured output
    cat > "$output_file" <<EOF
{
    "features": [$(IFS=','; echo "${features[*]}")],
    "improvements": [$(IFS=','; echo "${improvements[*]}")],
    "fixes": [$(IFS=','; echo "${fixes[*]}")],
    "security": [$(IFS=','; echo "${security[*]}")],
    "performance": [$(IFS=','; echo "${performance[*]}")],
    "developer": [$(IFS=','; echo "${developer[*]}")],
    "breaking": [$(IFS=','; echo "${breaking[*]}")],
    "stats": {
        "files_changed": $(echo "$file_changes" | wc -l),
        "lines_added": $(git diff --shortstat "$last_tag..HEAD" 2>/dev/null | grep -o '[0-9]* insertion' | cut -d' ' -f1 || echo "0"),
        "lines_removed": $(git diff --shortstat "$last_tag..HEAD" 2>/dev/null | grep -o '[0-9]* deletion' | cut -d' ' -f1 || echo "0")
    }
}
EOF
}

# Analyze Rust code changes
analyze_rust_changes() {
    local last_tag="$1" file_path="$2" status="$3"
    local -n features_ref=$4 improvements_ref=$5 fixes_ref=$6 security_ref=$7 performance_ref=$8

    local diff_content=$(git diff "$last_tag..HEAD" -- "$file_path" 2>/dev/null || echo "")

    # Look for new functions/structs (features)
    if echo "$diff_content" | grep -q "^[+].*fn[[:space:]]\+[a-zA-Z_]"; then
        local new_functions=$(echo "$diff_content" | grep "^[+].*fn[[:space:]]\+[a-zA-Z_]" | head -3 | sed 's/^[+][[:space:]]*//' | sed 's/fn \([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/' | tr '\n' ',' | sed 's/,$//')
        if [ -n "$new_functions" ]; then
            features_ref+=("\"Added new functions: $new_functions ($file_path)\"")
        fi
    fi

    # Look for struct/enum additions
    if echo "$diff_content" | grep -q "^[+].*\(struct\|enum\)"; then
        features_ref+=("\"Added new data structures in $file_path\"")
    fi

    # Look for bug fixes (error handling, unwrap removals, etc.)
    if echo "$diff_content" | grep -q -E "^[+].*(fix|Fix|error|Error|unwrap|expect|Result|Option)"; then
        fixes_ref+=("\"Improved error handling in $file_path\"")
    fi

    # Look for performance improvements
    if echo "$diff_content" | grep -q -E "^[+].*(async|await|cache|Cache|optimize|Optimize|performance|Performance)"; then
        performance_ref+=("\"Performance improvements in $file_path\"")
    fi

    # Look for security improvements
    if echo "$diff_content" | grep -q -E "^[+].*(security|Security|auth|Auth|token|Token|encrypt|Encrypt)"; then
        security_ref+=("\"Security enhancements in $file_path\"")
    fi

    # General improvements for modified files
    if [ "$status" = "M" ]; then
        improvements_ref+=("\"Enhanced $file_path functionality\"")
    fi
}

# Analyze frontend changes
analyze_frontend_changes() {
    local last_tag="$1" file_path="$2" status="$3"
    local -n features_ref=$4 improvements_ref=$5 fixes_ref=$6

    local diff_content=$(git diff "$last_tag..HEAD" -- "$file_path" 2>/dev/null || echo "")

    # Look for new components
    if echo "$diff_content" | grep -q "^[+].*\(export.*function\|const.*=.*=>\|function\)"; then
        features_ref+=("\"Added new UI components in $file_path\"")
    fi

    # Look for React hooks
    if echo "$diff_content" | grep -q "^[+].*use[A-Z]"; then
        improvements_ref+=("\"Enhanced React hooks usage in $file_path\"")
    fi

    # Look for styling improvements
    if echo "$file_path" | grep -q -E "\.(css|scss|tsx)$" && echo "$diff_content" | grep -q "^[+]"; then
        improvements_ref+=("\"Updated UI styling in $file_path\"")
    fi
}

# Analyze dependency changes
analyze_dependency_changes() {
    local last_tag="$1" file_path="$2" status="$3"
    local -n improvements_ref=$4 security_ref=$5

    local diff_content=$(git diff "$last_tag..HEAD" -- "$file_path" 2>/dev/null || echo "")

    # Look for version updates
    if echo "$diff_content" | grep -q "^[+].*\"[a-zA-Z].*\":.*\"[0-9]"; then
        improvements_ref+=("\"Updated dependencies in $file_path\"")
    fi

    # Look for security-related packages
    if echo "$diff_content" | grep -q -E "security|auth|crypto|ssl|tls"; then
        security_ref+=("\"Updated security dependencies in $file_path\"")
    fi
}

# Generate beautiful release notes from analysis
generate_release_notes() {
    local version="$1"
    local analysis_file="$2"
    local output_file="$3"

    if [ ! -f "$analysis_file" ]; then
        error "Analysis file $analysis_file not found"
    fi

    log "Generating release notes for v$version..."

    # Extract arrays from JSON (simplified approach)
    local features=$(grep '"features"' "$analysis_file" | sed 's/.*"features": \[\([^]]*\)\].*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//' | sed '/^$/d')
    local improvements=$(grep '"improvements"' "$analysis_file" | sed 's/.*"improvements": \[\([^]]*\)\].*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//' | sed '/^$/d')
    local fixes=$(grep '"fixes"' "$analysis_file" | sed 's/.*"fixes": \[\([^]]*\)\].*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//' | sed '/^$/d')
    local security=$(grep '"security"' "$analysis_file" | sed 's/.*"security": \[\([^]]*\)\].*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//' | sed '/^$/d')
    local performance=$(grep '"performance"' "$analysis_file" | sed 's/.*"performance": \[\([^]]*\)\].*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//' | sed '/^$/d')
    local developer=$(grep '"developer"' "$analysis_file" | sed 's/.*"developer": \[\([^]]*\)\].*/\1/' | tr ',' '\n' | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//' | sed '/^$/d')

    # Get stats
    local files_changed=$(grep '"files_changed"' "$analysis_file" | sed 's/.*"files_changed": \([0-9]*\).*/\1/')
    local lines_added=$(grep '"lines_added"' "$analysis_file" | sed 's/.*"lines_added": \([0-9]*\).*/\1/')
    local lines_removed=$(grep '"lines_removed"' "$analysis_file" | sed 's/.*"lines_removed": \([0-9]*\).*/\1/')

    # Generate the release notes
    cat > "$output_file" <<EOF
# Release v$version

EOF

    # Features section
    if [ -n "$features" ]; then
        echo "## 🚀 New Features" >> "$output_file"
        echo "" >> "$output_file"
        echo "$features" | while read -r feature; do
            [ -n "$feature" ] && echo "- $feature" >> "$output_file"
        done
        echo "" >> "$output_file"
    fi

    # Improvements section
    if [ -n "$improvements" ]; then
        echo "## 🔧 Improvements" >> "$output_file"
        echo "" >> "$output_file"
        echo "$improvements" | while read -r improvement; do
            [ -n "$improvement" ] && echo "- $improvement" >> "$output_file"
        done
        echo "" >> "$output_file"
    fi

    # Bug fixes section
    if [ -n "$fixes" ]; then
        echo "## 🐛 Bug Fixes" >> "$output_file"
        echo "" >> "$output_file"
        echo "$fixes" | while read -r fix; do
            [ -n "$fix" ] && echo "- $fix" >> "$output_file"
        done
        echo "" >> "$output_file"
    fi

    # Performance section
    if [ -n "$performance" ]; then
        echo "## 📈 Performance" >> "$output_file"
        echo "" >> "$output_file"
        echo "$performance" | while read -r perf; do
            [ -n "$perf" ] && echo "- $perf" >> "$output_file"
        done
        echo "" >> "$output_file"
    fi

    # Security section
    if [ -n "$security" ]; then
        echo "## 🔒 Security" >> "$output_file"
        echo "" >> "$output_file"
        echo "$security" | while read -r sec; do
            [ -n "$sec" ] && echo "- $sec" >> "$output_file"
        done
        echo "" >> "$output_file"
    fi

    # Developer Experience section
    if [ -n "$developer" ]; then
        echo "## 🧰 Developer Experience" >> "$output_file"
        echo "" >> "$output_file"
        echo "$developer" | while read -r dev; do
            [ -n "$dev" ] && echo "- $dev" >> "$output_file"
        done
        echo "" >> "$output_file"
    fi

    # Stats section
    echo "## 📊 What's Changed" >> "$output_file"
    echo "" >> "$output_file"
    echo "- **$files_changed** files changed" >> "$output_file"
    echo "- **$lines_added** lines added" >> "$output_file"
    echo "- **$lines_removed** lines removed" >> "$output_file"
    echo "" >> "$output_file"

    # Footer
    local last_tag=$(get_last_tag)
    if [ -n "$last_tag" ]; then
        echo "**Full Changelog**: https://github.com/namastexlabs/automagik-forge/compare/$last_tag...v$version" >> "$output_file"
    fi

    log "Release notes generated: $output_file"
}

# Main function
main() {
    local command="${1:-analyze}"
    local version="${2:-$(get_current_version)}"
    local from_tag="${3:-}"

    case "$command" in
        analyze)
            local last_tag="${from_tag:-$(get_last_tag)}"
            analyze_code_changes "$last_tag" ".release-analysis.json"
            log "Code analysis complete: .release-analysis.json"
            ;;

        generate)
            if [ ! -f ".release-analysis.json" ]; then
                log "No analysis found, running analysis first..."
                main analyze "$version"
            fi
            generate_release_notes "$version" ".release-analysis.json" ".release-notes-draft.md"
            log "Release notes generated: .release-notes-draft.md"
            ;;

        full)
            main analyze "$version" "$from_tag"
            main generate "$version"
            log "Full release notes generation complete!"
            ;;

        *)
            echo "Usage: $0 {analyze|generate|full} [version] [from_tag]"
            echo "  analyze  - Analyze code changes since last tag"
            echo "  generate - Generate release notes from analysis"
            echo "  full     - Run both analyze and generate"
            echo ""
            echo "Examples:"
            echo "  $0 full 0.3.11 v0.3.9-20250917194709"
            echo "  $0 analyze 0.3.11"
            exit 1
            ;;
    esac
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi