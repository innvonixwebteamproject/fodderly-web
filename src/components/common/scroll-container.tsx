import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollOverflow = "auto" | "scroll" | "hidden";

export interface ScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  height?: React.CSSProperties["height"];
  width?: React.CSSProperties["width"];
  maxHeight?: React.CSSProperties["maxHeight"];
  maxWidth?: React.CSSProperties["maxWidth"];
  overflowX?: ScrollOverflow;
  overflowY?: ScrollOverflow;
  smooth?: boolean;
}

export const ScrollContainer = React.forwardRef<
  HTMLDivElement,
  ScrollContainerProps
>(
  (
    {
      className,
      style,
      height,
      width,
      maxHeight,
      maxWidth,
      overflowX = "auto",
      overflowY = "auto",
      smooth = true,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="scroll-container"
        className={cn("app-scrollbar min-h-0 min-w-0", className)}
        style={{
          height,
          width,
          maxHeight,
          maxWidth,
          overflowX,
          overflowY,
          scrollBehavior: smooth ? "smooth" : "auto",
          WebkitOverflowScrolling: "touch",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollContainer.displayName = "ScrollContainer";
