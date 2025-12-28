# Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   React App (Vite)                     │  │
│  │  http://localhost:5173                                 │  │
│  │                                                        │  │
│  │  Components:                                           │  │
│  │  • DropZone (upload UI)                                │  │
│  │  • PreviewCard (image preview)                         │  │
│  │  • MetadataPanel (file info)                           │  │
│  │  • CompressionControls (settings)                      │  │
│  │  • PredictionPanel (estimation)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ (API calls via Vite proxy)
┌─────────────────────────────────────────────────────────────┐
│                   Python Backend (FastAPI)                   │
│                   http://localhost:8000                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                            │  │
│  │  • POST /api/inspect    → Get metadata                │  │
│  │  • POST /api/estimate   → Predict results             │  │
│  │  • POST /api/compress   → Compress & return file      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Compression Engine (Pillow):                         │  │
│  │  • Format selection                                    │  │
│  │  • Progressive resizing                                │  │
│  │  • Quality binary search                               │  │
│  │  • Output generation                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Compressed Image
                            ↓
                    User Downloads
```

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Uploads    │
│   Image     │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 1: Upload & Preview                │
│  ────────────────────────                │
│  • User drops/pastes image               │
│  • Frontend creates preview URL          │
│  • Shows image immediately               │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 2: Inspect Image                   │
│  ────────────────────                    │
│  Frontend → POST /api/inspect            │
│  Backend  → Reads image with Pillow      │
│  Backend  ← Returns metadata             │
│  Frontend ← Displays:                    │
│             • File size                  │
│             • Resolution (W × H)         │
│             • Format                     │
│             • EXIF presence              │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 3: User Sets Preferences           │
│  ────────────────────────                │
│  User enters:                            │
│  • Target size (MB)                      │
│  • Output format (Auto/WebP/JPEG/PNG)    │
│  ✓ Validation happens client-side       │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 4: Preview Results (Optional)      │
│  ────────────────────────────            │
│  Frontend → POST /api/estimate           │
│  Backend  → Runs compression algorithm   │
│  Backend  ← Returns prediction:          │
│             • Predicted dimensions       │
│             • Estimated size             │
│             • Chosen format              │
│             • Warnings                   │
│  Frontend ← Shows estimation panel       │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 5: Compress                        │
│  ────────────────                        │
│  Frontend → POST /api/compress           │
│  Backend  → Compression algorithm:       │
│             1. Choose format             │
│             2. Try resize scales:        │
│                100%, 90%, 80%...         │
│             3. Binary search quality:    │
│                40-95                     │
│             4. Find best result          │
│  Backend  ← Returns compressed bytes     │
│  Frontend ← Shows success + download btn │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Step 6: Download                        │
│  ────────────────                        │
│  • User clicks Download                  │
│  • Browser triggers download             │
│  • File saved with name:                 │
│    "filename_compressed_0.85MB.webp"     │
└─────────────────────────────────────────┘
```

## Compression Algorithm Flow

```
Input: Image File + Target Size
       │
       ↓
┌──────────────────────────┐
│  1. Choose Output Format │
│  ─────────────────────── │
│  • Has transparency?     │
│    → WebP or PNG         │
│  • Aggressive target?    │
│    → WebP                │
│  • Otherwise keep format │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│  2. Try Resize Scales    │
│  ─────────────────────── │
│  For each scale:         │
│  100% → 90% → 80% →      │
│  70% → 60% → 50%         │
│  ├─ Resize image         │
│  └─ Try quality search   │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│  3. Binary Search Quality│
│  ─────────────────────── │
│  Range: 40 to 95         │
│  Max iterations: 8       │
│  ├─ Encode at quality Q  │
│  ├─ Check size           │
│  └─ Adjust Q up/down     │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│  4. Select Best Result   │
│  ─────────────────────── │
│  • Size ≤ target?        │
│    ✓ Return this         │
│  • Size > target?        │
│    ⚠ Best effort + warn  │
└──────┬───────────────────┘
       │
       ↓
   Output: Compressed Image
```

## Component Hierarchy

```
App.tsx
├── Header (title + description)
│
├── Left Column
│   ├── DropZone (if no file)
│   │   └── Upload UI
│   │
│   └── PreviewCard (if file selected)
│       ├── Image preview
│       ├── Filename
│       └── Reset button
│
└── Right Column
    ├── MetadataPanel
    │   ├── File size
    │   ├── Resolution
    │   ├── Format
    │   └── EXIF indicator
    │
    ├── CompressionControls
    │   ├── Target size input
    │   ├── Format selector
    │   ├── Preview button
    │   └── Compress button
    │
    ├── PredictionPanel (after estimate)
    │   ├── Estimated size
    │   ├── Predicted dimensions
    │   ├── Chosen format
    │   └── Warnings
    │
    └── Download Card (after compress)
        └── Download button
```

## State Management Flow

```
App Component State:
├── selectedFile: File | null
├── previewUrl: string
├── metadata: InspectResponse | null
├── estimate: EstimateResponse | null
├── compressedResult: CompressResult | null
├── isInspecting: boolean
├── isEstimating: boolean
├── isCompressing: boolean
└── error: string

State Transitions:
┌─────────────┐
│   IDLE      │  (no file)
└──────┬──────┘
       │ handleFileSelect()
       ↓
┌─────────────┐
│ INSPECTING  │  (loading metadata)
└──────┬──────┘
       │ metadata received
       ↓
┌─────────────┐
│   READY     │  (can configure)
└──────┬──────┘
       │ handleEstimate()
       ↓
┌─────────────┐
│ ESTIMATING  │  (previewing)
└──────┬──────┘
       │ estimate received
       ↓
┌─────────────┐
│  ESTIMATED  │  (showing prediction)
└──────┬──────┘
       │ handleCompress()
       ↓
┌─────────────┐
│COMPRESSING  │  (processing)
└──────┬──────┘
       │ result received
       ↓
┌─────────────┐
│ COMPRESSED  │  (ready to download)
└──────┬──────┘
       │ handleReset()
       ↓
┌─────────────┐
│   IDLE      │
└─────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────┐
│         User Interface              │
│  • shadcn/ui components             │
│  • Tailwind CSS styling             │
│  • Lucide React icons               │
└─────────────┬───────────────────────┘
              │
┌─────────────┴───────────────────────┐
│      Application Layer              │
│  • React 19 components              │
│  • TypeScript type safety           │
│  • State management (useState)      │
└─────────────┬───────────────────────┘
              │
┌─────────────┴───────────────────────┐
│      API Client Layer               │
│  • Fetch API                        │
│  • Error handling                   │
│  • Type-safe requests               │
└─────────────┬───────────────────────┘
              │
┌─────────────┴───────────────────────┐
│      Build & Dev Tools              │
│  • Vite (bundler + dev server)      │
│  • Vite proxy (CORS handling)       │
│  • TypeScript compiler              │
└─────────────┬───────────────────────┘
              │
┌─────────────┴───────────────────────┐
│      Backend API Layer              │
│  • FastAPI endpoints                │
│  • Pydantic validation              │
│  • CORS middleware                  │
└─────────────┬───────────────────────┘
              │
┌─────────────┴───────────────────────┐
│   Image Processing Layer            │
│  • Pillow (PIL Fork)                │
│  • Format conversion                │
│  • Resize algorithms                │
│  • Quality optimization             │
└─────────────────────────────────────┘
```

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Type safety throughout
- ✅ Privacy-preserving (local only)
- ✅ Fast development experience
- ✅ Production-ready code quality
