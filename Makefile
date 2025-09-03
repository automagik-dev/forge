# Automagik Forge - Build and Publishing Automation
# Usage:
#   make publish               # Complete release pipeline (version bump + build + npm)
#   make build                 # Build the project locally
#   make beta                  # Create a beta release

.PHONY: help bump build publish clean check-version version dev test

# Default target
help:
	@echo "Automagik Forge Build Automation"
	@echo ""
	@echo "Available targets:"
	@echo "  publish             - Complete release pipeline (auto version bump + build + npm)"
	@echo "  beta                - Auto-incremented beta release"
	@echo "  build               - Build frontend and Rust binaries (current platform only)"
	@echo "  clean               - Clean build artifacts"
	@echo "  version             - Show current version info"
	@echo "  help                - Show this help message"
	@echo ""
	@echo "🚀 Release Workflows:"
	@echo ""
	@echo "📦 Full Release (NEW - All-in-one!):"
	@echo "  make publish"
	@echo "  • Automatically bumps version (patch/minor/major)"
	@echo "  • Builds all platforms via GitHub Actions"
	@echo "  • Generates release notes with Claude"
	@echo "  • Publishes to npm registry"
	@echo "  • Creates GitHub release"
	@echo ""
	@echo "🧪 Beta Testing:"
	@echo "  make beta"
	@echo "  • Auto-increments beta versions (0.3.5-beta.1, 0.3.5-beta.2...)"
	@echo "  • Creates GitHub pre-releases"
	@echo "  • Publishes to NPM with 'beta' tag"
	@echo "  • Install with: npx vibe-kanban@beta"
	@echo ""
	@echo "Note: 'make bump' is now deprecated - use 'make publish' instead"

# Check if VERSION is provided for bump target
check-version:
	@if [ -z "$(VERSION)" ]; then \
		echo "❌ Error: VERSION is required. Usage: make bump VERSION=x.y.z"; \
		exit 1; \
	fi
	@echo "🔄 Bumping version to $(VERSION)"

# Bump version across all package files (DEPRECATED - use 'make publish' instead)
bump: check-version
	@echo "⚠️  WARNING: 'make bump' is deprecated!"
	@echo ""
	@echo "🚀 Please use 'make publish' instead, which handles everything:"
	@echo "   • Automatic version bumping (patch/minor/major)"
	@echo "   • Building all platforms"
	@echo "   • Publishing to npm"
	@echo "   • Creating GitHub release"
	@echo ""
	@echo "If you really need to manually bump the version, continue..."
	@echo "Press Ctrl+C to cancel, or Enter to proceed with manual bump"
	@read -r
	@echo "📝 Manually updating version in all package files..."
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
	@echo ""
	@echo "⚠️  Remember: Next time use 'make publish' for the complete workflow!"

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

# Complete release pipeline: version bump + build + publish + release notes
publish:
	@echo "🚀 Complete Release Pipeline"
	@echo "This will:"
	@echo "  1. Let you choose version bump type (patch/minor/major)"
	@echo "  2. Trigger GitHub Actions to bump version and build all platforms"
	@echo "  3. Generate release notes with Claude"
	@echo "  4. Create GitHub release and publish to npm"
	@echo ""
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