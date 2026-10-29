export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

export function notFound(message = "Not Found") {
  return error(message, 404);
}

export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function taskIdFromPath(pathname: string): number | null {
  for (const part of pathname.split("/").filter(Boolean)) {
    const value = Number(part);
    if (Number.isInteger(value) && value > 0) return value;
  }

  return null;
}
