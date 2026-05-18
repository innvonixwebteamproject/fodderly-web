import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Download, Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-error";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UploadResponse {
  data?: {
    jobId?: string | number;
    id?: string | number;
  };
}

interface ImportStreamPayload {
  progress?: {
    percent?: number;
    processedRows?: number;
    totalRows?: number;
  };
  percent?: number;
  processedRows?: number;
  totalRows?: number;
  done?: boolean;
  errorDownloadable?: boolean;
}

interface CommonExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportError?: (jobId: string | null) => void;
  title?: string;
  templateDownloadName: string;
  storageKey: string;
  queryKey: string[];
  uploadFn: (file: File) => Promise<UploadResponse>;
  downloadTemplateFn: () => Promise<Blob>;
  streamFn: (
    jobId: string,
    onData: (data: ImportStreamPayload) => void,
    signal: AbortSignal,
  ) => Promise<void>;
}

export function CommonExcelUploadModal({
  isOpen,
  onClose,
  onImportError,
  title = "Upload Excel",
  templateDownloadName,
  storageKey,
  queryKey,
  uploadFn,
  downloadTemplateFn,
  streamFn,
}: CommonExcelUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importingJobId, setImportingJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    percent: number;
    processedRows: number;
    totalRows: number;
    done: boolean;
    errorDownloadable: boolean;
  } | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: uploadFn,
    onSuccess: (response: UploadResponse) => {
      const jobId = response?.data?.jobId || response?.data?.id;
      if (jobId) {
        setImportingJobId(String(jobId));
      } else {
        toast.success("Excel uploaded successfully");
        queryClient.invalidateQueries({ queryKey });
        onClose();
      }
    },
    onError: (error) => {
      toast.error(ApiError.getErrorMessage(error, "Failed to upload file"));
    }
  });

  const completionShownRef = useRef<string | null>(null);
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImportingJobId(null);
    setProgress(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;

    const startStream = async () => {
      if (!importingJobId || !isOpen) return;

      // Reset ref if new job started
      if (completionShownRef.current !== importingJobId) {
        completionShownRef.current = null;
      }

      controller = new AbortController();

      try {
        await streamFn(
          importingJobId,
          (data: ImportStreamPayload) => {
            if (!isMounted) return;

            const currentProgress = data.progress || (data.percent !== undefined ? data : null);

            if (currentProgress || data.done) {
              setProgress({
                percent: currentProgress?.percent ?? (data.done ? 100 : 0),
                processedRows: currentProgress?.processedRows ?? 0,
                totalRows: currentProgress?.totalRows ?? 0,
                done: !!data.done,
                errorDownloadable: !!data.errorDownloadable,
              });
            }

            if (data.done && completionShownRef.current !== importingJobId) {
              completionShownRef.current = importingJobId;
              queryClient.invalidateQueries({ queryKey });
              
              if (data.errorDownloadable) {
                toast.warning("Import completed with some errors.", {
                  id: `import-done-${importingJobId}`
                });
                if (importingJobId) {
                  localStorage.setItem(storageKey, importingJobId);
                  onImportError?.(importingJobId);
                }
              } else {
                toast.success("Import completed successfully!", {
                  id: `import-done-${importingJobId}`
                });
                localStorage.removeItem(storageKey);
                onImportError?.(null);
                setTimeout(() => {
                  if (isMounted) handleReset();
                }, 1500);
              }
            }
          },
          controller.signal
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error("Stream error:", err);
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (controller) controller.abort();
    };
  }, [handleReset, importingJobId, isOpen, onImportError, queryClient, storageKey, queryKey, streamFn]);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadSample = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadTemplateFn();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = templateDownloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (error) {
      toast.error(ApiError.getErrorMessage(error, "Failed to download template"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.match(/\.(xlsx|csv)$/i)) {
        toast.error("Invalid file format. Please upload .xlsx or .csv file.");
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        if (jsonData.length === 0) {
          toast.error("The file appears to be empty. Please use the system template.");
          e.target.value = '';
          setSelectedFile(null);
          return;
        }
        setSelectedFile(file);
      } catch {
        toast.error("Could not read the file. Please upload a valid Excel file.");
        e.target.value = '';
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    mutation.mutate(selectedFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {mutation.isPending ? (
            <div className="flex flex-col items-center justify-center p-10 border rounded-xl bg-slate-50/30 gap-4 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative p-4 bg-primary/10 rounded-full">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-700">Uploading File...</p>
                <p className="text-xs text-slate-500 max-w-[200px]">
                  Sending your spreadsheet to the server for processing.
                </p>
              </div>
              <div className="w-full max-w-[250px] space-y-2">
                <div className="h-1.5 w-full bg-slate-200 overflow-hidden rounded-full">
                  <div className="h-full bg-primary w-full animate-pulse rounded-full" />
                </div>
                <p className="text-[10px] text-center text-slate-400 font-medium tracking-tighter uppercase">Step 1 of 2: Transferring Data</p>
              </div>
            </div>
          ) : importingJobId ? (
            <div className="space-y-5 p-5 border rounded-xl bg-gradient-to-br from-slate-50 to-white shadow-sm ring-1 ring-slate-200/50 transition-all duration-500 ease-in-out">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    progress?.done ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {progress?.done ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 tracking-tight">
                      {progress ? (progress.done ? "Import Completed" : "Importing Data") : "Initializing..."}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {progress?.done ? "Success" : "In Progress"}
                    </span>
                  </div>
                </div>
                <Badge variant={progress?.done ? "success" : "info"} className="px-2.5 py-0.5 rounded-full font-semibold">
                  {progress?.done ? "Done" : "Processing"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">ROWS PROCESSED</span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                      {progress ? `${progress.processedRows.toLocaleString()} / ${progress.totalRows.toLocaleString()}` : "Fetching status..."}
                    </span>
                  </div>
                  <span className="text-lg font-black text-primary tracking-tighter">
                    {progress?.percent || 0}%
                  </span>
                </div>
                <Progress value={progress?.percent || 0} className="h-2.5 shadow-inner" />
              </div>

              {progress?.done ? (
                <div className="pt-2 flex flex-col items-center gap-2">
                  <p className="text-xs text-slate-500 text-center font-medium">
                    The import process has finished.
                  </p>
                  {progress.errorDownloadable && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg w-full">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 font-medium">
                        Some rows could not be imported. Download the error report from the main page.
                      </p>
                    </div>
                  )}
                </div>
              ) : !progress && (
                <p className="text-xs text-slate-500 text-center italic animate-pulse">
                  Connecting to the server for live updates...
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-slate-50/50 border-slate-200 hover:bg-slate-50 transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-primary mb-2 opacity-80" />
              {!selectedFile ? (
                <>
                  <p className="text-sm font-medium text-slate-700 mb-1">Select an file to upload</p>
                  <p className="text-xs text-slate-500 mb-4 text-center">Must match the exact structure of the system template.</p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={mutation.isPending}
                    />
                    <Button variant="outline" size="sm" type="button">
                      <Upload className="w-4 h-4" /> Select File
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-medium text-emerald-600">File attached and validated:</p>
                  <p className="text-xs font-mono bg-slate-100 px-2 py-1 rounded truncate max-w-full">{selectedFile.name}</p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="text-destructive mt-1 h-7" disabled={mutation.isPending}>
                    Remove File
                  </Button>
                </div>
              )}
            </div>
          )}

          {!importingJobId && (
            <div className="flex justify-between items-center bg-secondary p-3 rounded-md border border-border">
              <div className="text-sm">
                <p className="font-medium text-primary">Need the standard format?</p>
                <p className="text-primary text-xs mt-0.5">Download headers file</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadSample} disabled={isDownloading || mutation.isPending} >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Sample Excel
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t mt-2">
          <Button variant="outline" onClick={handleReset} disabled={mutation.isPending && !progress?.done}>
            {progress?.done ? <CancelButtonContent>Close</CancelButtonContent> : <CancelButtonContent />}
          </Button>
          {!importingJobId && (
            <Button variant="primary" onClick={handleUpload} disabled={!selectedFile || mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload File
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
