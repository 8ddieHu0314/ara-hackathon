import { hasAraAgent, mockTailor, tailorVariants } from "@/lib/ara";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text =
    body && typeof body === "object" && "text" in body && typeof (body as { text: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";

  if (!text) {
    return Response.json({ error: "'text' is required" }, { status: 400 });
  }

  const requested =
    body && typeof body === "object" && Array.isArray((body as { platforms?: unknown }).platforms)
      ? ((body as { platforms: unknown[] }).platforms.filter(
          (p): p is Platform => typeof p === "string" && PLATFORMS.includes(p as Platform),
        ) as Platform[])
      : PLATFORMS;

  const platforms = requested.length > 0 ? requested : PLATFORMS;

  if (!hasAraAgent()) {
    return Response.json({ variants: mockTailor(text, platforms), mocked: true });
  }

  try {
    const variants = await tailorVariants(text, platforms);
    return Response.json({ variants });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 502 });
  }
}
