/**
 * Wrapper around fetch with:
 * - JSON headers by default
 * - automatic JSON/text parsing
 * - error handling for non-2xx responses
 */
export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();

    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.error || text);
    } catch (error) {
      if (error instanceof Error && error.message) throw error;
      throw new Error(text);
    }
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}
