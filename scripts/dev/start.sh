#!/bin/bash
# Quick start script for local development
# Usage: ./start.sh [backend|frontend|both]

set -e

MODE="${1:-both}"

case "$MODE" in
  backend)
    echo "🚀 Starting backend only..."
    npm run backend:dev
    ;;
  frontend)
    echo "🚀 Starting frontend only..."
    npm run frontend:dev
    ;;
  both)
    echo "🚀 Starting full dev environment (frontend + backend)..."
    pnpm run dev
    ;;
  *)
    echo "❌ Invalid mode: $MODE"
    echo "Usage: ./start.sh [backend|frontend|both]"
    exit 1
    ;;
esac
