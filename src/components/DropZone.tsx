import { Upload, ImageIcon } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, disabled }: DropZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            onFileSelect(file);
            break;
          }
        }
      }
    },
    [onFileSelect, disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onPaste={handlePaste}
      tabIndex={0}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors",
        disabled
          ? "border-gray-300 bg-gray-50 cursor-not-allowed"
          : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload image"
      />
      <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
        <div className="p-3 bg-blue-100 rounded-full">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            Drop an image here or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Or press Ctrl+V to paste from clipboard
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ImageIcon className="w-4 h-4" />
          <span>JPEG, PNG, WebP supported</span>
        </div>
      </div>
    </div>
  );
}
