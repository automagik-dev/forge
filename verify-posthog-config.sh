#!/bin/bash

echo "🔍 PostHog Configuration Verification"
echo "======================================"
echo ""

# Load .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Backend check
echo "📦 BACKEND Configuration:"
if [ -n "$POSTHOG_API_KEY" ] && [ -n "$POSTHOG_API_ENDPOINT" ]; then
  echo "✅ POSTHOG_API_KEY: ${POSTHOG_API_KEY:0:15}..."
  echo "✅ POSTHOG_API_ENDPOINT: $POSTHOG_API_ENDPOINT"
else
  echo "❌ Backend PostHog vars not set"
fi

echo ""
echo "🌐 FRONTEND Configuration:"
if [ -n "$VITE_POSTHOG_API_KEY" ] && [ -n "$VITE_POSTHOG_API_ENDPOINT" ]; then
  echo "✅ VITE_POSTHOG_API_KEY: ${VITE_POSTHOG_API_KEY:0:15}..."
  echo "✅ VITE_POSTHOG_API_ENDPOINT: $VITE_POSTHOG_API_ENDPOINT"
else
  echo "❌ Frontend PostHog vars not set"
fi

echo ""
echo "🧪 Connection Test:"
node test-posthog.js

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Backend: Rebuild with 'cargo build --release'"
echo "2. Frontend: Rebuild with 'cd frontend && pnpm run build'"
echo "3. Check PostHog dashboard: https://us.posthog.com/"
