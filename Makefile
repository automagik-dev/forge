# Automagik Forge - Build and Publishing Automation
# Usage:
#   make publish               # Complete release pipeline (version bump + build + npm)
#   make build                 # Build the project locally
#   make beta                  # Create a beta release

.PHONY: help bump build publish publish-rc publish-stable clean check-version version dev test

# Default target
help:
	@echo "Automagik Forge Build Automation"
	@echo ""
	@echo "Available targets:"
	@echo "  dev                 - Start dev server (pnpm run dev)"
	@echo "  publish-rc          - Publish RC release (auto version bump + build all platforms + npm @next)"
	@echo "  publish-stable      - Promote latest RC to stable (npm @latest + GitHub stable release)"
	@echo "  build               - Build frontend and Rust binaries (current platform only)"
	@echo "  clean               - Clean build artifacts"
	@echo "  test                - Run comprehensive test suite"
	@echo "  version             - Show current version info"
	@echo "  help                - Show this help message"
	@echo ""
	@echo "🚀 Release Workflows:"
	@echo ""
	@echo "📦 Step 1: Publish RC Release"
	@echo "  make publish-rc"
	@echo "  • Auto-increments RC version (0.5.1-rc.1 → 0.5.1-rc.2)"
	@echo "  • Builds all platforms (Linux, macOS, Windows x64/ARM64)"
	@echo "  • Publishes to npm @next tag"
	@echo "  • Creates GitHub pre-release"
	@echo "  • Duration: ~30-45 minutes"
	@echo ""
	@echo "📦 Step 2: Promote to Stable (after testing RC)"
	@echo "  make publish-stable"
	@echo "  • Converts latest RC to stable version"
	@echo "  • Updates npm @latest tag"
	@echo "  • Converts GitHub pre-release to stable release"
	@echo ""
	@echo "💡 Example workflow:"
	@echo "  1. make publish-rc           # Creates 0.5.1-rc.2"
	@echo "  2. Test RC: npx automagik-forge@next"
	@echo "  3. make publish-stable       # Promotes to 0.5.1 stable"

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
	@read -r dummy
	@echo "📝 Manually updating version in all package files..."
	@# Update root package.json
	@sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' package.json
	@# Update frontend package.json
	@sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' frontend/package.json
	@# Update npx-cli package.json
	@sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' npx-cli/package.json
	@# Update forge-app Cargo.toml
	@sed -i '0,/version = "[^"]*"/s//version = "$(VERSION)"/' forge-app/Cargo.toml
	@# Update all forge-extensions Cargo.toml files
	@for f in forge-extensions/*/Cargo.toml; do \
		sed -i '0,/version = "[^"]*"/s//version = "$(VERSION)"/' $$f; \
	done
	@echo "✅ Version bumped to $(VERSION) across all files"
	@echo "📋 Updated files:"
	@echo "   - package.json"
	@echo "   - frontend/package.json"
	@echo "   - npx-cli/package.json"
	@echo "   - forge-app/Cargo.toml"
	@echo "   - forge-extensions/*/Cargo.toml"
	@echo ""
	@echo "🔄 Committing version bump..."
	@git add package.json frontend/package.json npx-cli/package.json forge-app/Cargo.toml forge-extensions/*/Cargo.toml
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
	@cd frontend && pnpm run build
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
	@rm -rf dev_assets/
	@rm -f automagik-forge automagik-forge-mcp
	@rm -f *.zip
	@echo "✅ Clean complete!"

# Publish RC release (auto-increment, build all platforms, npm @next)
publish-rc:
	@node scripts/release/publish-rc.js

# Promote latest RC to stable (npm @latest, GitHub stable release)
publish-stable:
	@node scripts/release/publish-stable.js

# Legacy publish target - redirects to publish-rc
publish: publish-rc

# Development server
dev:
	@echo "🚀 Starting development environment..."
	@pnpm run dev

test:
	@echo "🧪 Running comprehensive test suite..."
	@echo "📋 Rust: Compilation check..."
	@cargo check --workspace
	@echo "🧪 Rust: Running tests..."
	@cargo test --workspace
	@echo "🎨 Rust: Format check..."
	@cargo fmt --all -- --check
	@echo "📏 Rust: Linting (clippy)..."
	@cargo clippy --all --all-targets --all-features -- -D warnings
	@echo "🔧 Type generation validation (server)..."
	@cargo run -p server --bin generate_types -- --check
	@echo "🔧 Type generation validation (forge-app)..."
	@cargo run -p forge-app --bin generate_forge_types -- --check
	@echo "📋 Frontend: Type check..."
	@cd frontend && pnpm run check
	@echo "📏 Frontend: Linting..."
	@cd frontend && pnpm run lint
	@echo "🎨 Frontend: Format check..."
	@cd frontend && pnpm run format:check
	@echo "✅ All tests passed!"

# Version info
version:
	@echo "Current versions:"
	@echo "  Root:         $$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Frontend:     $$(grep '"version"' frontend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  NPX CLI:      $$(grep '"version"' npx-cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Forge App:    $$(grep 'version =' forge-app/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Forge Omni:   $$(grep 'version =' forge-extensions/omni/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Forge Config: $$(grep 'version =' forge-extensions/config/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Upstream:     $$(grep 'version =' upstream/crates/server/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"