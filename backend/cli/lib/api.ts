/**
 * Wrapper around fetch with:
 * - JSON headers by default
 * - automatic JSON/text parsing
 * - error handling for non-2xx responses
 */
export async function apiFetch(url: string, options?: RequestInit) {
  // Perform HTTP request with default JSON headers
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  // Throw error if response status is not successful
  if (!res.ok) {
    throw new Error(await res.text());
  }

  // Determine response format based on Content-Type header
  const contentType = res.headers.get("content-type");

  // Parse JSON responses automatically
  if (contentType?.includes("application/json")) {
    return res.json();
  }

  // Fallback for plain text or non-JSON responses
  return res.text();
}
