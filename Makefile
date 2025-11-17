.PHONY: help dev prod backend frontend ensure-frontend-stub build-frontend build test clean publish beta version npm check-cargo check-android-deps publish-automagik publish-automagik-quick service

# Default target
help:
	@echo "🔧 Automagik Forge - Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev       - Start dev environment (backend + frontend together)"
	@echo "  make prod      - Build and run production package (QA testing)"
	@echo "  make forge     - Alias for 'make prod'"
	@echo ""
	@echo "Isolated Development (run separately in different terminals):"
	@echo "  make backend              - Backend only (stub dist, no frontend build)"
	@echo "  make backend BP=XXXX      - Backend with custom port"
	@echo "  make frontend             - Frontend only (dev server with hot reload)"
	@echo "  make frontend FP=XXXX     - Frontend with custom port"
	@echo ""
	@echo "Other Targets:"
	@echo "  make build                - Build production package (no launch)"
	@echo "  make test                 - Run full test suite"
	@echo "  make clean                - Clean build artifacts"
	@echo ""
	@echo "🐧 Linux Service Deployment (Ubuntu/Debian only):"
	@echo "  make service              - Transform 'make prod' into systemd service"
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

# Create stub frontend/dist for backend compilation (dev isolation)
ensure-frontend-stub:
	@if [ ! -d "frontend/dist" ] || [ -z "$$(ls -A frontend/dist 2>/dev/null)" ]; then \
		echo "📁 Creating stub frontend/dist for backend compilation..."; \
		mkdir -p frontend/dist; \
		echo '<!DOCTYPE html><html><body><h1>Dev Mode</h1><p>Use separate frontend dev server at http://localhost:3000</p></body></html>' > frontend/dist/index.html; \
		echo "✅ Stub created (backend can compile, frontend runs independently)"; \
	fi

# Build full frontend assets (for production)
build-frontend:
	@echo "🔨 Building production frontend..."; \
	cd frontend && pnpm install && pnpm run build

# Backend only (dev isolation - no frontend build required)
backend: ensure-frontend-stub
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

# Install as systemd service (Ubuntu/Debian only)
service:
	@echo "🐧 Installing Automagik Forge as systemd service..."
	@echo ""
	@if [ ! -f /etc/os-release ]; then \
		echo "❌ Error: Cannot detect OS (requires /etc/os-release)"; \
		exit 1; \
	fi; \
	. /etc/os-release; \
	if [ "$$ID" != "ubuntu" ] && [ "$$ID" != "debian" ]; then \
		echo "❌ Error: Unsupported OS ($$PRETTY_NAME)"; \
		echo ""; \
		echo "This target only supports:"; \
		echo "  - Ubuntu 18.04+"; \
		echo "  - Debian 10+"; \
		echo ""; \
		echo "For other systems, see DEPLOYMENT.md for manual setup."; \
		exit 1; \
	fi; \
	if ! command -v systemctl >/dev/null 2>&1; then \
		echo "❌ Error: systemd not found"; \
		exit 1; \
	fi; \
	bash scripts/service/install-service.sh
