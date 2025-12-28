import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingDown, Maximize2, FileText, AlertTriangle } from "lucide-react";
import type { EstimateResponse } from "@/types/api";

interface PredictionPanelProps {
  estimate: EstimateResponse;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function PredictionPanel({
  estimate,
  originalWidth,
  originalHeight,
  originalSizeBytes,
}: PredictionPanelProps) {
  const compressionRatio = ((1 - estimate.estimated_size_bytes / originalSizeBytes) * 100).toFixed(1);
  const resolutionChanged =
    estimate.predicted_width !== originalWidth || estimate.predicted_height !== originalHeight;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-blue-600" />
          Predicted Output
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 mt-0.5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Estimated Size</p>
            <p className="text-sm text-gray-600">
              {formatBytes(estimate.estimated_size_bytes)}
              <Badge variant="outline" className="ml-2 text-xs">
                -{compressionRatio}%
              </Badge>
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <Maximize2 className="w-4 h-4 mt-0.5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Predicted Resolution</p>
            <p className="text-sm text-gray-600">
              {estimate.predicted_width} × {estimate.predicted_height} pixels
              {resolutionChanged && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Resized
                </Badge>
              )}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <div className="w-4 h-4 mt-0.5 text-blue-600 font-bold text-xs flex items-center justify-center">
            F
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Output Format</p>
            <p className="text-sm text-gray-600">{estimate.chosen_format}</p>
          </div>
        </div>

        {estimate.warnings && estimate.warnings.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {estimate.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
