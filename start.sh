#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Image Compressor...${NC}\n"

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}Setting up backend virtual environment...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start backend in background
echo -e "${GREEN}Starting backend server on port 8000...${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${GREEN}Starting frontend server on port 5173...${NC}"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}✓ Both servers started!${NC}"
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}Backend:  http://localhost:8000${NC}"
echo -e "\n${GREEN}Opening browser...${NC}\n"

# Open frontend in default browser
sleep 1
open http://localhost:5173

echo -e "Press Ctrl+C to stop both servers\n"

# Handle cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
