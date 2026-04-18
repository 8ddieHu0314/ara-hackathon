# Signal

> One post, every platform. Draft once, let Ara tailor it for LinkedIn, X, and Reddit, then publish with a single click.

Built for the Ara hackathon. Next.js 16 + the Ara Cloud API. Posts are persisted to a local JSON file (`data/store.json`) — no database required.

## What it does

1. **Paste** a raw post (any tone, any length).
2. **Tailor with Ara** — the Ara LLM gateway rewrites it in the native style of each platform (professional storytelling for LinkedIn, punchy hook for X, community-first for Reddit).
3. **Review & edit** each variant. Per-platform character counters.
4. **Publish**. LinkedIn and Reddit post through your connected Ara agent; X is mocked for the demo.
5. **Dashboard** — per-post, per-platform breakdown of (mocked) impressions, likes, comments, shares.

## How Ara is used

- `POST /v1/agents/{agent_id}/chat` — Signal sends every LLM call through an Ara agent. The agent generates the three platform-specific drafts, and (when LinkedIn/Reddit connectors are enabled on it) calls the matching connector tools to post the approved content.
- If `ARA_AGENT_ID` or `ARA_AGENT_KEY` is not set, every platform falls back to a mock publish so the demo still works end-to-end without connector setup.

## Setup

### 1. Ara

1. Sign in at `app.ara.so` and grab an account API key → that's `ARA_API_KEY`.
2. In `app.ara.so`, connect the **LinkedIn** and **Reddit** toolkits (OAuth).
3. Create an **Agent** with those connectors enabled — `.env.local.example` shows the exact curl commands to mint the agent and its runtime key.
4. *(Optional — skip this and every platform mocks cleanly.)*

### 2. Environment

```bash
cp .env.local.example .env.local
# fill in values
```

### 3. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Posts you publish land in `data/store.json`. Delete the file to reset the demo.

## File map

```
app/
  api/tailor/route.ts    POST raw text -> Ara agent -> 3 variants
  api/publish/route.ts   POST variants -> Ara agent posts + local JSON persist
  page.tsx               compose screen
  dashboard/page.tsx     list of posts + aggregate metrics
  dashboard/[id]/page.tsx per-post breakdown
components/
  compose.tsx            draft -> review -> publish flow
  platform-badge.tsx
lib/
  ara.ts                 Ara agent chat client (tailoring + publishing)
  store.ts               file-backed post/variant store (data/store.json)
  queries.ts             read helpers re-exported from store.ts
  platforms.ts           per-platform style prompts + char limits
  mock-metrics.ts        seeded per-platform metric jitter
  types.ts, format.ts, cn.ts
```

## Demo tips

- Click **Try example** on the compose screen for a realistic founder-style draft.
- Toggle platforms off with the pills if you want to publish to a subset.
- Without Ara credentials, publishing still works — every variant ends up with status `Mocked` and seeded analytics so the dashboard is populated.
