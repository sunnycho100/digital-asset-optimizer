from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional
import json

from .models import InspectResponse, EstimateRequest, EstimateResponse, CompressResponse
from .utils import get_image_info, calculate_minimum_achievable_size
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
        
        original_size = len(image_bytes)
        target_size = request.target_bytes
        
        # Validate target is smaller than original
        if target_size >= original_size:
            raise HTTPException(
                status_code=400,
                detail=f"Target size must be smaller than original size. Original: {original_size:,} bytes, Target: {target_size:,} bytes"
            )
        
        # Calculate minimum achievable size based on image characteristics
        min_size = calculate_minimum_achievable_size(image_bytes)
        
        if target_size < min_size:
            raise HTTPException(
                status_code=400,
                detail=f"Target size is too small. Original: {original_size:,} bytes ({original_size/1024:.1f} KB), Target: {target_size:,} bytes ({target_size/1024:.2f} KB). Recommended minimum: {min_size:,} bytes ({min_size/1024:.1f} KB)"
            )
        
        # Perform estimation
        width, height, estimated_size, chosen_format, warnings = estimate_compression(
            image_bytes,
            request.target_bytes,
            request.output_format,
            request.max_dim,
            request.quality_mode,
            request.quality,
            request.priority,
            request.strip_exif
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
        # Ensure error message is ASCII-safe to avoid encoding issues
        error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
        raise HTTPException(status_code=400, detail=f"Failed to estimate: {error_msg}")


@app.post("/api/convert")
async def convert_image_format(
    file: UploadFile = File(...),
    output_format: str = Form(...),
    strip_exif: bool = Form(False)
):
    """
    Convert image to specified format.
    """
    try:
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Open image
        from PIL import Image
        from io import BytesIO
        from .utils import convert_image_to_bytes
        
        img = Image.open(BytesIO(image_bytes))
        
        # Validate format
        valid_formats = ["jpeg", "png", "webp", "bmp", "gif", "tiff"]
        if output_format.lower() not in valid_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid output format. Supported formats: {', '.join(valid_formats)}"
            )
        
        # Convert format
        warnings = []
        format_upper = output_format.upper()
        
        # Handle format-specific conversions
        if format_upper == "JPEG" and img.mode in ("RGBA", "LA", "P"):
            warnings.append("Image has transparency. Converting to RGB with white background.")
            if img.mode == "P":
                img = img.convert("RGBA")
            rgb_img = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode in ("RGBA", "LA"):
                rgb_img.paste(img, mask=img.split()[-1])
            else:
                rgb_img.paste(img)
            img = rgb_img
        elif format_upper in ["PNG", "WEBP"] and img.mode not in ["RGB", "RGBA"]:
            # Convert to RGBA for PNG/WebP if needed
            if img.mode in ["L", "LA"]:
                img = img.convert("LA")
            elif "transparency" in img.info or img.mode == "P":
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")
        
        # Convert image to bytes
        quality = 95 if format_upper != "PNG" else None
        converted_bytes = convert_image_to_bytes(
            img,
            format_upper,
            quality=quality or 95,
            strip_exif=strip_exif
        )
        
        # Generate filename
        original_name = file.filename or "image"
        name_without_ext = original_name.rsplit(".", 1)[0]
        ext_map = {
            "JPEG": "jpg",
            "PNG": "png",
            "WEBP": "webp",
            "BMP": "bmp",
            "GIF": "gif",
            "TIFF": "tiff"
        }
        new_filename = f"{name_without_ext}_converted.{ext_map.get(format_upper, format_upper.lower())}"
        
        # Prepare response headers
        headers = {
            "Content-Disposition": f'attachment; filename="{new_filename}"',
            "X-Width": str(img.width),
            "X-Height": str(img.height),
            "X-Size-Bytes": str(len(converted_bytes)),
            "X-Format": format_upper,
            "X-Warnings": json.dumps(warnings)
        }
        
        media_type_map = {
            "JPEG": "image/jpeg",
            "PNG": "image/png",
            "WEBP": "image/webp",
            "BMP": "image/bmp",
            "GIF": "image/gif",
            "TIFF": "image/tiff"
        }
        
        return Response(
            content=converted_bytes,
            media_type=media_type_map.get(format_upper, "application/octet-stream"),
            headers=headers
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
        raise HTTPException(status_code=400, detail=f"Failed to convert image: {error_msg}")


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
        
        original_size = len(image_bytes)
        target_size = request.target_bytes
        
        # Validate target is smaller than original
        if target_size >= original_size:
            raise HTTPException(
                status_code=400,
                detail=f"Target size must be smaller than original size. Original: {original_size:,} bytes, Target: {target_size:,} bytes"
            )
        
        # Calculate minimum achievable size based on image characteristics
        min_size = calculate_minimum_achievable_size(image_bytes)
        
        if target_size < min_size:
            raise HTTPException(
                status_code=400,
                detail=f"Target size is too small. Original: {original_size:,} bytes ({original_size/1024:.1f} KB), Target: {target_size:,} bytes ({target_size/1024:.2f} KB). Recommended minimum: {min_size:,} bytes ({min_size/1024:.1f} KB)"
            )
        
        # Perform compression
        try:
            compressed_bytes, width, height, chosen_format, warnings = compress_to_target(
                image_bytes,
                request.target_bytes,
                request.output_format,
                request.max_dim,
                request.quality_mode,
                request.quality,
                request.priority,
                request.strip_exif
            )
        except (UnicodeEncodeError, UnicodeDecodeError, LookupError) as encoding_error:
            # If encoding fails even with strip_exif, try forcing JPEG format
            # JPEG is more lenient with encoding issues and doesn't support EXIF the same way
            if request.strip_exif and request.output_format != "jpeg":
                try:
                    compressed_bytes, width, height, chosen_format, warnings = compress_to_target(
                        image_bytes,
                        request.target_bytes,
                        "jpeg",  # Force JPEG format
                        request.max_dim,
                        request.quality_mode,
                        request.quality,
                        request.priority,
                        True  # Keep strip_exif=True
                    )
                    # Add warning that format was changed
                    if "Automatically converted to JPEG to resolve encoding issues" not in warnings:
                        warnings.append("Automatically converted to JPEG to resolve encoding issues")
                except Exception as retry_error:
                    # If still fails, re-raise original error
                    raise HTTPException(
                        status_code=400,
                        detail="Unable to compress this image due to encoding issues. Try removing metadata or converting the image format first."
                    )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unable to compress this image due to encoding issues. Try removing metadata or converting the image format first."
                )
        except Exception as general_error:
            # Catch any other errors during compression
            error_msg = str(general_error)
            if 'codec' in error_msg.lower() or 'encode' in error_msg.lower() or 'unicode' in error_msg.lower():
                # This is an encoding issue, suggest stripping EXIF
                if not request.strip_exif:
                    raise HTTPException(
                        status_code=400,
                        detail="Unable to compress this image due to special characters in metadata. Try removing EXIF data or converting the image format first."
                    )
                else:
                    # Already tried stripping, try JPEG conversion as last resort
                    try:
                        compressed_bytes, width, height, chosen_format, warnings = compress_to_target(
                            image_bytes,
                            request.target_bytes,
                            "jpeg",
                            request.max_dim,
                            request.quality_mode,
                            request.quality,
                            request.priority,
                            True
                        )
                        warnings.append("Automatically converted to JPEG to resolve encoding issues")
                    except:
                        raise HTTPException(
                            status_code=400,
                            detail="Unable to compress this image. Please try a different image or format."
                        )
            else:
                # Re-raise for other types of errors
                raise
        
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
        new_filename = f"{name_without_ext}_new.{ext}"
        
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
    except UnicodeEncodeError:
        raise HTTPException(
            status_code=400, 
            detail="Unable to compress this image due to special characters in metadata. Try removing EXIF data or converting the image format first."
        )
    except Exception as e:
        # Check if it's an encoding-related error
        error_str = str(e)
        if 'codec' in error_str.lower() or 'encode' in error_str.lower() or 'unicode' in error_str.lower():
            raise HTTPException(
                status_code=400,
                detail="Unable to compress this image due to encoding issues. Try removing metadata or converting the image format first."
            )
        # Ensure error message is ASCII-safe to avoid encoding issues
        error_msg = error_str.encode('ascii', errors='replace').decode('ascii')
        raise HTTPException(status_code=400, detail=f"Failed to compress: {error_msg}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
