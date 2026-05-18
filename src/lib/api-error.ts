import { ApiErrorResponse } from "@/types/api";

export class ApiError extends Error {
  public status?: number; // Optional, undefined for network errors
  public data?: ApiErrorResponse;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    data: unknown,
    isNetworkError = false
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data as ApiErrorResponse;
    this.isNetworkError = isNetworkError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static getErrorMessage(error: unknown, defaultMessage: string = "An error occurred"): string {
    if (error instanceof ApiError) {
      const details = error.data?.details;
      if (details && Object.keys(details).length > 0) {
        return Object.values(details).flat().join(", ");
      }
      return error.data?.message || error.message || defaultMessage;
    }
    return (error as Error)?.message || defaultMessage;
  }
}
