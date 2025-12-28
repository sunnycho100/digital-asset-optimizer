import type { InspectResponse, EstimateRequest, EstimateResponse, CompressResult } from "@/types/api";

// Use relative URL to leverage Vite proxy in development
// In production, you can set VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }
  return response.json();
}

export async function inspectImage(file: File): Promise<InspectResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/inspect`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<InspectResponse>(response);
}

export async function estimateCompression(
  file: File,
  params: EstimateRequest
): Promise<EstimateResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("params", JSON.stringify(params));

  const response = await fetch(`${API_BASE_URL}/api/estimate`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<EstimateResponse>(response);
}

export async function compressImage(
  file: File,
  params: EstimateRequest
): Promise<CompressResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("params", JSON.stringify(params));

  const response = await fetch(`${API_BASE_URL}/api/compress`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Compression failed");
  }

  const blob = await response.blob();
  const width = parseInt(response.headers.get("X-Width") || "0", 10);
  const height = parseInt(response.headers.get("X-Height") || "0", 10);
  const size_bytes = parseInt(response.headers.get("X-Size-Bytes") || "0", 10);
  const format = response.headers.get("X-Format") || "JPEG";
  const warningsHeader = response.headers.get("X-Warnings");
  const warnings = warningsHeader ? JSON.parse(warningsHeader) : [];
  
  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "compressed_image.jpg";
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  return {
    blob,
    width,
    height,
    size_bytes,
    format,
    warnings,
    filename,
  };
}
