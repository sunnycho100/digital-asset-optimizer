import { useState, useEffect } from "react";
import { Download, RotateCcw } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { PreviewCard } from "@/components/PreviewCard";
import { MetadataPanel } from "@/components/MetadataPanel";
import { CompressionControls } from "@/components/CompressionControls";
import { PredictionPanel } from "@/components/PredictionPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { inspectImage, estimateCompression, compressImage, ApiError } from "@/api/client";
import type { InspectResponse, EstimateRequest, EstimateResponse, CompressResult } from "@/types/api";

export function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<InspectResponse | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [compressedResult, setCompressedResult] = useState<CompressResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string>("");
  const [exifError, setExifError] = useState(false);
  const [pendingCompressParams, setPendingCompressParams] = useState<EstimateRequest | null>(null);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError("");
    setSelectedFile(file);
    setEstimate(null);
    setCompressedResult(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Inspect image
    setIsInspecting(true);
    try {
      const result = await inspectImage(file);
      setMetadata(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to inspect image";
      setError(message);
      setMetadata(null);
    } finally {
      setIsInspecting(false);
    }
  };

  // Handle estimate
  const handleEstimate = async (params: EstimateRequest) => {
    if (!selectedFile) return;

    setError("");
    setIsEstimating(true);
    setEstimate(null);

    try {
      const result = await estimateCompression(selectedFile, params);
      setEstimate(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to estimate compression";
      setError(message);
    } finally {
      setIsEstimating(false);
    }
  };

  // Handle compression
  const handleCompress = async (params: EstimateRequest) => {
    if (!selectedFile) return;

    setError("");
    setExifError(false);
    setPendingCompressParams(null);
    setIsCompressing(true);
    setCompressedResult(null);

    try {
      const result = await compressImage(selectedFile, params);
      setCompressedResult(result);
      
      // Also update estimate to show actual results
      setEstimate({
        predicted_width: result.width,
        predicted_height: result.height,
        estimated_size_bytes: result.size_bytes,
        chosen_format: result.format,
        warnings: result.warnings,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to compress image";
      
      // Check if it's an EXIF-related error
      if (message.includes("special characters in metadata") || message.includes("encoding issues")) {
        setExifError(true);
        setPendingCompressParams(params);
      }
      
      setError(message);
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle retry compression with EXIF stripping
  const handleRetryWithoutExif = async () => {
    if (!pendingCompressParams || !selectedFile) return;

    setError("");
    setExifError(false);
    setIsCompressing(true);

    try {
      const params = { ...pendingCompressParams, strip_exif: true };
      const result = await compressImage(selectedFile, params);
      setCompressedResult(result);
      setPendingCompressParams(null);
      
      // Also update estimate to show actual results
      setEstimate({
        predicted_width: result.width,
        predicted_height: result.height,
        estimated_size_bytes: result.size_bytes,
        chosen_format: result.format,
        warnings: result.warnings,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to compress image";
      setError(message);
      setExifError(false);
      setPendingCompressParams(null);
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!compressedResult) return;

    const url = URL.createObjectURL(compressedResult.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = compressedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle reset
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setMetadata(null);
    setEstimate(null);
    setCompressedResult(null);
    setError("");
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Enable paste anywhere on the page
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!selectedFile) {
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile();
              if (file) {
                handleFileSelect(file);
                break;
              }
            }
          }
        }
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [selectedFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="relative mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Image Compressor
            </h1>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="whitespace-nowrap"
              >
                Image Type Converter (in progress)
              </Button>
            </div>
            <div className="sm:hidden mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="whitespace-nowrap"
              >
                Image Type Converter (in progress)
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            Privacy-preserving local image compression tool
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {!selectedFile ? (
              <DropZone onFileSelect={handleFileSelect} />
            ) : (
              <>
                <PreviewCard imageUrl={previewUrl} fileName={selectedFile.name} />
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full text-base py-6"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Start Over
                </Button>
                {metadata && <MetadataPanel metadata={metadata} />}
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {isInspecting && (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Analyzing image...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <p className="text-sm text-red-800">{error}</p>
                  {exifError && (
                    <>
                      <p className="text-sm text-red-700 mt-3">
                        Press Continue to remove EXIF data and compress
                      </p>
                      <Button 
                        onClick={handleRetryWithoutExif}
                        className="mt-3 w-full"
                        variant="destructive"
                        disabled={isCompressing}
                      >
                        {isCompressing ? "Processing..." : "Continue"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {metadata && (
              <>
                <CompressionControls
                  originalSizeBytes={metadata.size_bytes}
                  onEstimate={handleEstimate}
                  onCompress={handleCompress}
                  isEstimating={isEstimating}
                  isCompressing={isCompressing}
                />

                {estimate && (
                  <PredictionPanel
                    estimate={estimate}
                    originalWidth={metadata.width}
                    originalHeight={metadata.height}
                    originalSizeBytes={metadata.size_bytes}
                  />
                )}

                {compressedResult && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Compression Complete!
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Ready to download
                          </p>
                        </div>
                        <Button onClick={handleDownload} size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>All processing happens locally. Your images never leave your device.</p>
          <p className="mt-2">
            <a 
              href="mailto:shcho1551@gmail.com?subject=Image%20Compressor%20Inquiry"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Contact Us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;