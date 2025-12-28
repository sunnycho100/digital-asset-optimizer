# Image Compressor

A privacy-preserving local web application for compressing images to a target file size. All processing happens locally - your images never leave your device.

## Features

- **Drag & Drop / Paste Support**: Easily upload images by dragging, clicking, or pasting (Ctrl+V)
- **Multiple Formats**: Support for JPEG, PNG, and WebP input/output
- **Target Size Compression**: Specify exact target file size in MB
- **Smart Compression**: Automatic format selection and quality optimization
- **Preview & Metadata**: See image preview and detailed metadata before compression
- **Prediction**: Preview estimated output size and dimensions before compressing
- **100% Local**: All processing happens in your browser and local Python backend

## Tech Stack

### Frontend
- **Vite** - Fast build tool and dev server
- **React** + **TypeScript** - UI framework and type safety
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first styling

### Backend
- **FastAPI** - Modern Python web framework
- **Pillow (PIL)** - Image processing library
- **uvicorn** - ASGI server

## Project Structure

```
digital-asset-optimizer/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Pydantic models
│   │   ├── compress.py          # Compression algorithms
│   │   └── utils.py             # Utility functions
│   ├── requirements.txt         # Python dependencies
│   └── README.md
├── src/
│   ├── api/
│   │   └── client.ts            # API client wrapper
│   ├── components/
│   │   ├── DropZone.tsx         # File upload component
│   │   ├── PreviewCard.tsx      # Image preview
│   │   ├── MetadataPanel.tsx    # Image metadata display
│   │   ├── CompressionControls.tsx
│   │   ├── PredictionPanel.tsx
│   │   └── ui/                  # shadcn/ui components
│   ├── types/
│   │   └── api.ts               # TypeScript types
│   └── App.tsx                  # Main application
├── vite.config.ts               # Vite configuration
└── package.json
```

## Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the root directory:
```bash
cd ..  # if you're still in backend/
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

You need to run both the backend and frontend servers.

### 1. Start the Backend Server

In the `backend/` directory with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 2. Start the Frontend Dev Server

In the root directory:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Upload an Image**: Drag and drop an image, click to browse, or paste (Ctrl+V) an image from your clipboard
2. **View Metadata**: See the original file size, resolution, and format
3. **Set Target Size**: Enter your desired file size in MB (must be smaller than original)
4. **Choose Format**: Select output format (Auto recommended) - WebP, JPEG, or PNG
5. **Preview Results**: Click "Preview Results" to see estimated output
6. **Compress**: Click "Compress" to process the image
7. **Download**: Download your compressed image

## API Endpoints

### `POST /api/inspect`
Get image metadata
- **Input**: Multipart file upload
- **Output**: JSON with filename, format, size, dimensions, EXIF info

### `POST /api/estimate`
Estimate compression results
- **Input**: Multipart file + JSON params (target_bytes, output_format, etc.)
- **Output**: JSON with predicted dimensions, size, format, and warnings

### `POST /api/compress`
Compress image and return file
- **Input**: Multipart file + JSON params
- **Output**: Binary image file with metadata in headers

## Compression Algorithm

The backend uses an intelligent compression strategy:

1. **Format Selection**: Automatically chooses the best format (WebP for aggressive compression, preserves format when possible)
2. **Progressive Resizing**: Tries multiple resize scales (100%, 90%, 80%, 70%, 60%, 50%)
3. **Quality Binary Search**: For lossy formats (JPEG/WebP), performs binary search on quality settings (40-95)
4. **Best Effort**: Returns the closest result with warnings if exact target cannot be met

## Privacy & Security

- **100% Local Processing**: Images are processed locally on your machine
- **No Cloud Uploads**: Your images never leave your device
- **No Data Collection**: No analytics, tracking, or data collection
- **Open Source**: Full source code available for review

## Supported Formats

### Input
- JPEG/JPG
- PNG
- WebP

### Output
- JPEG (lossy, good compression)
- PNG (lossless, larger files)
- WebP (recommended, best compression)

## Development

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
uvicorn app.main:app --reload    # Development server
uvicorn app.main:app --host 0.0.0.0 --port 8000    # Production server
```

## Future Enhancements

- [ ] Batch compression support
- [ ] HEIC format support
- [ ] Animated GIF support
- [ ] Advanced quality controls
- [ ] Image cropping/editing
- [ ] Comparison view (before/after)
- [ ] Download as ZIP for batch operations

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [Pillow](https://pillow.readthedocs.io/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
