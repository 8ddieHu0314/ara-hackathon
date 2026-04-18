# Signal

> One post, every platform. Draft once, let Ara tailor it for LinkedIn, X, and Reddit, then publish with a single click.

Built for the Ara hackathon.

## Architecture

```
Browser
  ↓
Next.js 16 frontend (port 3000) — UI only; API routes are thin proxies
  ↓
Python FastAPI backend (port 8000) — owns the JSON store and all Ara calls
  ↓
Ara Cloud (api.ara.so)
  ├── /v1/agents/{id}/chat        → per-platform tailoring (Sonnet 4.6)
  └── /v1/apps/{id}/run           → deployed `poster.py` Automation posts
                                    via LinkedIn + Reddit connectors
```

## What it does

1. **Paste** a raw post (any tone, any length).
2. **Tailor with Signal** — Ara rewrites it in the native style of each platform.
3. **Review & edit** each variant.
4. **Publish**. LinkedIn and Reddit go through a deployed Ara Automation with connector access; X is mocked.
5. **Dashboard** — per-post breakdown with seeded mock metrics.

## Setup

### 1. Python backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# fill in ARA_API_KEY, ARA_AGENT_ID, ARA_AGENT_KEY

# Deploy the Automation that does the actual posting.
# This uploads poster.py to the Ara sandbox so it can call connector tools.
set -a && . .env && set +a
ara deploy poster.py
#   -> copy the printed app_id + runtime key into .env as
#      ARA_APP_ID and ARA_APP_KEY
```

Also make sure LinkedIn and Reddit are connected on your Ara account at https://app.ara.so.

### 2. Frontend

```bash
# root of the repo
npm install
cp .env.local.example .env.local   # optional; only if you change backend URL
```

## Run

```bash
# terminal 1 — backend
cd backend && source .venv/bin/activate && set -a && . .env && set +a
uvicorn main:app --reload --port 8000

# terminal 2 — frontend
npm run dev
```

Open <http://localhost:3000>.

## Degradation behavior

- **No Ara agent configured** (no `ARA_AGENT_ID` / `ARA_AGENT_KEY`): tailoring returns a labelled placeholder per platform.
- **Ara agent but no deployed Automation** (no `ARA_APP_ID` / `ARA_APP_KEY`): tailoring works via real Ara, publishing to LinkedIn/Reddit mocks out.
- **X** is always mocked.

## File map

```
backend/
  main.py          FastAPI — /tailor, /publish, /posts, /posts/{id}, /health
  store.py         async JSON store, file-backed (data/store.json)
  mock_metrics.py  seeded per-platform metric jitter
  poster.py        Ara Automation — deployed via `ara deploy`
  requirements.txt fastapi, uvicorn, httpx, pydantic, ara-sdk
  .env.example
app/
  page.tsx                compose screen
  api/tailor/route.ts     proxies to FastAPI /tailor
  api/publish/route.ts    proxies to FastAPI /publish
  dashboard/page.tsx      server component — fetches /posts from FastAPI
  dashboard/[id]/page.tsx server component — fetches /posts/{id}
components/
  compose.tsx platform-badge.tsx
lib/
  backend.ts      fetch helper with BACKEND_URL env
  queries.ts      server-side reads that hit FastAPI /posts
  platforms.ts    char limits + style prompts (shared shape with backend)
  types.ts format.ts cn.ts
```

## Reset

```bash
rm backend/data/store.json
```
