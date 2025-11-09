.PHONY: help dev prod backend frontend build test clean publish beta version check-cargo check-android-deps check-submodules

# Default target
help:
	@echo "🔧 Automagik Forge - Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev       - Start dev environment (backend first, then frontend)"
	@echo "  make prod      - Build and run production package (QA testing)"
	@echo "  make forge     - Alias for 'make prod'"
	@echo ""
	@echo "Specific Targets:"
	@echo "  make backend   - Start backend only (dev mode)"
	@echo "  make frontend  - Start frontend only (dev mode)"
	@echo "  make build     - Build production package (no launch)"
	@echo "  make test      - Run full test suite"
	@echo "  make clean     - Clean build artifacts"
	@echo ""
	@echo "🚀 Release Workflows:"
	@echo "  make publish   - Complete release pipeline (auto version bump + build + npm)"
	@echo "  make beta      - Auto-incremented beta release"
	@echo "  make version   - Show current version info"
	@echo ""

# Check and install cargo if needed (OS agnostic)
check-cargo:
	@export PATH="$$HOME/.cargo/bin:$$PATH"; \
	if ! command -v cargo &> /dev/null; then \
		echo "🦀 Cargo not found. Installing Rust toolchain..."; \
		if [ -d "/data/data/com.termux" ]; then \
			echo "📱 Termux detected - installing via pkg..."; \
			pkg install -y rust; \
		else \
			echo "🌐 Installing via rustup (Linux/macOS/WSL)..."; \
			curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; \
		fi; \
		echo "✅ Rust toolchain installed"; \
	else \
		echo "✅ Cargo already installed: $$(cargo --version)"; \
	fi; \
	if ! cargo watch --version &> /dev/null; then \
		echo "🔧 Installing cargo-watch..."; \
		cargo install cargo-watch; \
		echo "✅ cargo-watch installed"; \
	else \
		echo "✅ cargo-watch already installed: $$(cargo watch --version)"; \
	fi

# Check and install Android/Termux build dependencies
check-android-deps:
	@if [ -d "/data/data/com.termux" ]; then \
		echo "📱 Checking Android/Termux build dependencies..."; \
		MISSING_DEPS=""; \
		for dep in perl openssl pkg-config make; do \
			if ! command -v $$dep &> /dev/null; then \
				MISSING_DEPS="$$MISSING_DEPS $$dep"; \
			fi; \
		done; \
		if [ -n "$$MISSING_DEPS" ]; then \
			echo "📦 Installing missing dependencies:$$MISSING_DEPS"; \
			pkg install -y$$MISSING_DEPS; \
			echo "✅ Dependencies installed"; \
		else \
			echo "✅ All build dependencies present"; \
		fi; \
	fi
  
# Initialize git submodules
check-submodules:
	@git config submodule.recurse true 2>/dev/null || true
	@if [ ! -f "upstream/Cargo.toml" ]; then \
		echo "📦 Initializing git submodules..."; \
		git submodule update --init --recursive; \
		echo "✅ Submodules initialized"; \
	fi

# Development mode - hot reload (backend first, then frontend)
dev: check-cargo check-android-deps check-submodules
	@bash scripts/dev/run-dev.sh

# Production mode - test what will be published
prod: check-cargo check-android-deps check-submodules
	@echo "📦 Building and running production package..."
	@bash scripts/dev/run-prod.sh

# Alias for prod
forge: prod

# Backend only
backend:
	@echo "⚙️  Starting backend server (dev mode)..."
	@npm run backend:dev

# Frontend only
frontend:
	@echo "🎨 Starting frontend server (dev mode)..."
	@npm run frontend:dev

# Build production package (without launching)
build: check-cargo check-android-deps check-submodules
	@echo "🔨 Building production package..."
	@bash scripts/build/build.sh

# Run tests
test:
	@echo "🧪 Running test suite..."
	@npm run test:all

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf npx-cli/dist
	@rm -f npx-cli/*.tgz
	@cargo clean
	@echo "✅ Clean complete"

# Complete release pipeline: version bump + build + publish + release notes
publish:
	@echo "🚀 Complete Release Pipeline"
	@echo "This will:"
	@echo "  1. Let you choose version bump type (patch/minor/major)"
	@echo "  2. Trigger GitHub Actions to bump version and build all platforms"
	@echo "  3. Generate AI-powered release notes with Genie (semantic analysis)"
	@echo "  4. Create GitHub release and publish to npm"
	@echo ""
	@./gh-build.sh publish

# Beta release with auto-incremented version
beta:
	@./gh-build.sh beta

# Version info
version:
	@echo "Current versions:"
	@echo "  Root:         $$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Frontend:     $$(grep '"version"' frontend/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  NPX CLI:      $$(grep '"version"' npx-cli/package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')"
	@echo "  Forge App:    $$(grep 'version =' forge-app/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Forge Omni:   $$(grep 'version =' forge-extensions/omni/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"
	@echo "  Forge Config: $$(grep 'version =' forge-extensions/config/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/')"

	@echo "  Upstream:     $$(grep 'version =' upstream/crates/server/Cargo.toml | head -1 | sed 's/.*version = "\([^"]*\)".*/\1/'")
