import type { Platform } from "./types";

export const PLATFORMS: Platform[] = ["linkedin", "x", "reddit"];

export const PLATFORM_META: Record<
  Platform,
  { label: string; hex: string; charLimit: number; handle: string }
> = {
  linkedin: { label: "LinkedIn", hex: "#0A66C2", charLimit: 3000, handle: "in" },
  x: { label: "X", hex: "#000000", charLimit: 280, handle: "x" },
  reddit: { label: "Reddit", hex: "#FF4500", charLimit: 40000, handle: "r" },
};

export const PLATFORM_STYLE: Record<Platform, string> = {
  linkedin:
    "Tone: professional, reflective, thought-leadership. Structure: a strong 1-line hook, a short story or insight (3-5 short paragraphs, single-sentence paragraphs are fine), then a question that invites discussion. Allow 3-5 relevant hashtags at the end. Avoid emoji unless crucial. Max ~1200 characters.",
  x:
    "Tone: punchy, conversational, high signal. Single tweet: max 270 characters. Lead with a hook that stands alone. No hashtags unless they add real context. Drop filler words. Use line breaks sparingly.",
  reddit:
    "Tone: genuine, community-first, first-person. Format: a compelling title-less body, written like a post in a relevant subreddit. Give context, the specific story, and end with an open-ended question. No marketing speak, no hashtags, no emojis. 2-5 short paragraphs.",
};
