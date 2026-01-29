#!/bin/bash

echo "🚀 Starting NLive Application..."
echo ""

# Check if backend server is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend server is already running on port 3000"
else
    echo "⚠️  Backend server is not running. Starting it now..."
    cd "$(dirname "$0")"
    npm run dev &
    BACKEND_PID=$!
    echo "✅ Backend server started (PID: $BACKEND_PID)"
    sleep 3
fi

echo ""

# Check if frontend is running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Frontend is already running on port 5173"
else
    echo "⚠️  Frontend is not running. Starting it now..."
    cd "$(dirname "$0")/client"
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
fi

echo ""
echo "🎉 Application is ready!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep script running
wait
