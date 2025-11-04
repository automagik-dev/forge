.PHONY: help dev prod backend frontend build test clean

# Default target
help:
	@echo "🔧 Automagik Forge - Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev       - Start development server (frontend + backend with hot reload)"
	@echo "  make prod      - Build and run production package (exactly what gets published)"
	@echo ""
	@echo "Specific Targets:"
	@echo "  make backend   - Start backend only (dev mode)"
	@echo "  make frontend  - Start frontend only (dev mode)"
	@echo "  make build     - Build production package"
	@echo "  make test      - Run full test suite"
	@echo "  make clean     - Clean build artifacts"
	@echo ""

# Development mode - hot reload
dev:
	@echo "🚀 Starting development environment..."
	@pnpm run dev

# Production mode - test what will be published
prod:
	@echo "📦 Building and running production package..."
	@bash scripts/dev/run-prod.sh

# Backend only
backend:
	@echo "⚙️  Starting backend server (dev mode)..."
	@npm run backend:dev

# Frontend only
frontend:
	@echo "🎨 Starting frontend server (dev mode)..."
	@npm run frontend:dev

# Build production package
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
