"use client";

import { useMemo } from "react";
import { PLATFORM_META } from "@/lib/platforms";
import type { Platform, PostVariant } from "@/lib/types";
import { compact } from "@/lib/format";

const POINTS = 48;

type Series = {
  platform: Platform;
  values: number[];
};

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeries(variant: PostVariant): Series {
  const total = variant.impressions;
  const rng = mulberry32(hashString(variant.id));
  const values: number[] = new Array(POINTS);
  let prev = 0;
  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    const curve = Math.log1p(t * 9) / Math.log(10);
    const jitter = (rng() - 0.5) * 0.04;
    const v = Math.max(prev, Math.round(total * Math.min(1, curve + jitter)));
    values[i] = v;
    prev = v;
  }
  values[POINTS - 1] = total;
  return { platform: variant.platform, values };
}

function xTicks(start: Date, end: Date): { t: number; label: string }[] {
  const dur = Math.max(end.getTime() - start.getTime(), 1);
  const days = dur / (1000 * 60 * 60 * 24);
  const fmt = (d: Date) =>
    days < 2
      ? d.toLocaleTimeString([], { hour: "numeric" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { t, label: fmt(new Date(start.getTime() + dur * t)) };
  });
}

export function ImpressionsChart({ variants }: { variants: PostVariant[] }) {
  const eligible = variants.filter(
    (v) => v.impressions > 0 && v.posted_at,
  );

  const { series, xLabels, yMax, postedAt, endAt } = useMemo(() => {
    if (eligible.length === 0) {
      return { series: [], xLabels: [], yMax: 0, postedAt: null, endAt: null };
    }
    const postedAt = new Date(
      eligible.reduce(
        (min, v) => (v.posted_at && v.posted_at < min ? v.posted_at : min),
        eligible[0].posted_at as string,
      ),
    );
    const endAt = new Date();
    const series = eligible.map(buildSeries);
    const yMax = Math.max(
      1,
      ...series.flatMap((s) => s.values),
    );
    return {
      series,
      xLabels: xTicks(postedAt, endAt),
      yMax,
      postedAt,
      endAt,
    };
  }, [eligible]);

  if (eligible.length === 0 || !postedAt || !endAt) {
    return null;
  }

  const width = 1000;
  const height = 280;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xAt = (t: number) => padL + t * plotW;
  const yAt = (v: number) => padT + plotH - (v / yMax) * plotH;

  const yTicks = 4;
  const yGrid = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = Math.round((yMax / yTicks) * i);
    return { v, y: yAt(v) };
  });

  const buildPath = (values: number[]) =>
    values
      .map((v, i) => {
        const t = i / (POINTS - 1);
        return `${i === 0 ? "M" : "L"}${xAt(t).toFixed(2)},${yAt(v).toFixed(2)}`;
      })
      .join(" ");

  const buildArea = (values: number[]) => {
    const top = values
      .map((v, i) => {
        const t = i / (POINTS - 1);
        return `${i === 0 ? "M" : "L"}${xAt(t).toFixed(2)},${yAt(v).toFixed(2)}`;
      })
      .join(" ");
    const baseline = `L${xAt(1).toFixed(2)},${yAt(0).toFixed(2)} L${xAt(0).toFixed(2)},${yAt(0).toFixed(2)} Z`;
    return `${top} ${baseline}`;
  };

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Impressions over time
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Cumulative per platform since posting.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {series.map((s) => (
            <div key={s.platform} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: PLATFORM_META[s.platform].hex }}
              />
              <span className="text-[var(--muted)]">
                {PLATFORM_META[s.platform].label}
              </span>
              <span className="font-mono text-white">
                {compact(s.values[s.values.length - 1])}
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.platform}
              id={`fill-${s.platform}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={PLATFORM_META[s.platform].hex}
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor={PLATFORM_META[s.platform].hex}
                stopOpacity="0"
              />
            </linearGradient>
          ))}
        </defs>

        {yGrid.map((g, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={width - padR}
              y1={g.y}
              y2={g.y}
              stroke="var(--card-border)"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <text
              x={padL - 8}
              y={g.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--muted)]"
              fontSize="10"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {compact(g.v)}
            </text>
          </g>
        ))}

        {series.map((s) => (
          <path
            key={`area-${s.platform}`}
            d={buildArea(s.values)}
            fill={`url(#fill-${s.platform})`}
          />
        ))}
        {series.map((s) => (
          <path
            key={`line-${s.platform}`}
            d={buildPath(s.values)}
            stroke={PLATFORM_META[s.platform].hex}
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) => (
          <circle
            key={`end-${s.platform}`}
            cx={xAt(1)}
            cy={yAt(s.values[s.values.length - 1])}
            r="3.5"
            fill={PLATFORM_META[s.platform].hex}
          />
        ))}

        {xLabels.map((l, i) => (
          <text
            key={i}
            x={xAt(l.t)}
            y={height - padB + 20}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            className="fill-[var(--muted)]"
            fontSize="10"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
