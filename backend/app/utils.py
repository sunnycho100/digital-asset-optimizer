from PIL import Image
from io import BytesIO


def calculate_minimum_achievable_size(image_bytes: bytes) -> int:
    """
    Calculate a rough estimate of the minimum achievable size for an image.
    This is based on typical compression ratios for different image types.
    """
    try:
        img = Image.open(BytesIO(image_bytes))
        original_size = len(image_bytes)
        
        # Base minimum ratio (5% for most images)
        min_ratio = 0.05
        
        # Adjust based on image characteristics
        # Complex images (photos) can compress more than simple graphics
        if img.mode in ('RGBA', 'LA'):
            # Transparency adds complexity
            min_ratio = 0.08
        elif img.format == 'PNG':
            # PNG is already compressed
            min_ratio = 0.10
        
        # For very small images, the overhead is significant
        if original_size < 50000:  # < 50KB
            min_ratio = 0.15
        
        return int(original_size * min_ratio)
    except:
        # Fallback to conservative estimate
        return int(len(image_bytes) * 0.05)


def get_image_info(image_bytes: bytes) -> dict:
    """Extract metadata from image bytes."""
    img = Image.open(BytesIO(image_bytes))
    
    return {
        "format": img.format or "UNKNOWN",
        "width": img.width,
        "height": img.height,
        "mode": img.mode,
        "has_exif": "exif" in img.info
    }


def convert_image_to_bytes(img: Image.Image, format: str, quality: int = 85, **kwargs) -> bytes:
    """Convert PIL Image to bytes with specified format and quality."""
    output = BytesIO()
    
    save_kwargs = {}
    
    if format.upper() in ["JPEG", "JPG"]:
        # Convert RGBA to RGB for JPEG
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = background
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
        format = "JPEG"
    elif format.upper() == "PNG":
        save_kwargs["optimize"] = True
    elif format.upper() == "WEBP":
        save_kwargs["quality"] = quality
        save_kwargs["method"] = 6  # Best compression
    
    img.save(output, format=format, **save_kwargs)
    return output.getvalue()


def estimate_size_for_quality(img: Image.Image, format: str, quality: int) -> int:
    """Estimate output size for given quality without saving permanently."""
    compressed_bytes = convert_image_to_bytes(img, format, quality)
    return len(compressed_bytes)
