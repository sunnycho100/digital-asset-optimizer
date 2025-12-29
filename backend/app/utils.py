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


def convert_image_to_bytes(img: Image.Image, format: str, quality: int = 85, strip_exif: bool = False, **kwargs) -> bytes:
    """Convert PIL Image to bytes with specified format and quality."""
    output = BytesIO()
    
    # Create a clean copy without problematic metadata if strip_exif is True
    if strip_exif:
        try:
            # More robust way to strip metadata - convert to numpy-like array and back
            img_array = list(img.getdata())
            clean_img = Image.new(img.mode, img.size)
            clean_img.putdata(img_array)
            img = clean_img
        except Exception:
            # If that fails, try simple copy
            try:
                img = img.copy()
            except:
                pass  # Use original if copy fails
    
    save_kwargs = {}
    
    if format.upper() in ["JPEG", "JPG"]:
        # Convert RGBA to RGB for JPEG
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = background
        elif img.mode not in ("RGB", "L"):
            # Convert any other mode to RGB
            img = img.convert("RGB")
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
        format = "JPEG"
    elif format.upper() == "PNG":
        save_kwargs["optimize"] = True
    elif format.upper() == "WEBP":
        save_kwargs["quality"] = quality
        save_kwargs["method"] = 6  # Best compression
    
    # Save without EXIF and other metadata to avoid encoding issues
    try:
        if strip_exif:
            save_kwargs["exif"] = b""  # Force empty EXIF
        img.save(output, format=format, **save_kwargs)
    except (UnicodeEncodeError, UnicodeDecodeError, LookupError) as e:
        # If encoding fails, strip all metadata and try again
        try:
            save_kwargs.clear()
            if format.upper() in ["JPEG", "JPG"]:
                save_kwargs["quality"] = quality
                save_kwargs["optimize"] = True
            elif format.upper() == "PNG":
                save_kwargs["optimize"] = True
            elif format.upper() == "WEBP":
                save_kwargs["quality"] = quality
                save_kwargs["method"] = 6
            save_kwargs["exif"] = b""
            img.save(output, format=format, **save_kwargs)
        except Exception:
            # Last resort: save with minimal options
            output = BytesIO()
            if format.upper() in ["JPEG", "JPG"]:
                img.save(output, format="JPEG", quality=quality)
            else:
                img.save(output, format=format)
    except Exception as e:
        # Catch any other exceptions and try simple save
        output = BytesIO()
        try:
            if format.upper() in ["JPEG", "JPG"]:
                # Ensure RGB mode for JPEG
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.save(output, format="JPEG", quality=quality)
            else:
                img.save(output, format=format)
        except:
            # Absolute last resort - convert to RGB and save as JPEG
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(output, format="JPEG", quality=quality)
    
    return output.getvalue()


def estimate_size_for_quality(img: Image.Image, format: str, quality: int) -> int:
    """Estimate output size for given quality without saving permanently."""
    compressed_bytes = convert_image_to_bytes(img, format, quality)
    return len(compressed_bytes)
