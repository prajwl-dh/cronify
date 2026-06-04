import { format, isValid, parseISO } from "date-fns";

/**
 * Converts a datetime-local input value (YYYY-MM-DDTHH:mm)
 * into an ISO 8601 string with seconds and timezone offset.
 *
 * Example:
 * Input:  2026-05-15T16:37
 * Output: 2026-05-15T16:37:00-05:00
 *
 * @param value - datetime-local string
 * @returns ISO 8601 formatted datetime string with timezone offset
 */
export function formatDateTimeLocal(value: string): string {
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Formats a Unix timestamp (milliseconds) into a readable
 * date/time string.
 *
 * Example:
 * Input:  1778881020000
 * Output: May 15, 04:37:00 PM
 */
export function formatReadableDateTime(timestamp?: number) {
  if (!timestamp) return "N/A";

  return format(new Date(timestamp), "MMM d, hh:mm:ss a");
}

/**
 * Checks whether a string is a valid ISO 8601 date.
 *
 * Examples:
 * valid:
 *  - 2026-05-17T15:39:00-05:00
 *  - 2026-05-17T20:39:00Z
 *
 * invalid:
 *  - hello
 *  - 2026-99-99
 */
export function validateIsoDate(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const parsed = parseISO(value);

  return isValid(parsed);
}
