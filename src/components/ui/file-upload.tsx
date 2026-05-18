import React, { useRef, useState } from "react";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxFiles?: number;
  autoUpload?: boolean;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Simulate upload process
    setIsUploading(true);
    setTimeout(() => {
      const newUrls = Array.from(files).map((file) => URL.createObjectURL(file));
      const updatedValue = [...value, ...newUrls].slice(0, maxFiles);
      onChange?.(updatedValue);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 1000);
  };

  const removeFile = (index: number) => {
    const updatedValue = value.filter((_, i) => i !== index);
    onChange?.(updatedValue);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 transition-all hover:bg-muted/50 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-3 group",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept="image/*"
        />
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Click to upload images</p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG or WebP (max {maxFiles} files)
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border bg-muted overflow-hidden group shadow-sm"
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <FileImage className="h-3 w-3 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
