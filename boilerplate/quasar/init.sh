#!/usr/bin/env bash
# init.sh — Start dev environment for quasar-frontend
set -e

echo "=== Starting quasar-frontend dev environment ==="

# Navigate to project root regardless of where this is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check Node.js version
NODE_VERSION=$(node --version)
echo "    Node.js version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v20 ]]; then
    echo "    ⚠️  Warning: Node.js 20 LTS recommended"
fi

# 2. Install dependencies
if [ ! -d "node_modules" ]; then
    echo "    Installing npm dependencies..."
    npm ci
    echo "    ✅ Dependencies installed"
else
    echo "    ✅ Dependencies already installed"
fi

# 3. Start backend API (if docker-compose exists at root)
if [ -f "../docker-compose.yml" ]; then
    echo "    Starting backend services..."
    docker compose -f ../docker-compose.yml up -d postgres 2>/dev/null || true
    echo "    ⏳ Waiting for PostgreSQL..."
    sleep 3
fi

# 4. Set up environment
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "    ⚠️  No .env file found. Copy .env.example to .env and configure."
    echo "    cp .env.example .env"
fi

# 5. Start development server
if [ "$1" == "--verify" ]; then
    echo "=== Verify mode — skipping dev server start ==="
else
    echo "    Starting Quasar dev server..."
    npm run dev &
    DEV_PID=$!
    export QUASAR_PID=$DEV_PID
    echo "    ✅ Quasar dev server started (PID: $DEV_PID)"
fi

# 6. Wait for dev server
echo "    Waiting for dev server..."
for i in {1..30}; do
    if curl -sf http://localhost:9000 2>/dev/null; then
        echo "    ✅ Dev server is running"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "    ⚠️  Dev server check timed out"
    fi
    sleep 1
done

# 7. Smoke test — verify core functionality
if [ -z "$DEV_PID" ] || kill -0 $DEV_PID 2>/dev/null; then
    echo "=== Smoke test ==="
    curl -sf http://localhost:9000 2>/dev/null || \
    echo "    ⚠️  Dev server not responding"
fi

# 8. Run Storybook (optional)
if [ "$2" == "--storybook" ]; then
    echo "    Starting Storybook..."
    npm run storybook &
    STORYBOOK_PID=$!
    echo "    ✅ Storybook started (PID: $STORYBOOK_PID)"
    echo "    Storybook: http://localhost:6006"
fi

echo "=== Dev environment ready ==="
if [ -n "$DEV_PID" ]; then
    echo "PID: $DEV_PID"
    echo "App: http://localhost:9000"
    echo "To stop: kill $DEV_PID"
fi

# Keep running if foreground
trap "echo 'Caught signal, shutting down...'; [ -n \"\$DEV_PID\" ] && kill \$DEV_PID 2>/dev/null || true; [ -n \"\$STORYBOOK_PID\" ] && kill \$STORYBOOK_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# Wait if server is running
if [ -n "$DEV_PID" ]; then
    wait $DEV_PID
fi
