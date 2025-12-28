from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional
import json

from .models import InspectResponse, EstimateRequest, EstimateResponse, CompressResponse
from .utils import get_image_info
from .compress import compress_to_target, estimate_compression

app = FastAPI(title="Image Compressor API")

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Image Compressor API is running"}


@app.post("/api/inspect", response_model=InspectResponse)
async def inspect_image(file: UploadFile = File(...)):
    """
    Inspect uploaded image and return metadata.
    """
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        info = get_image_info(image_bytes)
        
        return InspectResponse(
            original_filename=file.filename or "unknown",
            format=info["format"],
            size_bytes=len(image_bytes),
            width=info["width"],
            height=info["height"],
            has_exif=info["has_exif"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")


@app.post("/api/estimate", response_model=EstimateResponse)
async def estimate_image(
    file: UploadFile = File(...),
    params: str = Form(...)
):
    """
    Estimate compression results without producing final output.
    """
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Parse params JSON
        params_dict = json.loads(params)
        request = EstimateRequest(**params_dict)
        
        # Validate target is smaller than original
        if request.target_bytes >= len(image_bytes):
            raise HTTPException(
                status_code=400,
                detail=f"Target size ({request.target_bytes} bytes) must be smaller than original ({len(image_bytes)} bytes)"
            )
        
        # Perform estimation
        width, height, estimated_size, chosen_format, warnings = estimate_compression(
            image_bytes,
            request.target_bytes,
            request.output_format,
            request.max_dim,
            request.quality_mode,
            request.quality
        )
        
        return EstimateResponse(
            predicted_width=width,
            predicted_height=height,
            estimated_size_bytes=estimated_size,
            chosen_format=chosen_format,
            warnings=warnings
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in params")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to estimate: {str(e)}")


@app.post("/api/compress")
async def compress_image(
    file: UploadFile = File(...),
    params: str = Form(...)
):
    """
    Compress image to target size and return binary file.
    """
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Parse params JSON
        params_dict = json.loads(params)
        request = EstimateRequest(**params_dict)
        
        # Validate target is smaller than original
        if request.target_bytes >= len(image_bytes):
            raise HTTPException(
                status_code=400,
                detail=f"Target size ({request.target_bytes} bytes) must be smaller than original ({len(image_bytes)} bytes)"
            )
        
        # Perform compression
        compressed_bytes, width, height, chosen_format, warnings = compress_to_target(
            image_bytes,
            request.target_bytes,
            request.output_format,
            request.max_dim,
            request.quality_mode,
            request.quality
        )
        
        # Determine file extension
        ext_map = {
            "JPEG": "jpg",
            "PNG": "png",
            "WEBP": "webp"
        }
        ext = ext_map.get(chosen_format, "jpg")
        
        # Generate filename
        original_name = file.filename or "image"
        name_without_ext = original_name.rsplit(".", 1)[0] if "." in original_name else original_name
        size_mb = len(compressed_bytes) / (1024 * 1024)
        new_filename = f"{name_without_ext}_compressed_{size_mb:.2f}MB.{ext}"
        
        # Determine content type
        content_type_map = {
            "JPEG": "image/jpeg",
            "PNG": "image/png",
            "WEBP": "image/webp"
        }
        content_type = content_type_map.get(chosen_format, "application/octet-stream")
        
        # Return compressed image with metadata in headers
        return Response(
            content=compressed_bytes,
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{new_filename}"',
                "X-Width": str(width),
                "X-Height": str(height),
                "X-Size-Bytes": str(len(compressed_bytes)),
                "X-Format": chosen_format,
                "X-Warnings": json.dumps(warnings)
            }
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in params")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to compress: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
