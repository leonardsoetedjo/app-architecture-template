import type { AxiosError } from 'axios';

/**
 * RFC 7807 Problem Detail — backend error response shape.
 *
 * @see docs/01-agnostic/01-standards/35-error-response-standard.md
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  errorCode: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

/**
 * Normalized frontend error — every API error becomes this shape.
 */
export interface AppError {
  /** Machine-readable error category */
  code: string;
  /** Human-readable message for display */
  message: string;
  /** HTTP status code */
  status: number;
  /** Per-field validation errors (422 only) */
  fieldErrors?: Array<{ field: string; message: string }>;
  /** Raw ProblemDetail for debugging */
  raw?: ProblemDetail;
}

/**
 * Convert an AxiosError into our normalized AppError.
 *
 * <p>Handles three cases:
 * <ul>
 *   <li>Backend returned ProblemDetail (4xx/5xx with JSON body)</li>
 *   <li>Network error (no response from server)</li>
 *   <li>Unexpected error (client-side bug)</li>
 * </ul>
 */
export function normalizeError(error: AxiosError | unknown): AppError {
  const axiosError = error as AxiosError;

  // Case 1: Backend returned an error response
  if (axiosError.response) {
    const status = axiosError.response.status;
    const data = axiosError.response.data as Partial<ProblemDetail> | undefined;

    if (data && typeof data === 'object' && 'errorCode' in data) {
      // Standard 35 ProblemDetail format
      return {
        code: data.errorCode ?? `HTTP_${status}`,
        message: data.detail ?? data.title ?? `Request failed (${status})`,
        status,
        fieldErrors: data.fieldErrors,
        raw: data as ProblemDetail,
      };
    }

    // Non-standard error body (fallback)
    return {
      code: `HTTP_${status}`,
      message: (data as Record<string, unknown>)?.message as string ?? `Request failed (${status})`,
      status,
    };
  }

  // Case 2: Network error (no response received)
  if (axiosError.request) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
      status: 0,
    };
  }

  // Case 3: Client-side error (code bug, not API failure)
  return {
    code: 'CLIENT_ERROR',
    message: axiosError.message ?? 'An unexpected error occurred',
    status: 0,
  };
}

/**
 * Map HTTP status to user-facing action advice.
 */
export function getErrorActionAdvice(error: AppError): string {
  switch (error.status) {
    case 400:
      return 'Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Please correct the highlighted fields.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Something went wrong on our end. Please try again later.';
    case 0:
      return error.code === 'NETWORK_ERROR'
        ? 'Network error. Please check your connection.'
        : 'An unexpected error occurred. Please refresh the page.';
    default:
      return 'Please try again or contact support if the problem persists.';
  }
}
