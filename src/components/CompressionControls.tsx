import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
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
  const [priority, setPriority] = useState<"target_size" | "optimal_resolution">("target_size");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      priority: priority,
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
          <Label>Priority</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value="target_size"
                checked={priority === "target_size"}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                disabled={disabled}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Target Size</span>
                <p className="text-xs text-gray-500">Get as close to target size as possible</p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value="optimal_resolution"
                checked={priority === "optimal_resolution"}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                disabled={disabled}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="text-sm font-medium">Optimal Resolution</span>
                <p className="text-xs text-gray-500">Preserve resolution, may be smaller than target</p>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
            disabled={disabled}
          >
            <span>Advanced Options</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4">
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
                <p className="text-xs text-gray-500">
                  Choose the output file format for the compressed image
                </p>
              </div>
            </div>
          )}
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
