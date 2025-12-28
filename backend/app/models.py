from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class InspectResponse(BaseModel):
    original_filename: str
    format: str
    size_bytes: int
    width: int
    height: int
    has_exif: bool = False


class EstimateRequest(BaseModel):
    target_bytes: int = Field(gt=0)
    output_format: Literal["auto", "jpeg", "png", "webp"] = "auto"
    max_dim: Optional[int] = None
    quality_mode: Literal["auto", "manual"] = "auto"
    quality: Optional[int] = Field(default=None, ge=1, le=100)
    priority: Literal["target_size", "optimal_resolution"] = "target_size"


class EstimateResponse(BaseModel):
    predicted_width: int
    predicted_height: int
    estimated_size_bytes: int
    chosen_format: str
    warnings: List[str] = []


class CompressResponse(BaseModel):
    width: int
    height: int
    size_bytes: int
    format: str
