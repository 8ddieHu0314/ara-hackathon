import Link from "next/link";
import { listPostsWithVariants } from "@/lib/queries";
import { PLATFORM_META } from "@/lib/platforms";
import { compact, relativeTime } from "@/lib/format";
import type { PostWithVariants } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let posts: PostWithVariants[] = [];
  let error: string | null = null;
  try {
    posts = await listPostsWithVariants();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const totals = posts.reduce(
    (acc, p) => {
      for (const v of p.variants) {
        acc.impressions += v.impressions;
        acc.likes += v.likes;
        acc.comments += v.comments;
        acc.shares += v.shares;
      }
      return acc;
    },
    { impressions: 0, likes: 0, comments: 0, shares: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Per-post breakdown across LinkedIn, X, and Reddit.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
        >
          + New post
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total impressions" value={compact(totals.impressions)} />
        <Stat label="Total likes" value={compact(totals.likes)} />
        <Stat label="Total comments" value={compact(totals.comments)} />
        <Stat label="Total shares" value={compact(totals.shares)} />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-12 text-center">
          <p className="text-[var(--muted)]">No posts yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Write your first post
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => {
            const sum = post.variants.reduce(
              (a, v) => ({
                impressions: a.impressions + v.impressions,
                likes: a.likes + v.likes,
                comments: a.comments + v.comments,
              }),
              { impressions: 0, likes: 0, comments: 0 },
            );
            return (
              <li key={post.id}>
                <Link
                  href={`/dashboard/${post.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="line-clamp-2 text-sm text-white">
                      {post.original_text}
                    </p>
                    <span className="whitespace-nowrap text-xs text-[var(--muted)]">
                      {relativeTime(post.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <div className="flex gap-1.5">
                      {post.variants.map((v) => (
                        <span
                          key={v.id}
                          className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] px-2 py-1"
                          title={`${PLATFORM_META[v.platform].label}: ${v.status}`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: PLATFORM_META[v.platform].hex }}
                          />
                          <span className="text-white">
                            {PLATFORM_META[v.platform].label}
                          </span>
                          <StatusDot status={v.status} />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4 font-mono">
                      <span>{compact(sum.impressions)} views</span>
                      <span>{compact(sum.likes)} likes</span>
                      <span>{compact(sum.comments)} comments</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "posted"
      ? "bg-emerald-400"
      : status === "mocked"
        ? "bg-sky-400"
        : status === "failed"
          ? "bg-red-400"
          : "bg-zinc-500";
  return <span className={`ml-0.5 h-1.5 w-1.5 rounded-full ${color}`} />;
}
