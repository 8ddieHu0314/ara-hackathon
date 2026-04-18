import Link from "next/link";
import { listPostsWithVariants } from "@/lib/queries";
import { PLATFORM_META } from "@/lib/platforms";
import { compact, relativeTime } from "@/lib/format";
import { buildInsights } from "@/lib/insights";
import { InsightsPanel } from "@/components/insights-panel";
import { PlatformIcon } from "@/components/platform-icon";
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
    <div className="w-full flex-1 px-12 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Per-post breakdown across LinkedIn, X, and Reddit — with pattern
            insights that update as you post.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(249,115,22,0.6)] transition hover:brightness-110"
        >
          <Plus /> New post
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-8 grid animate-fade-up grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total impressions" value={compact(totals.impressions)} icon={<IconEye />} />
        <Stat label="Total likes" value={compact(totals.likes)} icon={<IconHeart />} />
        <Stat label="Total comments" value={compact(totals.comments)} icon={<IconChat />} />
        <Stat label="Total shares" value={compact(totals.shares)} icon={<IconShare />} />
      </div>

      <div className="animate-fade-up">
        <InsightsPanel insights={buildInsights(posts)} />
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
        <div className="animate-fade-up">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Recent posts
          </h2>
          <ul className="flex flex-col gap-3">
            {posts.map((post, i) => {
              const sum = post.variants.reduce(
                (a, v) => ({
                  impressions: a.impressions + v.impressions,
                  likes: a.likes + v.likes,
                  comments: a.comments + v.comments,
                }),
                { impressions: 0, likes: 0, comments: 0 },
              );
              return (
                <li
                  key={post.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                >
                  <Link
                    href={`/dashboard/${post.id}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:shadow-[0_0_32px_-8px_rgba(249,115,22,0.25)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="line-clamp-2 text-sm leading-relaxed text-white">
                        {post.original_text}
                      </p>
                      <span className="shrink-0 whitespace-nowrap text-xs text-[var(--muted)]">
                        {relativeTime(post.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                      <div className="flex gap-1.5">
                        {post.variants.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--background)] px-2 py-1"
                            title={`${PLATFORM_META[v.platform].label}: ${v.status}`}
                          >
                            <span
                              className="flex h-3.5 w-3.5 items-center justify-center rounded text-white"
                              style={{ background: PLATFORM_META[v.platform].hex }}
                            >
                              <PlatformIcon platform={v.platform} size={8} />
                            </span>
                            <span className="text-white">
                              {PLATFORM_META[v.platform].label}
                            </span>
                            <StatusDot status={v.status} />
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4 font-mono">
                        <span>
                          <span className="text-white">
                            {compact(sum.impressions)}
                          </span>{" "}
                          views
                        </span>
                        <span>
                          <span className="text-white">
                            {compact(sum.likes)}
                          </span>{" "}
                          likes
                        </span>
                        <span>
                          <span className="text-white">
                            {compact(sum.comments)}
                          </span>{" "}
                          comments
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition hover:border-[var(--card-border-strong)]">
      <div className="absolute right-3 top-3 text-[var(--muted)]/40">{icon}</div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold tracking-tight">
        {value}
      </div>
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

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-.8 4.5A7.9 7.9 0 0 1 21 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
