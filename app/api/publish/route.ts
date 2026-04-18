import { mockUrl, publishViaAraAgent } from "@/lib/ara";
import { seedMetrics } from "@/lib/mock-metrics";
import { PLATFORMS } from "@/lib/platforms";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Platform, VariantStatus } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type VariantInput = { platform: Platform; content: string };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = (body ?? {}) as {
    originalText?: unknown;
    variants?: unknown;
  };

  const originalText =
    typeof obj.originalText === "string" ? obj.originalText.trim() : "";
  if (!originalText) {
    return Response.json({ error: "'originalText' is required" }, { status: 400 });
  }

  const variants = (Array.isArray(obj.variants) ? obj.variants : [])
    .map((v) => v as { platform?: unknown; content?: unknown })
    .filter(
      (v): v is VariantInput =>
        typeof v.platform === "string" &&
        PLATFORMS.includes(v.platform as Platform) &&
        typeof v.content === "string" &&
        v.content.trim().length > 0,
    )
    .map((v) => ({ platform: v.platform, content: v.content.trim() }));

  if (variants.length === 0) {
    return Response.json({ error: "At least one variant required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: postRow, error: postErr } = await supabase
    .from("posts")
    .insert({ original_text: originalText })
    .select("id, created_at")
    .single();

  if (postErr || !postRow) {
    return Response.json(
      { error: postErr?.message ?? "Failed to create post" },
      { status: 500 },
    );
  }

  const results = await Promise.all(
    variants.map(async ({ platform, content }) => {
      let status: VariantStatus;
      let url: string | null;
      let error: string | null = null;

      if (platform === "x") {
        status = "mocked";
        url = mockUrl("x");
      } else {
        const res = await publishViaAraAgent(platform, content);
        if (res.ok) {
          status = res.mocked ? "mocked" : "posted";
          url = res.url ?? mockUrl(platform);
        } else {
          status = "failed";
          url = null;
          error = res.error ?? "Unknown error";
        }
      }

      const metrics =
        status === "posted" || status === "mocked"
          ? seedMetrics(platform)
          : { impressions: 0, likes: 0, comments: 0, shares: 0 };

      return {
        post_id: postRow.id,
        platform,
        content,
        status,
        platform_post_url: url,
        error,
        posted_at: status === "failed" ? null : new Date().toISOString(),
        ...metrics,
      };
    }),
  );

  const { error: variantsErr } = await supabase
    .from("post_variants")
    .insert(results);

  if (variantsErr) {
    return Response.json({ error: variantsErr.message }, { status: 500 });
  }

  return Response.json({
    postId: postRow.id,
    results: results.map((r) => ({
      platform: r.platform,
      status: r.status,
      url: r.platform_post_url,
      error: r.error,
    })),
  });
}
