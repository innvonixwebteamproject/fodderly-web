import { ApiError } from "@/lib/api-error";
import { ColumnDef } from "@tanstack/react-table";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Utility function to format phone number in Indian format
export const FormattesPhoneNumber = (
  phoneNumber: string | null | undefined,
  countryCode?: string | null
) => {
  if (!phoneNumber) return "";

  // Remove all non-digit characters from the phone number
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // If we have a separate country code, use it
  const code = countryCode ? countryCode.trim() : "";
  
  let formatted = "";
  if (code) {
    // Expected format: +91 97379 27745
    formatted = `${code} ${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`;
    if (cleaned.length > 10) {
        formatted = `${code} ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
    }
  } else if (cleaned.startsWith("91")) {
    // Fallback logic for numbers starting with 91
    formatted = `+91 ${cleaned.substring(2, 7)} ${cleaned.substring(7, 12)}`;
  } else if (cleaned.length === 10) {
    formatted = `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`;
  } else {
    formatted = cleaned;
  }
  return formatted.trim();
};

export const formattedIndiaPhoneNumberInput = (
  phoneNumber: string | null | undefined
) => {
  if (!phoneNumber) return "";

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Format the phone number
  let formatted = "";
  if (cleaned.length === 10) {
    // Format for 10-digit local numbers
    formatted = `${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`;
  } else {
    // Default format if the number doesn't match expected patterns
    formatted = cleaned;
  }
  return formatted;
};


// export function calculateResponsiveColumnWidths<T>(
//   preColumns: ColumnDef<T>[],
//   containerWidth: number | undefined
// ): ColumnDef<T>[] {
//   if (!containerWidth) return preColumns;

//   const totalBaseSize = preColumns.reduce(
//     (sum, col) => sum + (col.size || 100),
//     0
//   );

//   return preColumns.map((col) => ({
//     ...col,
//     size: Math.floor(containerWidth * ((col.size || 100) / totalBaseSize)),
//   }));
// }
export function calculateResponsiveColumnWidths<T>(
  preColumns: ColumnDef<T>[],
  containerWidth: number | undefined,
  columnVisibility: { [key: string]: boolean } = {},
  defaultMinWidth = 120
): ColumnDef<T>[] {
  if (!containerWidth) return preColumns;

  // Filter out hidden columns
  const visibleColumns = preColumns.filter(
    (col) => columnVisibility[col.id as string] !== false
  );

  // Assign base size if not provided
  const withBaseSize = visibleColumns.map((col) => ({
    ...col,
    size: typeof col.size === "number" ? col.size : defaultMinWidth,
  }));

  const totalBaseSize = withBaseSize.reduce(
    (sum, col) => sum + (col.size as number),
    0
  );

  // If total width fits in container, stretch proportionally
  if (totalBaseSize <= containerWidth) {
    return preColumns.map((col) => {
      // For hidden columns, keep their original size but they won't be rendered
      if (columnVisibility[col.id as string] === false) {
        return col;
      }

      // For visible columns, calculate proportional width
      const visibleCol = withBaseSize.find((vc) => vc.id === col.id);
      if (visibleCol) {
        return {
          ...col,
          size: Math.floor(
            containerWidth * ((visibleCol.size as number) / totalBaseSize)
          ),
        };
      }
      return col;
    });
  }

  // If total width is greater, don't shrink — allow horizontal scroll
  return preColumns.map((col) => {
    if (columnVisibility[col.id as string] === false) {
      return col;
    }
    const visibleCol = withBaseSize.find((vc) => vc.id === col.id);
    return visibleCol || col;
  });
}

export function formatCurrency(amount: number | string | undefined): string {
  if (!amount) return "—";
  const actualAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(actualAmount)) {
    return "Invalid amount";
  }

  return actualAmount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencySign: "accounting",
    currencyDisplay: "symbol",
  });
}


export const formatAddressDisplay = (address: unknown): string => {
  if (!address) return "—";

  if (typeof address === 'string') return address;

  const { address_line_1, city, district, state, country } = address as Record<string, string>;

  const parts = [address_line_1, city, district, state, country].filter(
    Boolean
  );

  return [...parts].filter(Boolean).join(", ");
};


