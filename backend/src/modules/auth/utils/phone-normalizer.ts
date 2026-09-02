import { AppError } from "../../../shared/errors/app-error.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";

/**
 * Normalizes Indian mobile phone numbers to a canonical 10-digit format.
 * Examples:
 * "+919876543210" -> "9876543210"
 * "919876543210"  -> "9876543210"
 * "09876543210"   -> "9876543210"
 * "9876543210"    -> "9876543210"
 */
export const normalizeIndianPhone = (rawPhone: string): string => {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw new AppError(
      "Phone number is required.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const digits = rawPhone.replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    return digits.slice(1);
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits.slice(2);
  }

  // Fallback for valid digits matching 10-15 pattern
  if (/^[0-9]{10,15}$/.test(digits)) {
    return digits;
  }

  throw new AppError(
    "Please provide a valid Indian mobile phone number (10 digits).",
    HTTP_STATUS.BAD_REQUEST,
  );
};
