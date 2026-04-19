#!/bin/bash
echo "🚀 Starting LUXE E-Commerce (Development)"
echo ""

# Start backend in background
echo "▶ Starting backend on port 5000..."
cd backend && npm run dev &
BACKEND_PID=$!

# Small delay
sleep 2

# Start frontend
echo "▶ Starting frontend on port 5173..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
