export interface ApiErrorResponse {
    success: boolean;
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    details?: Record<string, string[]>;
}
