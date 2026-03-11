#!/bin/sh
set -e

echo "========================================"
echo "STP Framework - Three Departments and Six Ministries"
echo "========================================"
echo "Version: 0.1.0"
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo ""

# Check if .env file exists, create from example if not
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env 2>/dev/null || true
fi

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env file"
    export $(grep -v '^#' .env | xargs)
fi

# Default configuration
STP_PORT=${STP_PORT:-3000}
STP_HOST=${STP_HOST:-0.0.0.0}
STP_ENABLE_LOGGING=${STP_ENABLE_LOGGING:-true}
STP_STRICT_VALIDATION=${STP_STRICT_VALIDATION:-false}
STP_TIMEOUT=${STP_TIMEOUT:-30000}

echo "Configuration:"
echo "  Port: $STP_PORT"
echo "  Host: $STP_HOST"
echo "  Enable Logging: $STP_ENABLE_LOGGING"
echo "  Strict Validation: $STP_STRICT_VALIDATION"
echo "  Timeout: $STP_TIMEOUT ms"
echo ""

# Check if we should run in API mode or example mode
if [ "$STP_MODE" = "api" ]; then
    echo "Starting STP API Server..."
    node dist/server.js
elif [ "$STP_MODE" = "example" ]; then
    echo "Running STP Example..."
    node examples/basic-usage.js
else
    echo "Starting STP Framework (Interactive Mode)..."
    echo ""
    echo "Available commands:"
    echo "  1. Run example: node examples/basic-usage.js"
    echo "  2. Start API server: STP_MODE=api node dist/server.js"
    echo "  3. Run tests: npm test"
    echo ""
    echo "To run in background mode, set STP_MODE=api or STP_MODE=example"
    echo ""
    
    # Keep container running
    tail -f /dev/null
fi