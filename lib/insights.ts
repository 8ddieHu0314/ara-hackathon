import type { Platform, PostWithVariants, PostVariant } from "./types";
import { PLATFORM_META } from "./platforms";
import { compact } from "./format";

export type InsightTone = "win" | "neutral" | "watch";

export type Insight = {
  id: string;
  title: string;
  headline: string;
  detail: string;
  tone: InsightTone;
  accent?: string;
  action: string;
};

function sum(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0);
}

function avg(ns: number[]): number {
  return ns.length === 0 ? 0 : sum(ns) / ns.length;
}

function totalImpressions(p: PostWithVariants): number {
  return sum(p.variants.map((v) => v.impressions));
}

function variantEngagement(v: PostVariant): number {
  return v.likes + v.comments + v.shares;
}

function endsWithQuestion(text: string): boolean {
  return /\?\s*$|[?]\s*(#[\w\d]+\s*)+$/.test(text.trim());
}

function countHashtags(text: string): number {
  return (text.match(/#[\w\d]+/g) ?? []).length;
}

function pct(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.round(delta * 100)}%`;
}

// --- top performer -----------------------------------------------------------

function topPerformer(posts: PostWithVariants[]): Insight | null {
  if (posts.length === 0) return null;
  const ranked = [...posts].sort(
    (a, b) => totalImpressions(b) - totalImpressions(a),
  );
  const top = ranked[0];
  const topImp = totalImpressions(top);
  if (topImp === 0) return null;

  const medianImp =
    posts.length > 1
      ? totalImpressions(
          [...posts].sort((a, b) => totalImpressions(a) - totalImpressions(b))[
            Math.floor(posts.length / 2)
          ],
        )
      : topImp;
  const lift = medianImp > 0 ? topImp / medianImp - 1 : 0;

  const preview = top.original_text.trim().slice(0, 64).replace(/\s+/g, " ");

  return {
    id: "top-performer",
    title: "Top-performing post",
    headline: `${compact(topImp)} impressions`,
    detail:
      lift > 0.15
        ? `"${preview}${top.original_text.length > 64 ? "…" : ""}" — ${pct(lift)} vs your median post.`
        : `"${preview}${top.original_text.length > 64 ? "…" : ""}"`,
    tone: "win",
    accent: "#f97316",
    action: "Re-run this angle next week. Patterns that worked once usually work twice.",
  };
}

// --- best platform by avg impressions ---------------------------------------

function bestPlatform(posts: PostWithVariants[]): Insight | null {
  const byPlatform: Record<Platform, number[]> = {
    linkedin: [],
    x: [],
    reddit: [],
  };
  for (const p of posts) {
    for (const v of p.variants) {
      if (v.impressions > 0) byPlatform[v.platform].push(v.impressions);
    }
  }
  const ranked = (Object.entries(byPlatform) as [Platform, number[]][])
    .filter(([, arr]) => arr.length >= 2)
    .map(([p, arr]) => ({ platform: p, avg: avg(arr), n: arr.length }))
    .sort((a, b) => b.avg - a.avg);
  if (ranked.length < 2) return null;
  const best = ranked[0];
  const next = ranked[1];
  const lift = next.avg > 0 ? best.avg / next.avg - 1 : 0;
  if (lift < 0.1) return null;

  const meta = PLATFORM_META[best.platform];
  return {
    id: "best-platform",
    title: "Strongest channel",
    headline: `${meta.label} · ${compact(Math.round(best.avg))} avg`,
    detail: `Your average ${meta.label} post outperforms ${PLATFORM_META[next.platform].label} by ${pct(lift)} on impressions.`,
    tone: "win",
    accent: meta.hex,
    action: `Lean in on ${meta.label}. Post there twice as often as your next-best channel until you plateau.`,
  };
}

// --- engagement ratio leader ------------------------------------------------

function engagementRatioLeader(posts: PostWithVariants[]): Insight | null {
  const agg: Record<Platform, { imps: number; eng: number; n: number }> = {
    linkedin: { imps: 0, eng: 0, n: 0 },
    x: { imps: 0, eng: 0, n: 0 },
    reddit: { imps: 0, eng: 0, n: 0 },
  };
  for (const p of posts) {
    for (const v of p.variants) {
      if (v.impressions <= 0) continue;
      agg[v.platform].imps += v.impressions;
      agg[v.platform].eng += variantEngagement(v);
      agg[v.platform].n += 1;
    }
  }
  const ranked = (Object.entries(agg) as [Platform, typeof agg.linkedin][])
    .filter(([, x]) => x.n >= 2 && x.imps > 0)
    .map(([p, x]) => ({ platform: p, rate: x.eng / x.imps }))
    .sort((a, b) => b.rate - a.rate);
  if (ranked.length < 2) return null;
  const best = ranked[0];
  const others = avg(ranked.slice(1).map((r) => r.rate));
  if (others === 0) return null;
  const lift = best.rate / others - 1;
  if (lift < 0.25) return null;

  const meta = PLATFORM_META[best.platform];
  return {
    id: "engagement-rate",
    title: "Where people actually react",
    headline: `${meta.label} · ${(best.rate * 100).toFixed(1)}% engagement rate`,
    detail: `${meta.label} audiences engage ${pct(lift)} more per impression than your other channels.`,
    tone: "win",
    accent: meta.hex,
    action: `${meta.label} isn't a broadcast channel for you — it's a conversation. Ask more questions, reply fast.`,
  };
}

// --- questions vs statements ------------------------------------------------

function questionPattern(posts: PostWithVariants[]): Insight | null {
  const withQ: PostVariant[] = [];
  const withoutQ: PostVariant[] = [];
  for (const p of posts) {
    for (const v of p.variants) {
      if (v.impressions <= 0) continue;
      (endsWithQuestion(v.content) ? withQ : withoutQ).push(v);
    }
  }
  if (withQ.length < 2 || withoutQ.length < 2) return null;

  const commentsPerKImp = (vs: PostVariant[]) =>
    (sum(vs.map((v) => v.comments)) / sum(vs.map((v) => v.impressions))) * 1000;

  const withRate = commentsPerKImp(withQ);
  const withoutRate = commentsPerKImp(withoutQ);
  if (withoutRate <= 0) return null;
  const lift = withRate / withoutRate - 1;
  if (Math.abs(lift) < 0.2) return null;

  const tone: InsightTone = lift > 0 ? "win" : "watch";
  return {
    id: "question-ending",
    title: "Ending with a question",
    headline: lift > 0 ? `${pct(lift)} more replies` : `${pct(lift)} reply drop`,
    detail:
      lift > 0
        ? `Variants that end on a question draw ${withRate.toFixed(1)} comments per 1k impressions vs ${withoutRate.toFixed(1)} for statement posts.`
        : `Questions aren't landing for your audience this month — statements are pulling ${pct(-lift)} more discussion.`,
    tone,
    action:
      lift > 0
        ? "Close every long-form post with a single open-ended question. Don't stack — just one."
        : "Try declarative takes instead. Strong opinion in a single sentence beats a soft question.",
  };
}

// --- LinkedIn hashtag lift --------------------------------------------------

function linkedInHashtagLift(posts: PostWithVariants[]): Insight | null {
  const withTag: PostVariant[] = [];
  const withoutTag: PostVariant[] = [];
  for (const p of posts) {
    for (const v of p.variants) {
      if (v.platform !== "linkedin" || v.impressions <= 0) continue;
      (countHashtags(v.content) >= 2 ? withTag : withoutTag).push(v);
    }
  }
  if (withTag.length < 2 || withoutTag.length < 2) return null;
  const withAvg = avg(withTag.map((v) => v.impressions));
  const withoutAvg = avg(withoutTag.map((v) => v.impressions));
  if (withoutAvg <= 0) return null;
  const lift = withAvg / withoutAvg - 1;
  if (Math.abs(lift) < 0.15) return null;

  return {
    id: "linkedin-hashtags",
    title: "LinkedIn hashtags",
    headline: `${pct(lift)} impressions`,
    detail:
      lift > 0
        ? `Your LinkedIn posts with 2+ hashtags average ${compact(Math.round(withAvg))} impressions vs ${compact(Math.round(withoutAvg))} without.`
        : `LinkedIn posts with hashtags are underperforming plain ones (${compact(Math.round(withAvg))} vs ${compact(Math.round(withoutAvg))}).`,
    tone: lift > 0 ? "win" : "watch",
    accent: PLATFORM_META.linkedin.hex,
    action:
      lift > 0
        ? "Keep 3–5 relevant hashtags at the bottom of LinkedIn posts. Don't bolt them onto the hook."
        : "Try dropping the hashtags on LinkedIn — for your audience, they're reading as noise.",
  };
}

// --- X post length sweet spot -----------------------------------------------

function xLengthSweetSpot(posts: PostWithVariants[]): Insight | null {
  const xs: PostVariant[] = posts
    .flatMap((p) => p.variants)
    .filter((v) => v.platform === "x" && v.impressions > 0);
  if (xs.length < 4) return null;
  const sorted = [...xs].sort((a, b) => a.content.length - b.content.length);
  const half = Math.floor(sorted.length / 2);
  const shorter = sorted.slice(0, half);
  const longer = sorted.slice(half);
  const shortAvg = avg(shorter.map((v) => v.impressions));
  const longAvg = avg(longer.map((v) => v.impressions));
  if (longAvg <= 0) return null;
  const lift = shortAvg / longAvg - 1;
  if (Math.abs(lift) < 0.2) return null;

  const medianLen = Math.round(sorted[half].content.length);
  return {
    id: "x-length",
    title: "X post length",
    headline:
      lift > 0 ? `Shorter wins by ${pct(lift)}` : `Longer wins by ${pct(-lift)}`,
    detail:
      lift > 0
        ? `X posts under ~${medianLen} chars pull ${pct(lift)} more impressions than your longer ones.`
        : `Your longer X posts (> ~${medianLen} chars) are actually outperforming the punchy ones by ${pct(-lift)}.`,
    tone: "neutral",
    accent: PLATFORM_META.x.hex,
    action:
      lift > 0
        ? "Aim for one-breath tweets. If it doesn't fit in ~200 chars, split it into two."
        : "Your audience rewards depth — keep using the full character budget for context.",
  };
}

// ---------------------------------------------------------------------------

export function buildInsights(posts: PostWithVariants[]): Insight[] {
  if (posts.length === 0) return [];
  const candidates = [
    topPerformer(posts),
    bestPlatform(posts),
    engagementRatioLeader(posts),
    questionPattern(posts),
    linkedInHashtagLift(posts),
    xLengthSweetSpot(posts),
  ].filter((x): x is Insight => x !== null);
  return candidates.slice(0, 4);
}
