.PHONY: help dev prod backend frontend build test clean publish beta version npm check-cargo check-android-deps publish-automagik publish-automagik-quick

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
	@echo "  make backend              - Start backend only (uses .env or auto-allocated port)"
	@echo "  make backend BP=XXXX      - Override backend port"
	@echo "  make frontend             - Start frontend only (uses .env or auto-allocated ports)"
	@echo "  make frontend FP=XXXX     - Override frontend port (BP for backend port)"
	@echo "  make build                - Build production package (no launch)"
	@echo "  make test                 - Run full test suite"
	@echo "  make clean                - Clean build artifacts"
	@echo ""
	@echo "🚀 Release Workflows:"
	@echo "  make publish           - Complete release pipeline (main branch → npm as @automagik/forge)"
	@echo "  make npm [RUN_ID=xxx]  - Manual npm publish from artifacts (when automated publish fails)"
	@echo "  make publish-automagik - A/B test from dev: full release → npm as unscoped 'automagik'"
	@echo "  make beta              - Auto-incremented beta release"
	@echo "  make version           - Show current version info"
	@echo ""

# Check and install cargo if needed (OS agnostic)
check-cargo:
	@PATH="$$HOME/.cargo/bin:$$PATH"; \
	export PATH; \
	if command -v cargo >/dev/null 2>&1; then \
		echo "✅ Cargo already installed: $$(cargo --version)"; \
	else \
		echo "🦀 Cargo not found. Installing Rust toolchain..."; \
		if [ -d "/data/data/com.termux" ]; then \
			echo "📱 Termux detected - installing via pkg..."; \
			pkg install -y rust; \
		else \
			echo "🌐 Installing via rustup (Linux/macOS/WSL)..."; \
			curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; \
			PATH="$$HOME/.cargo/bin:$$PATH"; \
			export PATH; \
		fi; \
		echo "✅ Rust toolchain installed"; \
	fi; \
	if cargo watch --version >/dev/null 2>&1; then \
		echo "✅ cargo-watch already installed: $$(cargo watch --version)"; \
	else \
		echo "🔧 Installing cargo-watch..."; \
		if [ "$$(uname)" = "Darwin" ]; then \
			echo "🍎 macOS detected - using Homebrew for cargo-watch..."; \
			if command -v brew >/dev/null 2>&1; then \
				brew install cargo-watch; \
			else \
				echo "⚠️  Homebrew not found, trying cargo install..."; \
				cargo install cargo-watch || { echo "❌ Failed to install cargo-watch"; exit 1; }; \
			fi; \
		else \
			cargo install cargo-watch || { echo "❌ Failed to install cargo-watch"; exit 1; }; \
		fi; \
		if cargo watch --version >/dev/null 2>&1; then \
			echo "✅ cargo-watch installed: $$(cargo watch --version)"; \
		else \
			echo "❌ cargo-watch installation failed"; \
			exit 1; \
		fi; \
	fi

# Check and install Android/Termux build dependencies
check-android-deps:
	@if [ -d "/data/data/com.termux" ]; then \
		echo "📱 Checking Android/Termux build dependencies..."; \
		MISSING_DEPS=""; \
		for dep in perl openssl pkg-config make clang; do \
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
	else \
		if command -v dpkg >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then \
			echo "🐧 Checking Debian/Ubuntu build dependencies..."; \
			NEEDS_UPDATE=0; \
			if ! command -v cc >/dev/null 2>&1 || ! command -v gcc >/dev/null 2>&1; then \
				echo "📦 Installing build-essential (C/C++ compiler toolchain)..."; \
				NEEDS_UPDATE=1; \
			fi; \
			if ! dpkg -l | grep -q libclang-dev; then \
				echo "📦 Installing libclang-dev..."; \
				NEEDS_UPDATE=1; \
			fi; \
			if [ $$NEEDS_UPDATE -eq 1 ]; then \
				sudo apt-get update && sudo apt-get install -y build-essential libclang-dev; \
				echo "✅ Build dependencies installed"; \
			else \
				echo "✅ All build dependencies present"; \
			fi; \
		else \
			echo "ℹ️  Non-Debian system detected - skipping package checks"; \
			echo "   (Ensure gcc/clang and build tools are installed via your package manager)"; \
		fi; \
	fi
  
# Development mode - hot reload (backend first, then frontend)
dev: check-android-deps check-cargo
	@bash scripts/dev/run-dev.sh

# Production mode - test what will be published
prod: check-android-deps check-cargo
	@echo "📦 Building and running production package..."
	@bash scripts/dev/run-prod.sh

# Alias for prod
forge: prod

# Port override parameters (shared between backend and frontend targets)
# FP = Frontend Port, BP = Backend Port
# If not provided, uses dynamic port allocation from setup-dev-environment.js
FP ?=
BP ?=

# Backend only
backend:
	@echo "⚙️  Starting backend server (dev mode)..."
	@if [ -n "$(BP)" ]; then \
		echo "   Using manual port override: $(BP)"; \
		BACKEND_PORT=$(BP) npm run backend:dev; \
	else \
		DYNAMIC_BP=$$(node scripts/setup-dev-environment.js backend); \
		echo "   Backend Port: $$DYNAMIC_BP"; \
		BACKEND_PORT=$$DYNAMIC_BP npm run backend:dev; \
	fi

# Frontend only
frontend:
	@echo "🎨 Starting frontend server (dev mode)..."
	@DYNAMIC_FP=$$(node scripts/setup-dev-environment.js read-frontend); \
	DYNAMIC_BP=$$(node scripts/setup-dev-environment.js read-backend); \
	FINAL_FP=$${FP:-$$DYNAMIC_FP}; \
	FINAL_BP=$${BP:-$$DYNAMIC_BP}; \
	echo "   Frontend Port: $$FINAL_FP"; \
	echo "   Backend Port: $$FINAL_BP"; \
	FRONTEND_PORT=$$FINAL_FP BACKEND_PORT=$$FINAL_BP npm run frontend:dev

# Build production package (without launching)
build: check-android-deps check-cargo
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

# Manual NPM publish from downloaded artifacts (when automated publish fails)
npm:
	@bash scripts/publish-npm.sh $(RUN_ID)

# A/B test publish: full release pipeline from dev branch, publish as 'automagik'
publish-automagik:
	@bash scripts/publish-automagik.sh
