import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Image as ImageIcon, Maximize2 } from "lucide-react";
import type { InspectResponse } from "@/types/api";

interface MetadataPanelProps {
  metadata: InspectResponse;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Image Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 mt-0.5 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700">File Size</p>
            <p className="text-sm text-gray-600">
              {formatBytes(metadata.size_bytes)}
              <span className="ml-1 text-xs text-gray-400">
                ({metadata.size_bytes.toLocaleString()} bytes)
              </span>
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <Maximize2 className="w-4 h-4 mt-0.5 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Resolution</p>
            <p className="text-sm text-gray-600">
              {metadata.width} × {metadata.height} pixels
              <span className="ml-1 text-xs text-gray-400">
                ({((metadata.width * metadata.height) / 1_000_000).toFixed(2)} MP)
              </span>
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <ImageIcon className="w-4 h-4 mt-0.5 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Format</p>
            <p className="text-sm text-gray-600">{metadata.format}</p>
          </div>
        </div>

        {metadata.has_exif && (
          <>
            <Separator />
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
              <span className="font-medium">EXIF data present</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
