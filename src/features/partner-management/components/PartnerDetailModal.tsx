import { useCallback, useEffect, useRef, useState } from "react";
import { Building2, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollContainer } from "@/components/common/scroll-container";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePartnerQuery } from "../hooks";

interface PartnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string | null;
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

  if (!isTruncated) return textNode;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{textNode}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {displayValue}
      </TooltipContent>
    </Tooltip>
  );
}

export function PartnerDetailModal({ isOpen, onClose, partnerId }: PartnerDetailModalProps) {
  const { data, isLoading } = usePartnerQuery(partnerId || undefined);
  const partner = data?.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[820px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-5 pb-3 pr-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <UserRound className="h-4 w-4 text-primary" />
            Partner Details
          </DialogTitle>
        </DialogHeader>

        <ScrollContainer className="max-h-[75vh] px-5 py-4" overflowX="hidden" overflowY="auto">
          <TooltipProvider>
          {isLoading ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              Loading details...
            </div>
          ) : !partner ? (
            <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
              Details not found.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 sm:w-[60%]">
                    <p className="flex min-w-0 items-center text-xl font-semibold text-foreground">
                      <DetailValue value={partner.fullName} />
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      partner.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {partner.isActive ? "Active" : "Inactive"}
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
                      <DetailValue value={partner.firstName} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Last Name:</span>
                      <DetailValue value={partner.lastName} />
                    </p>
                    <p className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <DetailValue value={partner.email} />
                    </p>
                    <p className="flex items-center gap-1.5 min-w-0 whitespace-nowrap">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <DetailValue value={partner.phone} />
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
                      <DetailValue value={partner.state?.name} />
                    </p>
                    <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="shrink-0 text-muted-foreground">Districts:</span>
                      <DetailValue
                        value={
                          partner.districts && partner.districts.length > 0
                            ? partner.districts.map((district) => district.name).join(", ")
                            : "-"
                        }
                      />
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Company Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">Company Type:</span>
                    <DetailValue value={(partner.companyType || "-").toUpperCase()} />
                  </p>
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">Company Name:</span>
                    <DetailValue value={partner.companyName} />
                  </p>
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">GST Number:</span>
                    <DetailValue value={partner.gstNumber} />
                  </p>
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">CIN Number:</span>
                    <DetailValue value={partner.cinNumber} />
                  </p>
                  <p className="md:col-span-2">
                    <span className="text-muted-foreground">Certificate:</span>{" "}
                    {partner.companyCertificate ? (
                      <a
                        href={partner.companyCertificate}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        View certificate
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Account Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span className="shrink-0 text-muted-foreground">Password Updated:</span>
                    <DetailValue value={partner.forcePasswordChange ? "Yes" : "No"} />
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

