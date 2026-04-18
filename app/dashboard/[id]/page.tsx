import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostWithVariants } from "@/lib/queries";
import { PLATFORM_META } from "@/lib/platforms";
import { compact, relativeTime } from "@/lib/format";
import { PlatformBadge } from "@/components/platform-badge";
import { ImpressionsChart } from "@/components/impressions-chart";
import type { VariantStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostWithVariants(id);
  if (!post) notFound();

  const totalImpressions = post.variants.reduce((a, v) => a + v.impressions, 0);

  return (
    <div className="w-full flex-1 px-12 py-10">
      <div className="mb-6 animate-fade-up">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-white"
        >
          <span aria-hidden>←</span> All posts
        </Link>
      </div>

      <div className="mb-8 animate-fade-up rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <span className="rounded-full border border-[var(--card-border)] bg-[var(--background)] px-2 py-0.5">
            Original draft
          </span>
          <span>{relativeTime(post.created_at)}</span>
          <span className="text-[var(--muted)]">·</span>
          <span className="font-mono">
            {compact(totalImpressions)} total impressions
          </span>
        </div>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-white">
          {post.original_text}
        </p>
      </div>

      <div className="mb-8 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <ImpressionsChart variants={post.variants} />
      </div>

      <h2
        className="mb-4 animate-fade-up text-lg font-semibold tracking-tight"
        style={{ animationDelay: "120ms" }}
      >
        Per-platform breakdown
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {post.variants.map((v, i) => (
          <div
            key={v.id}
            className="flex animate-fade-up flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition hover:border-[var(--card-border-strong)]"
            style={{ animationDelay: `${160 + i * 50}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <PlatformBadge platform={v.platform} />
              <StatusPill status={v.status} />
            </div>
            <div className="mb-4 whitespace-pre-wrap rounded-lg bg-[var(--background)] p-3 text-xs leading-relaxed text-zinc-300">
              {v.content}
            </div>
            {v.error && (
              <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
                {v.error}
              </p>
            )}
            <div className="mt-auto grid grid-cols-4 gap-1 border-t border-[var(--card-border)] pt-3 text-center font-mono text-xs">
              <Metric label="views" value={v.impressions} />
              <Metric label="likes" value={v.likes} />
              <Metric label="replies" value={v.comments} />
              <Metric label="shares" value={v.shares} />
            </div>
            {v.platform_post_url && (
              <a
                href={v.platform_post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-center text-xs text-[var(--accent)] hover:underline"
              >
                View on {PLATFORM_META[v.platform].label} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-white">{compact(value)}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: VariantStatus }) {
  const map: Record<VariantStatus, { label: string; cls: string }> = {
    posted: { label: "Posted via Ara", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    mocked: { label: "Mocked", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
    failed: { label: "Failed", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
    posting: { label: "Posting…", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    draft: { label: "Draft", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  };
  const s = map[status];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}
