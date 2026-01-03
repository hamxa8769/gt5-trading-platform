#!/bin/bash
# Quick status check for GT5 Trading Platform

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  GT5 TRADING PLATFORM - STATUS CHECK     ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check Frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend:  RUNNING (port 8080)"
else
    echo "❌ Frontend:  DOWN"
fi

# Check Backend
BACKEND_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null | jq -r '.status' 2>/dev/null)
if [ "$BACKEND_HEALTH" = "healthy" ]; then
    echo "✅ Backend:   RUNNING (port 3000)"
    echo "✅ Database:  $(curl -s http://localhost:3000/health | jq -r '.services.database')"
    echo "✅ Redis:     $(curl -s http://localhost:3000/health | jq -r '.services.redis')"
else
    echo "❌ Backend:   DOWN"
fi

# Check Docker
if docker ps | grep -q "gt5_postgres"; then
    echo "✅ Docker:    RUNNING"
else
    echo "⚠️  Docker:    NOT RUNNING"
fi

echo ""
echo "─────────────────────────────────────────────"
if [ "$FRONTEND_STATUS" = "200" ] && [ "$BACKEND_HEALTH" = "healthy" ]; then
    echo "🟢 Platform Status: OPERATIONAL"
    echo ""
    echo "🌐 Access: http://localhost:8080"
    echo "👤 Login:  demo@gt5trading.com / Demo123!"
else
    echo "🔴 Platform Status: ISSUES DETECTED"
    echo ""
    echo "Run: /home/engine/project/keep-alive.sh"
fi
echo "─────────────────────────────────────────────"
echo ""
