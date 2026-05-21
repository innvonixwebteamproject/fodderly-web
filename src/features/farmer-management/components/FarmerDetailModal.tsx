import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, MapPin, Phone, Tractor, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollContainer } from "@/components/common/scroll-container";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFarmerQuery } from "../hooks";
import { LANGUAGE_OPTIONS } from "../constants";

interface FarmerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId: string | null;
}

function DetailValue({ value, fallback = "-" }: { value?: string; fallback?: string }) {
  const displayValue = value?.trim() || fallback;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const element = textRef.current;
    if (!element) return;
    setIsTruncated(element.scrollWidth > element.clientWidth);
  }, []);

  useEffect(() => {
    checkTruncation();
    const raf = window.requestAnimationFrame(checkTruncation);
    const timeout = window.setTimeout(checkTruncation, 120);

    const element = textRef.current;
    if (!element) {
      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(timeout);
      };
    }

    const resizeObserver = new ResizeObserver(checkTruncation);
    resizeObserver.observe(element);
    window.addEventListener("resize", checkTruncation);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkTruncation);
    };
  }, [checkTruncation, displayValue]);

  const textNode = (
    <span
      ref={textRef}
      onMouseEnter={checkTruncation}
      className="block min-w-0 flex-1 truncate text-foreground"
    >
      {displayValue}
    </span>
  );

  if (!isTruncated) {
    return textNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {textNode}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {displayValue}
      </TooltipContent>
    </Tooltip>
  );
}

export function FarmerDetailModal({ isOpen, onClose, farmerId }: FarmerDetailModalProps) {
  const { data, isLoading } = useFarmerQuery(farmerId || undefined);
  const farmer = data?.data;
  const languageLabel =
    LANGUAGE_OPTIONS.find((language) => language.value === farmer?.languagePreference)?.label ||
    farmer?.languagePreference ||
    "-";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[820px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-5 pb-3 pr-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <UserRound className="h-4 w-4 text-primary" />
            Farmer Details
          </DialogTitle>
        </DialogHeader>

        <ScrollContainer className="max-h-[75vh] px-5 py-4" overflowX="hidden" overflowY="auto">
          <TooltipProvider>
          {isLoading ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              Loading details...
            </div>
          ) : !farmer ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              Details not found.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 sm:w-[60%]">
                    <p className="flex min-w-0 items-center text-xl font-semibold text-foreground">
                      <DetailValue value={farmer.fullName} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned Partner:{" "}
                      <span className="font-medium text-foreground">{farmer.partnerName || "-"}</span>
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      farmer.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {farmer.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    Basic Information
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">First Name:</span>
                      <DetailValue value={farmer.firstName} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Last Name:</span>
                      <DetailValue value={farmer.lastName} />
                    </p>
                    <p className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <DetailValue value={farmer.mobile} />
                    </p>
                    <p className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <DetailValue value={languageLabel} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Registration Source:</span>
                      <DetailValue value={farmer.registrationSource} />
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location Details
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">State:</span>
                      <DetailValue value={farmer.stateName} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">District:</span>
                      <DetailValue value={farmer.districtName} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Taluka:</span>
                      <DetailValue value={farmer.talukaName} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Village:</span>
                      <DetailValue value={farmer.villageName} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Pin Code:</span>
                      <DetailValue value={farmer.pincode} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Address:</span>
                      <DetailValue value={farmer.address} />
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Tractor className="h-4 w-4 text-primary" />
                  Fodderman Mapping
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">Assigned Fodderman:</span>
                    <DetailValue value={farmer.foddermanName} fallback="Unassigned" />
                  </p>
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">Fodderman Contact:</span>
                    <DetailValue value={farmer.foddermanPhone} />
                  </p>
                </div>
              </div>
            </div>
          )}
          </TooltipProvider>
        </ScrollContainer>
      </DialogContent>
    </Dialog>
  );
}
