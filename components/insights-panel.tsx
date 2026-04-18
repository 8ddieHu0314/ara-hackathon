import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/cn";

function toneClass(tone: Insight["tone"]): string {
  switch (tone) {
    case "win":
      return "border-emerald-500/30 bg-emerald-500/5";
    case "watch":
      return "border-amber-500/30 bg-amber-500/5";
    default:
      return "border-[var(--card-border)] bg-[var(--card)]";
  }
}

function toneLabel(tone: Insight["tone"]): string {
  switch (tone) {
    case "win":
      return "WHAT'S WORKING";
    case "watch":
      return "WATCH OUT";
    default:
      return "SIGNAL";
  }
}

function toneLabelClass(tone: Insight["tone"]): string {
  switch (tone) {
    case "win":
      return "text-emerald-300";
    case "watch":
      return "text-amber-300";
    default:
      return "text-[var(--muted)]";
  }
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
        <p className="text-xs text-[var(--muted)]">
          Patterns from your last {insights.length > 0 ? "few posts" : "posts"}. Use as hypotheses, not gospel.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((ins) => (
          <article
            key={ins.id}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border p-4",
              toneClass(ins.tone),
            )}
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className={toneLabelClass(ins.tone)}>{toneLabel(ins.tone)}</span>
              {ins.accent && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: ins.accent }}
                />
              )}
            </div>
            <div>
              <div className="text-xs text-[var(--muted)]">{ins.title}</div>
              <div className="mt-1 font-mono text-xl font-semibold text-white">
                {ins.headline}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-zinc-300">{ins.detail}</p>
            <div className="mt-auto rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3 text-xs leading-relaxed">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Try next
              </div>
              <div className="text-white">{ins.action}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
