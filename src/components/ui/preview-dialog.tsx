import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { STORAGE_KEYS } from "@/config/constant";

export interface PreviewDialogProps {
  filePath: string | null;
  type: string;
  open: boolean;
  onClose: () => void;
  fileName?: string;
}

export function PreviewDialog({
  filePath,
  open,
  onClose,
  type,
  fileName,
}: PreviewDialogProps) {
  const [dimensions, setDimensions] = useState<{
    width?: number;
    height?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;
    setDimensions({});
    setObjectUrl(null);

    const fetchFile = async () => {
      if (!open || !filePath) return;

      setIsLoading(true);
      try {
        // Fetch the file using axios to include credentials and bypass X-Frame-Options/CSP
        const response = await axios.get(filePath, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)}`
          }
        });

        const blob = new Blob([response.data], { type: response.headers['content-type'] || type });
        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);

        // Process dimensions for image files
        if (type.startsWith("image/") && type !== "image/pdf") {
          const img = new Image();
          img.onload = () => {
            const maxWidth = window.innerWidth * 0.8;
            const maxHeight = window.innerHeight * 0.7;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height = height * ratio;
            }
            if (height > maxHeight) {
              const ratio = maxHeight / height;
              height = maxHeight;
              width = width * ratio;
            }
            setDimensions({ width, height });
            setIsLoading(false);
          };
          img.onerror = () => setIsLoading(false);
          img.src = currentUrl;
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Preview download failed:", err);
        setObjectUrl(filePath); // Fallback to direct path
        setIsLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [filePath, open, type]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const isImage = type.startsWith("image/") && type !== "image/pdf";
  const displayUrl = objectUrl || filePath;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTitle></DialogTitle>
      <DialogContent
        className={cn(
          "max-w-[90vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col",
          isImage && dimensions.width
            ? "w-auto h-auto transition-all duration-300"
            : "w-full max-w-4xl h-[80vh]"
        )}
        style={
          isImage && dimensions.width
            ? { width: dimensions.width ? (dimensions.width + 48) : 'auto' } // + padding approx
            : {}
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b shrink-0">
          <h3 className="text-lg font-medium truncate pr-8">
            {fileName || "File Preview"}
          </h3>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background flex flex-col items-center justify-center min-h-[300px] w-full relative p-4">
          {!displayUrl ? (
            <div className="flex flex-col items-center text-center p-8">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium">Preview not available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This file type cannot be previewed.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="mt-4 text-sm text-muted-foreground">Loading preview...</span>
            </div>
          ) : isImage ? (
            // Image Preview
            dimensions.width ? (
              <img
                crossOrigin="anonymous"
                src={displayUrl}
                alt={fileName || "Preview"}
                className="max-w-full max-h-full object-contain"
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: dimensions.width,
                  maxHeight: dimensions.height
                }}
              />
            ) : (
              <div className="text-destructive flex flex-col items-center">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span>Failed to load image</span>
              </div>
            )
          ) : (
            // PDF / Object Preview
            <object
              data={displayUrl}
              type={type}
              className="w-full h-full min-h-[60vh]"
            >
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <p className="mb-4 text-muted-foreground">
                  This browser does not support previewing this file type.
                </p>
                <Button asChild variant="primary" size="sm">
                  <a href={displayUrl} download target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </a>
                </Button>
              </div>
            </object>
          )}
        </div>

        {/* Footer */}
        {filePath && (
          <div className="flex justify-end px-6 py-3 bg-muted/40 border-t shrink-0 gap-2">
            <Button asChild variant="primary" size="sm">
              <a href={filePath} download target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
