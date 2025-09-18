#!/bin/bash
set -euo pipefail

# McKinsey-style optimized entrypoint
echo "🚀 Starting FastAPI application..."

# Fast database connectivity check with timeout
echo "🔌 Checking database connectivity..."
timeout 30 bash -c 'until pg_isready -h db -p 5432 -U postgres -q; do sleep 0.5; done' || {
    echo "❌ Database connection timeout after 30s"
    exit 1
}

echo "✅ Database connected"

# Create tables on startup (fast path)
echo "📊 Ensuring database schema..."
python -c "
try:
    from database.base import Base
    from database.connection import engine
    from models.user import User
    Base.metadata.create_all(bind=engine)
    print('✅ Database schema ready')
except Exception as e:
    print(f'⚠️  Schema creation warning: {e}')
" 2>/dev/null || echo "⚠️  Schema creation skipped"

echo "🎯 Starting server..."
exec "$@"