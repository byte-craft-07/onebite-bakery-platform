import type { AxiosError } from "axios";

import { toast } from "@/contexts/toast.context";

/**
 * Standard API error response shape from the backend.
 */
interface ApiErrorBody {
  success: false;
  message: string;
  errors?: unknown[];
  code?: string;
}

/**
 * Extracts a user-friendly error message from any error shape.
 * Handles Axios errors, API error responses, plain Error objects, and unknown types.
 */
export const extractErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  // Axios error with API response body
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;

    // Use backend message if available
    if (data?.message) {
      return data.message;
    }

    // Network / timeout errors (no response from server)
    if (!error.response) {
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        return "Network connection lost. Please check your internet and try again.";
      }
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return "Request timed out. The server is taking too long to respond.";
      }
      return "Unable to connect to the server. Please try again later.";
    }

    // HTTP status-specific fallbacks when backend message is missing
    const status = error.response.status;
    return getStatusMessage(status, fallback);
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // String error
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  return fallback;
};

/**
 * Provides friendly status-code-based messages when the backend doesn't send one.
 */
const getStatusMessage = (status: number, fallback: string): string => {
  const statusMessages: Record<number, string> = {
    400: "Invalid request. Please check your input and try again.",
    401: "Your session has expired. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This action conflicts with existing data. Please check and try again.",
    422: "The submitted data is invalid. Please correct the errors and try again.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "An internal server error occurred. Our team has been notified.",
    502: "Server is temporarily unavailable. Please try again shortly.",
    503: "Service is under maintenance. Please try again later.",
  };

  return statusMessages[status] ?? fallback;
};

/**
 * Extracts validation field errors from an API error response.
 * Useful for form-level error display.
 */
export const extractFieldErrors = (
  error: unknown,
): Array<{ field: string; message: string }> => {
  if (!isAxiosError(error)) return [];

  const data = error.response?.data as ApiErrorBody | undefined;
  if (!data?.errors || !Array.isArray(data.errors)) return [];

  return data.errors
    .filter(
      (e): e is { field: string; message: string } =>
        typeof e === "object" &&
        e !== null &&
        "field" in e &&
        typeof (e as Record<string, unknown>).field === "string",
    )
    .map((e) => ({
      field: e.field,
      message: e.message ?? "Invalid value",
    }));
};

/**
 * Shows an error toast with a properly extracted message.
 * Safe to call from any catch block in any component or service.
 */
export const showErrorToast = (
  error: unknown,
  defaultMessage = "Something went wrong. Please try again.",
): void => {
  const message = extractErrorMessage(error, defaultMessage);
  toast.error("Error", message);
};

/**
 * Shows a specific status-aware error toast.
 * Shows different titles for permission vs validation vs server errors.
 */
export const showApiErrorToast = (error: unknown): void => {
  if (!isAxiosError(error) || !error.response) {
    showErrorToast(error);
    return;
  }

  const status = error.response.status;
  const message = extractErrorMessage(error);

  if (status === 403) {
    toast.error("Access Denied", message);
  } else if (status === 409) {
    toast.error("Conflict", message);
  } else if (status === 422) {
    toast.error("Validation Error", message);
  } else if (status === 429) {
    toast.info("Slow Down", message);
  } else if (status >= 500) {
    toast.error("Server Error", message);
  } else {
    toast.error("Error", message);
  }
};

/**
 * Type guard for Axios errors.
 */
const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
};
