"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLATFORMS, PLATFORM_META } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/cn";
import { PlatformBadge } from "./platform-badge";

type Variants = Partial<Record<Platform, string>>;

const EXAMPLE = `Just shipped Relay — one tool to post everywhere. We built it because our founders were copy-pasting the same update to LinkedIn, X, and Reddit three times a week. Now it's one paste, three tailored drafts, one click.`;

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
  const hasVariants = activePlatforms.some((p) => (variants[p] ?? "").trim().length > 0);

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
      <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
          Your raw post
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your draft — any tone, any length. We'll handle the rest."
          rows={6}
          className="w-full resize-y rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [p]: !prev[p] }))
                }
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                  enabled[p]
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-white"
                    : "border-[var(--card-border)] text-[var(--muted)] hover:text-white",
                )}
                type="button"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: PLATFORM_META[p].hex }}
                />
                {PLATFORM_META[p].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="text-xs text-[var(--muted)] hover:text-white"
            >
              Try example
            </button>
            <button
              type="button"
              onClick={handleTailor}
              disabled={
                !text.trim() || activePlatforms.length === 0 || tailorLoading
              }
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tailorLoading ? "Tailoring…" : hasVariants ? "Re-tailor" : "Tailor with Signal"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {hasVariants && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activePlatforms.map((p) => (
            <VariantEditor
              key={p}
              platform={p}
              value={variants[p] ?? ""}
              onChange={(val) => setVariants((prev) => ({ ...prev, [p]: val }))}
            />
          ))}
        </section>
      )}

      {hasVariants && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishLoading}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishLoading ? "Publishing…" : `Publish to ${activePlatforms.length} platform${activePlatforms.length === 1 ? "" : "s"}`}
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
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className={cn(
          "min-h-[180px] w-full resize-y rounded-lg border bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]",
          over ? "border-red-500/40" : "border-[var(--card-border)]",
        )}
      />
    </div>
  );
}
