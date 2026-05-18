import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import {
  ScrollContainer,
  type ScrollContainerProps,
} from "@/components/common/scroll-container";

interface InfiniteScrollContainerProps
  extends Omit<ScrollContainerProps, "children"> {
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  threshold?: number;
  /** Optional ref to the scrollable root (for scroll restoration). */
  scrollRootRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Infinite scroll container component
 * Uses Intersection Observer API to detect when user scrolls to bottom
 */
export function InfiniteScrollContainer({
  isLoading,
  isFetchingNextPage,
  hasNextPage = false,
  onLoadMore,
  children,
  threshold = 0.5,
  scrollRootRef,
  className,
  style,
  ...props
}: InfiniteScrollContainerProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mergedScrollRef = (node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (scrollRootRef && typeof scrollRootRef === "object" && "current" in scrollRootRef) {
      (scrollRootRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isLoading
        ) {
          onLoadMore();
        }
      },
      {
        root: containerRef.current,
        threshold,
        rootMargin: "100px",
      },
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, onLoadMore, threshold]);

  return (
    <ScrollContainer
      ref={mergedScrollRef}
      className={className}
      style={style}
      {...props}
    >
      {children}

      <div ref={observerTarget} className="w-full">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading more data...
            </span>
          </div>
        )}
      </div>
    </ScrollContainer>
  );
}
