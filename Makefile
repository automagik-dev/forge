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
	@echo "  bump VERSION=x.y.z  - Bump version across all package files"
	@echo "  build               - Build frontend and Rust binaries"
	@echo "  publish             - Build and publish to NPM"
	@echo "  clean               - Clean build artifacts"
	@echo "  help                - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make bump VERSION=0.3.1"
	@echo "  make build"
	@echo "  make publish"

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

# Build and publish to NPM (current platform only - NOT RECOMMENDED)
publish-current: build
	@echo "⚠️  WARNING: Publishing with only current platform binaries!"
	@echo "📦 Publishing to NPM..."
	@cd npx-cli && npm publish
	@echo "🎉 Published to NPM (current platform only)"
	@echo "⚠️  This package will only work on your current platform!"

# Publish to NPM (requires all platform binaries)
publish:
	@echo "📦 Preparing to publish to NPM..."
	@if [ ! -d "npx-cli/dist/linux-x64" ] || [ ! -d "npx-cli/dist/macos-arm64" ] || [ ! -d "npx-cli/dist/windows-x64" ]; then \
		echo "❌ Missing platform binaries!"; \
		echo "   Found:"; \
		ls -la npx-cli/dist/ 2>/dev/null || echo "   No dist folder"; \
		echo ""; \
		echo "To publish with all platforms:"; \
		echo "  1. Use GitHub Actions: git tag v$(shell grep '"version"' npx-cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/') && git push --tags"; \
		echo "  2. Or build manually on each platform and collect binaries"; \
		echo ""; \
		echo "To publish current platform only (NOT RECOMMENDED):"; \
		echo "  make publish-current"; \
		exit 1; \
	fi
	@echo "✅ All platforms found, publishing..."
	@cd npx-cli && npm publish
	@echo "🎉 Successfully published to NPM!"
	@echo "📋 Users can now install with: npx automagik-forge"

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