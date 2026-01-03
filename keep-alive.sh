#!/bin/bash

# GT5 Trading Platform - Keep Alive Script
# This script ensures the platform stays running

echo "🔧 GT5 Trading Platform - Keep Alive Monitor"
echo "============================================="

check_and_restart() {
    SERVICE=$1
    PID_FILE=$2
    LOG_FILE=$3
    START_CMD=$4
    PORT=$5

    # Check if process is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            # Check if port is responsive
            if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200\|503"; then
                echo "✅ $SERVICE is running (PID: $PID)"
                return 0
            fi
        fi
    fi

    # Service is down, restart it
    echo "🔄 Restarting $SERVICE..."
    eval "$START_CMD > $LOG_FILE 2>&1 &"
    NEW_PID=$!
    echo $NEW_PID > "$PID_FILE"
    sleep 3
    
    if ps -p $NEW_PID > /dev/null 2>&1; then
        echo "✅ $SERVICE restarted successfully (PID: $NEW_PID)"
    else
        echo "❌ Failed to restart $SERVICE"
    fi
}

# Check Docker containers
echo ""
echo "📦 Checking Docker services..."
cd /home/engine/project/backend
docker compose ps | grep -q "Up" || {
    echo "🔄 Starting Docker containers..."
    docker compose up -d
    sleep 5
}
echo "✅ Docker services are running"

# Check Backend
echo ""
check_and_restart \
    "Backend API" \
    "/tmp/backend.pid" \
    "/tmp/backend.log" \
    "cd /home/engine/project/backend && nohup npm run dev" \
    "3000"

# Check Frontend
echo ""
check_and_restart \
    "Frontend UI" \
    "/tmp/frontend.pid" \
    "/tmp/frontend.log" \
    "cd /home/engine/project/frontend && nohup node server.js" \
    "8080"

# Final status check
echo ""
echo "============================================="
echo "📊 Platform Status:"
echo ""
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

if [ "$BACKEND_STATUS" = "200" ] && [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Platform is FULLY OPERATIONAL"
    echo ""
    echo "🌐 Frontend:  http://localhost:8080"
    echo "🔧 Backend:   http://localhost:3000"
    echo "💾 Database:  $(curl -s http://localhost:3000/health | jq -r '.services.database')"
    echo "🔴 Redis:     $(curl -s http://localhost:3000/health | jq -r '.services.redis')"
else
    echo "⚠️  Platform has issues"
    echo "   Backend: $BACKEND_STATUS"
    echo "   Frontend: $FRONTEND_STATUS"
fi

echo ""
echo "============================================="
echo "✅ Keep-alive check complete!"
