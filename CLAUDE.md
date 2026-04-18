# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Relay — hackathon notes

Relay is a Next.js 16 (App Router) + React 19 + Supabase + Ara Cloud API hackathon project. Founders paste a raw post, Ara tailors it per-platform, user reviews, one click publishes to LinkedIn, X, Reddit (X is mocked; LinkedIn/Reddit go through an Ara agent with connector tools).

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (`eslint-config-next`)

No test runner is configured.

## Architecture

Two-screen app: a compose screen (`app/page.tsx` → `components/compose.tsx`) and a dashboard (`app/dashboard/page.tsx`, `app/dashboard/[id]/page.tsx`). The flow is:

1. Client POSTs raw text + selected platforms to `app/api/tailor/route.ts`.
2. If `hasAraAgent()` returns false, the route returns `mockTailor` output — otherwise it calls `tailorVariants`, which hits `POST /v1/agents/{ARA_AGENT_ID}/chat` with Bearer `ARA_AGENT_KEY` and parses strict JSON keyed by platform out of the agent's reply.
3. User edits the variants, then client POSTs them to `app/api/publish/route.ts`.
4. That route inserts a `posts` row, then in parallel calls `publishViaAraAgent` per platform (X is hard-coded to mock). The Ara agent is instructed to return a single-line JSON `{ok,url,error}` which the route parses. Successful variants get seeded mock metrics from `lib/mock-metrics.ts` and are inserted into `post_variants`.

### Ara integration points (`lib/ara.ts`)

Two-layer auth: account-scoped `ARA_API_KEY` is only used for agent/app **management** endpoints (`/agents`, `/agents/{id}/keys`). Runtime chat against `/v1/agents/{id}/chat` requires an **agent-scoped** key (`ak_live_...`) in `ARA_AGENT_KEY`. The `/llm/v1/chat/completions` endpoint is for Ara's internal sandbox and cannot be called with either — don't reintroduce it.

- `agentChat` — shared helper, POSTs messages to `/v1/agents/{ARA_AGENT_ID}/chat` with Bearer `ARA_AGENT_KEY`. Returns OpenAI-shaped `choices[0].message.content`. Throws if either env is missing.
- `tailorVariants` — wraps `agentChat` with a per-platform system prompt and parses the JSON reply. Strips ``` fences, falls back to regex-extracting the first `{...}` block.
- `publishViaAraAgent` — wraps `agentChat` with a "use the LinkedIn/Reddit connector to post this" instruction. Tool hints: `LINKEDIN_CREATE_LINKED_IN_POST`, `REDDIT_SUBMIT_POST`.
- `hasAraAgent()` / `mockTailor()` / `mockUrl()` — fallback helpers so tailoring and publishing both degrade cleanly when `ARA_AGENT_ID` or `ARA_AGENT_KEY` is unset.

### Data layer

- Service-role Supabase client in `lib/supabase.ts` (lazy singleton, `persistSession: false`). API routes use it directly — RLS is intentionally not set up; this is a single-tenant demo.
- Schema lives in `supabase/schema.sql` (`posts`, `post_variants` with unique `(post_id, platform)`). Run once in the Supabase SQL editor.
- Reads go through `lib/queries.ts` (used by server components in `app/dashboard/*`).

### Platform config

`lib/platforms.ts` is the single source of truth for platform identity, char limits, and the style guidance fed into the tailor prompt. Adding/removing a platform means editing this file, the `Platform` union in `lib/types.ts`, and the schema's `check` constraint.

## Demo safety nets

- Missing Supabase env: dashboard still renders with an inline error and empty state.
- Missing Ara agent env: `/api/tailor` returns `mockTailor` output; `/api/publish` mocks every platform — the UI still flows through to the dashboard.
- X posting is always mocked — do not wire a real X connector without also updating `app/api/publish/route.ts`.

## Required env (`.env.local`)

`ARA_API_KEY`, `ARA_API_BASE_URL` (optional, defaults to `https://api.ara.so`), `ARA_AGENT_ID`, `ARA_AGENT_KEY` (both required for real Ara calls; otherwise mock mode), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. See `.env.local.example` for the exact curl commands that mint `ARA_AGENT_ID` and `ARA_AGENT_KEY`.
