import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TruncatedCellProps {
  value: string | number | undefined | null;
  maxWidth?: string;
  className?: string;
  showTooltip?: boolean;
  alwaysShowTooltip?: boolean;
  tooltipClassName?: string;
  lineClamp?: number;
  asBadge?: boolean;
}

export function TruncatedCell({
  value,
  maxWidth = "max-w-[150px]",
  className,
  showTooltip = true,
  alwaysShowTooltip = false,
  tooltipClassName,
  lineClamp = 1,
  asBadge = false,
}: TruncatedCellProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const displayValue = value?.toString() || "-";

  const checkTruncation = useCallback(() => {
    if (textRef.current) {
      const isContentTruncated =
        lineClamp > 1
          ? textRef.current.scrollHeight > textRef.current.clientHeight
          : textRef.current.scrollWidth > textRef.current.clientWidth;
      setIsTruncated(isContentTruncated);
    }
  }, [lineClamp]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(checkTruncation);
    return () => window.cancelAnimationFrame(frame);
  }, [displayValue, maxWidth, lineClamp, checkTruncation]);

  useEffect(() => {
    const element = textRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      checkTruncation();
    });

    resizeObserver.observe(element);
    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    window.addEventListener("resize", checkTruncation);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkTruncation);
    };
  }, [displayValue, maxWidth, lineClamp, checkTruncation]);

  const content = (
    <div
      ref={textRef}
      className={cn(
        lineClamp > 1 ? "line-clamp-none overflow-hidden" : "truncate",
        maxWidth,
        className,
        (isTruncated || alwaysShowTooltip) && "cursor-help",
      )}
      style={lineClamp > 1 ? {
        display: "-webkit-box",
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: "vertical",
      } : undefined}
      onMouseEnter={checkTruncation}
    >
      {asBadge ? (
        <Badge 
          variant="secondary" 
          className="font-bold text-[10px] min-h-[1.125rem] h-auto py-0.5 px-1.5 pointer-events-none whitespace-normal text-left"
        >
          {displayValue}
        </Badge>
      ) : (
        displayValue
      )}
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block max-w-full">
            {content}
          </div>
        </TooltipTrigger>
        {(isTruncated || alwaysShowTooltip) && (
          <TooltipContent className={cn("max-w-[90vw] whitespace-normal break-words", tooltipClassName)}>
            <p>{displayValue}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
