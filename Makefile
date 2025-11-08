.PHONY: help dev prod backend frontend build test clean

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

# Development mode - hot reload (backend first, then frontend)
dev:
	@bash scripts/dev/run-dev.sh

# Production mode - test what will be published
prod:
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
build:
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
