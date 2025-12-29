export interface InspectResponse {
  original_filename: string;
  format: string;
  size_bytes: number;
  width: number;
  height: number;
  has_exif: boolean;
}

export interface EstimateRequest {
  target_bytes: number;
  output_format: "auto" | "jpeg" | "png" | "webp";
  max_dim?: number;
  quality_mode: "auto" | "manual";
  quality?: number;
  priority: "target_size" | "optimal_resolution";
  strip_exif?: boolean;
}

export interface EstimateResponse {
  predicted_width: number;
  predicted_height: number;
  estimated_size_bytes: number;
  chosen_format: string;
  warnings: string[];
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  size_bytes: number;
  format: string;
  warnings: string[];
  filename: string;
}
