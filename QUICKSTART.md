# 🚀 Quick Start

## Setup (First Time Only)

```bash
# 1. Install lucide-react
npm install lucide-react

# 2. Setup Python backend
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Run the App

### Option 1: Auto-start (macOS/Linux)
```bash
./start.sh
```

### Option 2: Manual (2 terminals)
```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend  
npm run dev
```

## Access
- **App:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

## Usage
1. Drop/paste an image (Ctrl+V)
2. Enter target size in MB (smaller than original)
3. Click "Preview Results" → "Compress"
4. Download compressed image

## Supported Formats
- **Input:** JPEG, PNG, WebP
- **Output:** JPEG, PNG, WebP (Auto recommended)

## Troubleshooting
- **Port in use:** Change port with `--port 8001` (backend) or `-- --port 5174` (frontend)
- **Module errors:** Run `npm install lucide-react`
- **Python errors:** Activate venv and `pip install -r requirements.txt`

## Files Modified from Template
- ✅ All PRD requirements implemented
- ✅ Backend fully functional
- ✅ Frontend fully integrated
- ✅ No CSS structure changes (as requested)
