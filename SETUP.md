# Quick Setup Guide

## First Time Setup

### 1. Install Frontend Dependencies

```bash
# Install lucide-react for icons (required)
npm install lucide-react

# Or if you prefer to install all at once:
npm install
```

### 2. Setup Python Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

cd ..
```

## Running the App

### Option 1: Using the Start Script (macOS/Linux)

```bash
./start.sh
```

This will start both servers automatically.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (FastAPI Swagger UI)

## Troubleshooting

### "Module not found: lucide-react"
```bash
npm install lucide-react
```

### Python Dependencies Issues
```bash
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Port Already in Use
Change the port in the commands:
- Backend: `uvicorn app.main:app --reload --port 8001`
- Frontend: `npm run dev -- --port 5174`

### CORS Errors
Make sure:
1. Backend is running on port 8000
2. Frontend is running on port 5173
3. Both servers are running simultaneously

## First Test

1. Start both servers
2. Open http://localhost:5173
3. Drag an image or paste one (Ctrl/Cmd+V)
4. Enter a target size (smaller than original)
5. Click "Preview Results" to see estimation
6. Click "Compress" to compress
7. Download your compressed image!
