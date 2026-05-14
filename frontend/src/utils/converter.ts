import { format } from 'date-fns';

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
