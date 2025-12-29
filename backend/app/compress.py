from PIL import Image
from io import BytesIO
from typing import Tuple, Optional
from .utils import convert_image_to_bytes, estimate_size_for_quality


def choose_output_format(
    img: Image.Image,
    original_format: str,
    target_bytes: int,
    current_size: int,
    requested_format: str = "auto"
) -> Tuple[str, list]:
    """Choose the best output format based on target and image characteristics."""
    warnings = []
    
    if requested_format != "auto":
        return requested_format.upper(), warnings
    
    has_transparency = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    
    # If target is much smaller than original and has no transparency, prefer WebP or JPEG
    compression_ratio = target_bytes / current_size if current_size > 0 else 1
    
    if compression_ratio < 0.5:  # Aggressive compression needed
        if has_transparency:
            warnings.append("Image has transparency. Using WebP for lossy compression.")
            return "WEBP", warnings
        else:
            return "WEBP", warnings
    
    # For less aggressive compression, keep format if possible
    if original_format.upper() in ["JPEG", "JPG"]:
        return "JPEG", warnings
    elif original_format.upper() == "WEBP":
        return "WEBP", warnings
    elif original_format.upper() == "PNG":
        if has_transparency:
            warnings.append("PNG with transparency may not reach target size. Consider WebP.")
            return "PNG", warnings
        else:
            # Suggest WebP for better compression
            return "WEBP", warnings
    
    return "WEBP", warnings


def calculate_resize_dimensions(
    original_width: int,
    original_height: int,
    max_dim: Optional[int] = None,
    scale_factor: float = 1.0
) -> Tuple[int, int]:
    """Calculate new dimensions based on scale factor and max dimension constraint."""
    new_width = int(original_width * scale_factor)
    new_height = int(original_height * scale_factor)
    
    if max_dim and max(new_width, new_height) > max_dim:
        if new_width > new_height:
            scale = max_dim / new_width
        else:
            scale = max_dim / new_height
        new_width = int(new_width * scale)
        new_height = int(new_height * scale)
    
    # Ensure dimensions are at least 1
    return max(1, new_width), max(1, new_height)


def compress_to_target(
    image_bytes: bytes,
    target_bytes: int,
    output_format: str = "auto",
    max_dim: Optional[int] = None,
    quality_mode: str = "auto",
    manual_quality: Optional[int] = None,
    priority: str = "target_size",
    strip_exif: bool = False
) -> Tuple[bytes, int, int, str, list]:
    """
    Compress image to target size using binary search and progressive resizing.
    
    priority: "target_size" = get as close to target as possible without going over
              "optimal_resolution" = preserve resolution, even if result is much smaller
    
    Returns: (compressed_bytes, width, height, format, warnings)
    """
    img = Image.open(BytesIO(image_bytes))
    original_width, original_height = img.size
    original_size = len(image_bytes)
    original_format = img.format or "UNKNOWN"
    
    warnings = []
    
    # Choose output format
    chosen_format, format_warnings = choose_output_format(
        img, original_format, target_bytes, original_size, output_format
    )
    warnings.extend(format_warnings)
    
    # If already under target with same format
    if original_size <= target_bytes and chosen_format == original_format.upper():
        return image_bytes, original_width, original_height, chosen_format, warnings
    
    # Try different resize scales based on priority
    if priority == "optimal_resolution":
        # Preserve resolution, only reduce quality
        resize_scales = [1.0]
    else:
        # Try progressive resizing for target size priority
        resize_scales = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5]
    
    best_result = None
    best_size = float('inf')
    best_distance_from_target = float('inf')
    
    for scale in resize_scales:
        # Calculate new dimensions
        new_width, new_height = calculate_resize_dimensions(
            original_width, original_height, max_dim, scale
        )
        
        # Resize image if scale < 1.0
        if scale < 1.0:
            working_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        else:
            working_img = img.copy()
        
        # Binary search for quality (only for lossy formats)
        if chosen_format in ["JPEG", "WEBP"]:
            if quality_mode == "manual" and manual_quality is not None:
                quality = manual_quality
                compressed = convert_image_to_bytes(working_img, chosen_format, quality, strip_exif=strip_exif)
                size = len(compressed)
                
                if size <= target_bytes:
                    distance = target_bytes - size
                    if distance < best_distance_from_target:
                        best_result = (compressed, new_width, new_height)
                        best_size = size
                        best_distance_from_target = distance
            else:
                # Binary search quality to find closest to target
                low_q, high_q = 40, 95
                scale_best_result = None
                scale_best_distance = float('inf')
                
                for _ in range(10):  # More iterations for better accuracy
                    mid_q = (low_q + high_q) // 2
                    compressed = convert_image_to_bytes(working_img, chosen_format, mid_q, strip_exif=strip_exif)
                    size = len(compressed)
                    
                    if size <= target_bytes:
                        distance = target_bytes - size
                        # For target_size priority, prefer closer to target
                        # For optimal_resolution priority, just need to be under target
                        if distance < scale_best_distance:
                            scale_best_result = (compressed, new_width, new_height, size)
                            scale_best_distance = distance
                        low_q = mid_q + 1
                    else:
                        high_q = mid_q - 1
                
                # Update global best if this scale produced better result
                if scale_best_result and scale_best_distance < best_distance_from_target:
                    compressed, w, h, size = scale_best_result
                    best_result = (compressed, w, h)
                    best_size = size
                    best_distance_from_target = scale_best_distance
                
                # For target_size priority, stop if we're very close to target (within 5%)
                if priority == "target_size" and best_distance_from_target < target_bytes * 0.05:
                    break
                
                # For optimal_resolution, stop after first scale if we found something
                if priority == "optimal_resolution" and best_result:
                    break
        else:
            # PNG - lossless, just try optimize
            compressed = convert_image_to_bytes(working_img, chosen_format, quality=95, strip_exif=strip_exif)
            size = len(compressed)
            
            if size < best_size:
                best_result = (compressed, new_width, new_height)
                best_size = size
                
            if size <= target_bytes:
                break
    
    if best_result is None:
        # Fallback: use smallest scale with lowest quality
        new_width, new_height = calculate_resize_dimensions(
            original_width, original_height, max_dim, 0.5
        )
        working_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        compressed = convert_image_to_bytes(working_img, chosen_format, quality=40, strip_exif=strip_exif)
        best_result = (compressed, new_width, new_height)
        warnings.append("Could not reach target size. This is the best effort result.")
    elif best_size > target_bytes:
        warnings.append(f"Could not reach exact target. Output is {best_size} bytes (target was {target_bytes}).")
    
    compressed_bytes, final_width, final_height = best_result
    
    return compressed_bytes, final_width, final_height, chosen_format, warnings


def estimate_compression(
    image_bytes: bytes,
    target_bytes: int,
    output_format: str = "auto",
    max_dim: Optional[int] = None,
    quality_mode: str = "auto",
    manual_quality: Optional[int] = None,
    priority: str = "target_size",
    strip_exif: bool = False
) -> Tuple[int, int, int, str, list]:
    """
    Estimate compression results without returning the full compressed bytes.
    
    Returns: (predicted_width, predicted_height, estimated_size, format, warnings)
    """
    # For estimation, we actually compress but return metadata only
    compressed_bytes, width, height, format, warnings = compress_to_target(
        image_bytes, target_bytes, output_format, max_dim, quality_mode, manual_quality, priority, strip_exif
    )
    
    return width, height, len(compressed_bytes), format, warnings
