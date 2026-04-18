# Relay

> One post, every platform. Draft once, let Ara tailor it for LinkedIn, X, and Reddit, then publish with a single click.

Built for the Ara hackathon. Next.js 16 + Supabase + the Ara Cloud API.

## What it does

1. **Paste** a raw post (any tone, any length).
2. **Tailor with Ara** — the Ara LLM gateway rewrites it in the native style of each platform (professional storytelling for LinkedIn, punchy hook for X, community-first for Reddit).
3. **Review & edit** each variant. Per-platform character counters.
4. **Publish**. LinkedIn and Reddit post through your connected Ara agent; X is mocked for the demo.
5. **Dashboard** — per-post, per-platform breakdown of (mocked) impressions, likes, comments, shares.

## How Ara is used

- `POST /llm/v1/chat/completions` — Ara acts as the LLM that generates the three platform-specific drafts.
- `POST /v1/agents/{agent_id}/chat` — Ara's agent runtime calls the LinkedIn and Reddit connector tools you enabled in `app.ara.so`, posting the approved content on your behalf.
- If `ARA_AGENT_ID` is not set, every platform falls back to a mock publish so the demo still works end-to-end without connector setup.

## Setup

### 1. Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy the project URL, anon key, and service role key from Project Settings → API.

### 2. Ara

1. Sign in at `app.ara.so` and grab an account API key → that's `ARA_API_KEY`.
2. In `app.ara.so`, connect the **LinkedIn** and **Reddit** toolkits (OAuth).
3. Create an **Agent** with those connectors enabled. Paste its ID into `ARA_AGENT_ID`.
4. *(Optional — skip this and every platform mocks cleanly.)*

### 3. Environment

```bash
cp .env.local.example .env.local
# fill in values
```

### 4. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## File map

```
app/
  api/tailor/route.ts    POST raw text -> Ara LLM -> 3 variants
  api/publish/route.ts   POST variants -> Ara agent posts + Supabase persist
  page.tsx               compose screen
  dashboard/page.tsx     list of posts + aggregate metrics
  dashboard/[id]/page.tsx per-post breakdown
components/
  compose.tsx            draft -> review -> publish flow
  platform-badge.tsx
lib/
  ara.ts                 Ara LLM + agent client
  supabase.ts            service-role Supabase client
  platforms.ts           per-platform style prompts + char limits
  mock-metrics.ts        seeded per-platform metric jitter
  queries.ts             Supabase reads
  types.ts, format.ts, cn.ts
supabase/schema.sql      run once in the Supabase SQL editor
```

## Demo tips

- Click **Try example** on the compose screen for a realistic founder-style draft.
- Toggle platforms off with the pills if you want to publish to a subset.
- Without Ara credentials, publishing still works — every variant ends up with status `Mocked` and seeded analytics so the dashboard is populated.
