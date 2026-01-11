import { useState, useEffect } from "react";
import { RotateCcw, Download, CheckCircle } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { PreviewCard } from "@/components/PreviewCard";
import { MetadataPanel } from "@/components/MetadataPanel";
import { ConversionControls } from "@/components/ConversionControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { inspectImage, convertImage, ApiError } from "@/api/client";
import type { InspectResponse, ConvertResult } from "@/types/api";

export function ImageTypeConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<InspectResponse | null>(null);
  const [convertedResult, setConvertedResult] = useState<ConvertResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>("");

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError("");
    setSelectedFile(file);
    setConvertedResult(null);

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

  // Handle conversion
  const handleConvert = async (outputFormat: string, stripExif: boolean) => {
    if (!selectedFile) return;

    setError("");
    setIsConverting(true);
    setConvertedResult(null);

    try {
      const result = await convertImage(selectedFile, outputFormat, stripExif);
      setConvertedResult(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to convert image";
      setError(message);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!convertedResult) return;

    const url = URL.createObjectURL(convertedResult.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = convertedResult.filename;
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
    setConvertedResult(null);
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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
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
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-4">
                <p className="text-sm text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {selectedFile && metadata && (
            <ConversionControls
              originalFormat={metadata.format}
              onConvert={handleConvert}
              isConverting={isConverting}
              disabled={isInspecting}
            />
          )}

          {convertedResult && (
            <>
              {/* Success Message */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-green-900">
                        Conversion Successful!
                      </p>
                      <div className="text-xs text-green-800 space-y-1">
                        <div className="flex justify-between">
                          <span>Format:</span>
                          <span className="font-medium">{metadata?.format} → {convertedResult.format}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resolution:</span>
                          <span className="font-medium">
                            {convertedResult.width} × {convertedResult.height}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>File Size:</span>
                          <span className="font-medium">{formatBytes(convertedResult.size_bytes)}</span>
                        </div>
                      </div>
                      {convertedResult.warnings.length > 0 && (
                        <div className="pt-2 border-t border-green-200">
                          <p className="text-xs font-medium text-green-900 mb-1">Notes:</p>
                          {convertedResult.warnings.map((warning, idx) => (
                            <p key={idx} className="text-xs text-green-700">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                className="w-full text-base py-6"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Converted Image
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
