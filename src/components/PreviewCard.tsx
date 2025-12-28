import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewCardProps {
  imageUrl: string;
  fileName: string;
}

export function PreviewCard({ imageUrl, fileName }: PreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <img
            src={imageUrl}
            alt={fileName}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="mt-2 text-sm text-gray-600 truncate" title={fileName}>
          {fileName}
        </p>
      </CardContent>
    </Card>
  );
}
