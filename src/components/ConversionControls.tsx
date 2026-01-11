import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileImage } from "lucide-react";
import { useState } from "react";

interface ConversionControlsProps {
  originalFormat: string;
  onConvert: (outputFormat: string, stripExif: boolean) => void;
  isConverting: boolean;
  disabled?: boolean;
}

export function ConversionControls({
  originalFormat,
  onConvert,
  isConverting,
  disabled,
}: ConversionControlsProps) {
  const [outputFormat, setOutputFormat] = useState<"jpeg" | "png" | "webp" | "bmp" | "gif" | "tiff">("jpeg");
  const [stripExif, setStripExif] = useState<boolean>(false);

  const handleConvert = () => {
    onConvert(outputFormat, stripExif);
  };

  const formatDescriptions = {
    jpeg: "Lossy compression, great for photos",
    png: "Lossless compression, supports transparency",
    webp: "Modern format, excellent compression",
    bmp: "Uncompressed, large file sizes",
    gif: "Animation support, limited colors",
    tiff: "High quality, professional use"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="output-format">Output Format</Label>
            <span className="text-xs text-gray-500 uppercase font-medium">
              Current: {originalFormat}
            </span>
          </div>
          <select
            id="output-format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as typeof outputFormat)}
            disabled={disabled}
            className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="bmp">BMP</option>
            <option value="gif">GIF</option>
            <option value="tiff">TIFF</option>
          </select>
          <p className="text-xs text-gray-500">
            {formatDescriptions[outputFormat]}
          </p>
        </div>

        <div className="space-y-3">
          <Label>Options</Label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={stripExif}
              onChange={(e) => setStripExif(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 mt-0.5"
            />
            <div className="flex-1">
              <span className="text-sm font-medium">Strip EXIF Data</span>
              <p className="text-xs text-gray-500">
                Remove metadata like camera settings, GPS location, and timestamps
              </p>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleConvert}
            disabled={disabled || isConverting}
            className="w-full"
          >
            <FileImage className="w-4 h-4 mr-2" />
            {isConverting ? "Converting..." : "Convert Image"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
