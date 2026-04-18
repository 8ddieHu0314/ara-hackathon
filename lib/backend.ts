const DEFAULT_BASE = "http://localhost:8000";

export function backendUrl(): string {
  return (process.env.BACKEND_URL ?? DEFAULT_BASE).replace(/\/+$/, "");
}

export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${backendUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  return res;
}
