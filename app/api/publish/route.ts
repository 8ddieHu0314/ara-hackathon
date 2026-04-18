import { backendFetch } from "@/lib/backend";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.text();
  const res = await backendFetch("/publish", { method: "POST", body });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
