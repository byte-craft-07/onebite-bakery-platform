/**
 * Safely escapes special regular expression characters in user input strings
 * to prevent ReDoS (Regular Expression Denial of Service) and regex injection.
 */
export function escapeRegex(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }
  return input.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
