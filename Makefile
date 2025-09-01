# Automagik Forge - Build and Publishing Automation
# Usage:
#   make bump VERSION=0.3.1    # Bump version across all files
#   make build                 # Build the project
#   make publish               # Build and publish to NPM

.PHONY: help bump build publish clean check-version version dev test

# Default target
help:
	@echo "Automagik Forge Build Automation"
	@echo ""
	@echo "Available targets:"
	@echo "  bump VERSION=x.y.z  - Bump version and auto-commit"
	@echo "  build               - Build frontend and Rust binaries (current platform)"
	@echo "  publish             - Interactive Claude-powered publishing pipeline"
	@echo "  beta                - Auto-incremented beta release (no version bump needed)"
	@echo "  clean               - Clean build artifacts"
	@echo "  help                - Show this help message"
	@echo ""
	@echo "🚀 Complete Release Workflows:"
	@echo ""
	@echo "📦 Full Release:"
	@echo "  1. make bump VERSION=0.3.5    # Bump version and commit"
	@echo "  2. make publish               # Interactive Claude release!"
	@echo ""
	@echo "🧪 Beta Testing:"
	@echo "  1. make bump VERSION=0.3.5    # Set base version"
	@echo "  2. [make changes and commit]"
	@echo "  3. make beta                  # Auto-publishes 0.3.5-beta.1"
	@echo "  4. [test, fix, commit more]"
	@echo "  5. make beta                  # Auto-publishes 0.3.5-beta.2"
	@echo "  6. make publish               # Final 0.3.5 release"
	@echo ""
	@echo "Beta releases:"
	@echo "  • Auto-increment beta numbers (0.3.5-beta.1, 0.3.5-beta.2...)"
	@echo "  • Create GitHub pre-releases"
	@echo "  • Publish to NPM with 'beta' tag: npx automagik-forge@beta"

# Check if VERSION is provided for bump target
check-version:
	@if [ -z "$(VERSION)" ]; then \
		echo "❌ Error: VERSION is required. Usage: make bump VERSION=x.y.z"; \
		exit 1; \
	fi
	@echo "🔄 Bumping version to $(VERSION)"

# Bump version across all package files
bump: check-version
	@echo "📝 Updating version in all package files..."
	@# Update root package.json
	@sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' package.json
	@# Update frontend package.json
	@sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' frontend/package.json
	@# Update npx-cli package.json
	@sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' npx-cli/package.json
	@# Update all Cargo.toml files (only the first version under [package])
	@for f in crates/*/Cargo.toml; do \
		sed -i '0,/version = "[^"]*"/s//version = "$(VERSION)"/' $$f; \
	done
	@echo "✅ Version bumped to $(VERSION) across all files"
	@echo "📋 Updated files:"
	@echo "   - package.json"
	@echo "   - frontend/package.json"
	@echo "   - npx-cli/package.json"
	@echo "   - crates/*/Cargo.toml"
	@echo ""
	@echo "🔄 Committing version bump..."
	@git add package.json frontend/package.json npx-cli/package.json crates/*/Cargo.toml
	@git commit -m "chore: bump version to $(VERSION)"
	@echo "✅ Version $(VERSION) committed successfully!"

# Build the project (current platform only)
build:
	@echo "🚀 Building Automagik Forge for current platform..."
	@echo "🧹 Cleaning previous builds..."
	@rm -rf npx-cli/dist
	@echo "🔨 Building frontend..."
	@cd frontend && npm run build
	@echo "🔨 Building Rust binaries..."
	@cargo build --release
	@cargo build --release --bin mcp_task_server
	@echo "📦 Creating distribution package..."
	@bash local-build.sh
	@echo "✅ Build complete for current platform!"
	@echo "⚠️  Note: This only builds for your current platform."
	@echo "   For all platforms, use GitHub Actions or build on each platform."

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf target/
	@rm -rf frontend/dist/
	@rm -rf npx-cli/dist/
	@rm -f automagik-forge automagik-forge-mcp
	@rm -f *.zip
	@echo "✅ Clean complete!"

# Interactive end-to-end publishing with Claude-generated release notes
publish:
	@./gh-build.sh publish

# Beta release with auto-incremented version
beta:
	@./gh-build.sh beta

# Development helpers
dev:
	@echo "🚀 Starting development environment..."
	@npm run dev

test:
	@echo "🧪 Running tests..."
	@npm run check

# Version info
version:
	@echo "Current versions:"
	@echo "  Root:     $$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Frontend: $$(grep '"version"' frontend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  NPX CLI:  $$(grep '"version"' npx-cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Server:   $$(grep 'version =' crates/server/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"