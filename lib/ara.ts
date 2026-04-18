import type { Platform } from "./types";
import { PLATFORM_META, PLATFORM_STYLE } from "./platforms";

const DEFAULT_BASE = "https://api.ara.so";

function baseUrl(): string {
  return (process.env.ARA_API_BASE_URL ?? DEFAULT_BASE).replace(/\/+$/, "");
}

function agentAuth(): { agentId: string; agentKey: string } | null {
  const agentId = process.env.ARA_AGENT_ID?.trim();
  const agentKey = process.env.ARA_AGENT_KEY?.trim();
  if (!agentId || !agentKey) return null;
  return { agentId, agentKey };
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function agentChat(messages: ChatMessage[]): Promise<string> {
  const auth = agentAuth();
  if (!auth) {
    throw new Error(
      "Ara agent not configured. Set ARA_AGENT_ID and ARA_AGENT_KEY in .env.local.",
    );
  }
  const res = await fetch(
    `${baseUrl()}/v1/agents/${encodeURIComponent(auth.agentId)}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.agentKey}`,
      },
      body: JSON.stringify({ messages, stream: false }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ara agent ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    message?: { content?: string };
    content?: string;
  };
  const content =
    data.choices?.[0]?.message?.content ??
    data.message?.content ??
    data.content;
  if (!content) throw new Error("Ara agent response missing content");
  return content;
}

function buildTailorPrompt(raw: string, platforms: Platform[]): ChatMessage[] {
  const styleBlocks = platforms
    .map(
      (p) =>
        `### ${p}\nChar limit: ${PLATFORM_META[p].charLimit}\nStyle: ${PLATFORM_STYLE[p]}`,
    )
    .join("\n\n");

  const system = `You are a senior social media editor for a startup founder. You rewrite a single raw post into platform-native versions. Preserve the author's voice and core message, but adapt tone, length, hooks, and formatting to each platform.

Platforms and styles:
${styleBlocks}

Return ONLY valid JSON matching this exact shape, no markdown fence, no commentary:
{${platforms.map((p) => `"${p}": "..."`).join(",")}}`;

  const user = `Raw post from the founder:\n\n"""\n${raw}\n"""\n\nRewrite it for each platform. JSON only.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function tailorVariants(
  raw: string,
  platforms: Platform[],
): Promise<Record<Platform, string>> {
  const content = await agentChat(buildTailorPrompt(raw, platforms));
  const stripped = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(
        `Could not parse Ara response as JSON: ${stripped.slice(0, 200)}`,
      );
    }
    parsed = JSON.parse(match[0]);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Ara response is not an object");
  }
  const result = {} as Record<Platform, string>;
  for (const p of platforms) {
    const v = (parsed as Record<string, unknown>)[p];
    if (typeof v !== "string") {
      throw new Error(`Ara response missing string for platform '${p}'`);
    }
    result[p] = v.trim();
  }
  return result;
}

export type PublishResult = {
  ok: boolean;
  url?: string;
  error?: string;
  mocked: boolean;
};

export async function publishViaAraAgent(
  platform: Platform,
  content: string,
): Promise<PublishResult> {
  if (!agentAuth()) {
    return { ok: true, mocked: true, url: mockUrl(platform) };
  }

  const toolHint =
    platform === "linkedin"
      ? "Use the LinkedIn connector (e.g. LINKEDIN_CREATE_LINKED_IN_POST) to post the exact content verbatim to the connected account."
      : "Use the Reddit connector (e.g. REDDIT_SUBMIT_POST) to submit the exact content verbatim to the connected account. If a subreddit is required, pick a reasonable default such as 'u_' + username (the user's personal profile).";

  const instruction = `Please post the following content to ${platform} now.

${toolHint}

Return a single-line JSON object with keys "ok" (boolean), "url" (string, public URL of the created post if known, else empty), and "error" (string, empty on success). Do not add any prose outside the JSON.

Content to post:
"""
${content}
"""`;

  try {
    const text = await agentChat([{ role: "user", content: instruction }]);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as {
          ok?: boolean;
          url?: string;
          error?: string;
        };
        return {
          ok: Boolean(parsed.ok),
          url: parsed.url || undefined,
          error: parsed.error || undefined,
          mocked: false,
        };
      } catch {
        // fall through to generic success
      }
    }
    return { ok: true, mocked: false };
  } catch (e) {
    return {
      ok: false,
      mocked: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function mockUrl(platform: Platform): string {
  const id = Math.random().toString(36).slice(2, 10);
  if (platform === "x") return `https://x.com/demo/status/${id}`;
  if (platform === "linkedin")
    return `https://www.linkedin.com/feed/update/demo-${id}`;
  return `https://reddit.com/r/demo/comments/${id}`;
}

export function mockTailor(
  raw: string,
  platforms: Platform[],
): Record<Platform, string> {
  const trimmed = raw.trim();
  const result = {} as Record<Platform, string>;
  for (const p of platforms) {
    const limit = PLATFORM_META[p].charLimit;
    const label = PLATFORM_META[p].label;
    const base = `[${label} draft — Ara not configured]\n\n${trimmed}`;
    result[p] = base.length > limit ? base.slice(0, limit - 3) + "..." : base;
  }
  return result;
}

export function hasAraAgent(): boolean {
  return agentAuth() !== null;
}
