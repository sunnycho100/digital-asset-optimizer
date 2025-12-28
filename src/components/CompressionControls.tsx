import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { EstimateRequest } from "@/types/api";

interface CompressionControlsProps {
  originalSizeBytes: number;
  onEstimate: (params: EstimateRequest) => void;
  onCompress: (params: EstimateRequest) => void;
  isEstimating: boolean;
  isCompressing: boolean;
  disabled?: boolean;
}

export function CompressionControls({
  originalSizeBytes,
  onEstimate,
  onCompress,
  isEstimating,
  isCompressing,
  disabled,
}: CompressionControlsProps) {
  const [targetMB, setTargetMB] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<"auto" | "jpeg" | "png" | "webp">("jpeg");
  const [error, setError] = useState<string>("");

  const originalMB = originalSizeBytes / (1024 * 1024);

  useEffect(() => {
    // Clear error when target changes
    if (error) {
      validateTarget(targetMB);
    }
  }, [targetMB]);

  const validateTarget = (value: string): boolean => {
    setError("");

    if (!value || value.trim() === "") {
      setError("Target size is required");
      return false;
    }

    const targetValue = parseFloat(value);

    if (isNaN(targetValue)) {
      setError("Target size must be a valid number");
      return false;
    }

    if (targetValue <= 0) {
      setError("Target size must be greater than 0");
      return false;
    }

    const targetBytes = targetValue * 1024 * 1024;
    if (targetBytes >= originalSizeBytes) {
      setError(`Target size must be smaller than original (${originalMB.toFixed(2)} MB)`);
      return false;
    }

    return true;
  };

  const buildParams = (): EstimateRequest | null => {
    if (!validateTarget(targetMB)) {
      return null;
    }

    const targetBytes = Math.floor(parseFloat(targetMB) * 1024 * 1024);

    return {
      target_bytes: targetBytes,
      output_format: outputFormat,
      quality_mode: "auto",
    };
  };

  const handleEstimate = () => {
    const params = buildParams();
    if (params) {
      onEstimate(params);
    }
  };

  const handleCompress = () => {
    const params = buildParams();
    if (params) {
      onCompress(params);
    }
  };

  const isFormValid = targetMB.trim() !== "" && !error;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compression Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="target-size">Target Size (MB)</Label>
          <Input
            id="target-size"
            type="number"
            step="0.01"
            min="0.01"
            max={originalMB}
            placeholder={`Max: ${originalMB.toFixed(2)} MB`}
            value={targetMB}
            onChange={(e) => setTargetMB(e.target.value)}
            disabled={disabled}
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="output-format">Output Format</Label>
          <Select
            value={outputFormat}
            onValueChange={(value) => setOutputFormat(value as typeof outputFormat)}
            disabled={disabled}
          >
            <option value="jpeg">JPEG (Default)</option>
            <option value="webp">WebP (Best Compression)</option>
            <option value="png">PNG (Lossless)</option>
            <option value="auto">Auto</option>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleEstimate}
            disabled={!isFormValid || disabled || isEstimating || isCompressing}
            variant="outline"
            className="flex-1"
          >
            {isEstimating ? "Estimating..." : "Preview Results"}
          </Button>
          <Button
            onClick={handleCompress}
            disabled={!isFormValid || disabled || isEstimating || isCompressing}
            className="flex-1"
          >
            {isCompressing ? "Compressing..." : "Compress"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
