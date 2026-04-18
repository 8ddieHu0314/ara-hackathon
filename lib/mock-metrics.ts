import type { Platform } from "./types";

type Metrics = {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
};

const BASE: Record<Platform, Metrics> = {
  linkedin: { impressions: 2800, likes: 120, comments: 18, shares: 9 },
  x: { impressions: 4200, likes: 95, comments: 12, shares: 22 },
  reddit: { impressions: 1600, likes: 180, comments: 46, shares: 3 },
};

function jitter(base: number, spread = 0.6): number {
  const delta = base * spread;
  return Math.max(0, Math.round(base + (Math.random() * 2 - 1) * delta));
}

export function seedMetrics(platform: Platform): Metrics {
  const b = BASE[platform];
  return {
    impressions: jitter(b.impressions),
    likes: jitter(b.likes),
    comments: jitter(b.comments),
    shares: jitter(b.shares),
  };
}
