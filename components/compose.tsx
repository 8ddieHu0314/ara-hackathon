"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/cn";
import { PlatformBadge } from "./platform-badge";
import { PlatformIcon } from "./platform-icon";

type Variants = Partial<Record<Platform, string>>;

const EXAMPLE = `Just shipped Signal — one tool to post everywhere. We built it because our founders were copy-pasting the same update to LinkedIn, X, and Reddit three times a week. Now it's one paste, three tailored drafts, one click.`;

export default function Compose() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [variants, setVariants] = useState<Variants>({});
  const [tailorLoading, setTailorLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<Platform, boolean>>({
    linkedin: true,
    x: true,
    reddit: true,
  });

  const activePlatforms = PLATFORMS.filter((p) => enabled[p]);
  const hasVariants = activePlatforms.some(
    (p) => (variants[p] ?? "").trim().length > 0,
  );

  async function handleTailor() {
    if (!text.trim() || activePlatforms.length === 0) return;
    setTailorLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, platforms: activePlatforms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tailoring failed");
      setVariants((prev) => ({ ...prev, ...data.variants }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTailorLoading(false);
    }
  }

  async function handlePublish() {
    if (!hasVariants) return;
    setPublishLoading(true);
    setError(null);
    try {
      const payload = activePlatforms
        .map((p) => ({ platform: p, content: (variants[p] ?? "").trim() }))
        .filter((v) => v.content.length > 0);
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText: text, variants: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      router.push(`/dashboard/${data.postId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPublishLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-[var(--muted)]">
          <span>Your raw post</span>
          <span className="font-mono text-xs">{text.length} chars</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your draft — any tone, any length. We'll handle the rest."
          rows={6}
          className="w-full resize-y rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3 text-sm leading-relaxed outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [p]: !prev[p] }))
                }
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  enabled[p]
                    ? "border-[var(--card-border-strong)] bg-[var(--accent-soft)] text-white"
                    : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--card-border-strong)] hover:text-white",
                )}
                type="button"
                style={
                  enabled[p]
                    ? { boxShadow: `0 0 0 1px ${PLATFORM_META[p].hex}33 inset` }
                    : undefined
                }
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded text-white"
                  style={{ background: PLATFORM_META[p].hex }}
                >
                  <PlatformIcon platform={p} size={10} />
                </span>
                {PLATFORM_META[p].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="text-xs text-[var(--muted)] hover:text-white transition"
            >
              Try example
            </button>
            <button
              type="button"
              onClick={handleTailor}
              disabled={
                !text.trim() || activePlatforms.length === 0 || tailorLoading
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-white to-zinc-200 px-4 py-2 text-sm font-semibold text-black shadow-sm transition",
                "hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40",
                tailorLoading && "animate-pulse-glow",
              )}
            >
              {tailorLoading ? (
                <>
                  <Spinner /> Ara is thinking…
                </>
              ) : hasVariants ? (
                <>Re-tailor with Ara</>
              ) : (
                <>
                  <Sparkles /> Tailor with Ara
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="animate-fade-up rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {tailorLoading && !hasVariants && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activePlatforms.map((p) => (
            <VariantSkeleton key={p} platform={p} />
          ))}
        </section>
      )}

      {hasVariants && (
        <section className="grid animate-fade-up gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activePlatforms.map((p, i) => (
            <div
              key={p}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <VariantEditor
                platform={p}
                value={variants[p] ?? ""}
                onChange={(val) =>
                  setVariants((prev) => ({ ...prev, [p]: val }))
                }
              />
            </div>
          ))}
        </section>
      )}

      {hasVariants && (
        <div className="flex animate-fade-up items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(249,115,22,0.6)] transition",
              "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
              publishLoading && "animate-pulse-glow",
            )}
          >
            {publishLoading ? (
              <>
                <Spinner /> Publishing…
              </>
            ) : (
              <>
                Publish to {activePlatforms.length} platform
                {activePlatforms.length === 1 ? "" : "s"}
                <ArrowRight />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function VariantEditor({
  platform,
  value,
  onChange,
}: {
  platform: Platform;
  value: string;
  onChange: (v: string) => void;
}) {
  const limit = PLATFORM_META[platform].charLimit;
  const over = value.length > limit;
  const pct = Math.min(100, (value.length / limit) * 100);
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition hover:border-[var(--card-border-strong)]">
      <div className="mb-3 flex items-center justify-between">
        <PlatformBadge platform={platform} />
        <span
          className={cn(
            "font-mono text-xs",
            over ? "text-red-400" : "text-[var(--muted)]",
          )}
        >
          {value.length.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-[var(--background)]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            over ? "bg-red-400" : "bg-gradient-to-r from-orange-400 to-orange-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className={cn(
          "min-h-[180px] w-full resize-y rounded-lg border bg-[var(--background)] p-3 text-sm leading-relaxed outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
          over ? "border-red-500/40" : "border-[var(--card-border)]",
        )}
      />
    </div>
  );
}

function VariantSkeleton({ platform }: { platform: Platform }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <PlatformBadge platform={platform} />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-[var(--background)]">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-500" />
      </div>
      <div className="flex flex-col gap-2 p-1">
        <div className="skeleton h-3 w-5/6" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-3/4" />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm7 10l.9 2.7L22.6 16l-2.7.9L19 19.6l-.9-2.7L15.4 16l2.7-.9.9-2.7zM5 14l.7 2.1L7.8 17l-2.1.7L5 19.8l-.7-2.1L2.2 17l2.1-.7L5 14z" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
