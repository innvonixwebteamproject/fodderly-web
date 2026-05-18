import type { ReactNode } from "react";
import { Check } from "lucide-react";

type ConfirmButtonContentProps = {
  /** Visible label after the icon (default: Confirm) */
  children?: ReactNode;
};

/**
 * Consistent confirm label: check icon + text. Use inside `Button`, `AlertDialogAction`, etc.
 */
export function ConfirmButtonContent({ children = "Confirm" }: ConfirmButtonContentProps) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <Check className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
