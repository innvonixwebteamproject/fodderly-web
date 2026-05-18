import type { ReactNode } from "react";
import { X } from "lucide-react";

type CancelButtonContentProps = {
  /** Visible label after the icon (default: Cancel) */
  children?: ReactNode;
};

/**
 * Consistent dismiss label: X icon + text. Use inside `Button`, `AlertDialogCancel`, etc.
 */
export function CancelButtonContent({ children = "Cancel" }: CancelButtonContentProps) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <X className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
