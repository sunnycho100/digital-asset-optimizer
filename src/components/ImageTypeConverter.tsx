import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { PreviewCard } from "@/components/PreviewCard";
import { MetadataPanel } from "@/components/MetadataPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InspectResponse } from "@/types/api";

export function ImageTypeConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string>("");

  // Handle file selection (disabled for now)
  const handleFileSelect = async (file: File) => {
    // Disabled for now
    setError("Image conversion functionality is coming soon!");
  };

  // Handle reset
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setMetadata(null);
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

  return (
    <>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {!selectedFile ? (
            <DropZone onFileSelect={handleFileSelect} disabled />
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
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <p className="text-sm text-yellow-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Placeholder for conversion controls */}
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">Coming Soon</p>
                <p className="text-sm">
                  Image type conversion functionality is currently under development.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
