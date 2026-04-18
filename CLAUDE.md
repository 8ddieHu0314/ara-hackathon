@AGENTS.md

# Relay — hackathon notes

Relay is a Next.js 16 (App Router) + Supabase + Ara Cloud API hackathon project. Founders paste a raw post, Ara tailors it per-platform, user reviews, one click publishes to LinkedIn, X, Reddit (X is mocked; LinkedIn/Reddit go through an Ara agent with connector tools).

## Where Ara is called

- `lib/ara.ts` -> `tailorVariants` uses `POST /llm/v1/chat/completions` (OpenAI-compatible).
- `lib/ara.ts` -> `publishViaAraAgent` uses `POST /v1/agents/{ARA_AGENT_ID}/chat`. If `ARA_AGENT_ID` is empty, it cleanly degrades to a mock response so the demo runs without Ara credentials.

## Demo safety nets

- Missing Supabase env: dashboard still renders with an inline error and empty state.
- Missing Ara env: API routes return a clear 502 with the error message.
- X posting is always mocked.
