# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Signal — hackathon notes

Signal is a split-architecture hackathon project:

- **Frontend**: Next.js 16 (App Router) + React 19. UI only. `app/api/*` routes are thin proxies to the Python backend. No Ara logic, no persistence.
- **Backend**: Python FastAPI in `backend/`. Owns the JSON store at `backend/data/store.json` and all Ara Cloud API calls.
- **Ara Automation**: `backend/poster.py`, deployed to Ara's sandbox via the `ara` CLI. This is the only surface that can call Composio connector tools (LinkedIn, Reddit).

## Commands

Frontend (repo root):
- `npm run dev` — Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint

Backend (`backend/`):
- `source .venv/bin/activate && set -a && . .env && set +a`
- `uvicorn main:app --reload --port 8000` — FastAPI
- `ara deploy poster.py` — deploy the Automation (one-time per code change)

## Architecture

```
Browser → Next.js :3000 → FastAPI :8000 → api.ara.so
                                           ├── /v1/agents/{id}/chat  (tailoring)
                                           └── /v1/apps/{id}/run     (posting via poster.py)
```

### Why the split

The `/v1/agents/{id}/chat` endpoint is a plain LLM gateway — no sandbox, no connector access. Only deployed Automations (`/v1/apps/{id}/run`) run inside Ara's sandbox where runtime connector tools (LINKEDIN_CREATE_LINKED_IN_POST, REDDIT_SUBMIT_POST, etc.) are auto-available.

Splitting into a Python backend lets us use `ara-sdk` and the `ara` CLI idiomatically for authoring + deploying the Automation.

### Frontend → Backend boundary

- `lib/backend.ts` — `backendFetch(path, init)` wraps fetch with `BACKEND_URL` (default `http://localhost:8000`).
- `lib/queries.ts` — server-component reads: `listPostsWithVariants`, `getPostWithVariants`, both hit FastAPI `/posts`.
- `app/api/tailor/route.ts`, `app/api/publish/route.ts` — one-liner proxies that stream the request body to FastAPI and forward the response.

### Backend flow (`backend/main.py`)

1. `POST /tailor` → builds a system prompt per `platforms.py` style strings, calls `POST /v1/agents/{ARA_AGENT_ID}/chat` with Bearer `ARA_AGENT_KEY`, strict-JSON parses per-platform. Falls back to `_mock_tailor` if agent env is missing.
2. `POST /publish` → for each variant, runs `_publish_one`:
   - X → always mocked
   - LinkedIn / Reddit → `POST /v1/apps/{ARA_APP_ID}/run` with Bearer `ARA_APP_KEY` and `{"input":{"platform","content"}}`. The Automation returns a one-line JSON `{ok,url,error}` which the backend parses out of the response envelope.
   - If `ARA_APP_ID` / `ARA_APP_KEY` are empty, LinkedIn/Reddit mock cleanly.
3. Successful variants get `seed_metrics(platform)` mock numbers, then the whole post+variants bundle is written via `create_post_with_variants` in `store.py`.

### Automation (`backend/poster.py`)

Single `ara.Automation("signal-poster", system_instructions=...)`. Connector tools are enabled by default (`allow_connector_tools=True`). The instructions tell the model to call `LINKEDIN_CREATE_LINKED_IN_POST` or `REDDIT_SUBMIT_POST` based on the `platform` field in the input payload, then reply with a one-line JSON envelope.

Deploying: `ara deploy poster.py` returns `app_id` + runtime key — populate `ARA_APP_ID` and `ARA_APP_KEY` in `backend/.env`.

### Data layer

- `backend/store.py` — async JSON store at `backend/data/store.json` (gitignored). Async lock + atomic rename (temp file + `os.replace`).
- No database. Delete the file to reset the demo.

### Platform config

- Backend: `backend/main.py` holds `PLATFORM_META` + `PLATFORM_STYLE` (what goes into the tailor prompt).
- Frontend: `lib/platforms.ts` holds `PLATFORM_META` + `PLATFORM_STYLE` for UI-side char counters and pill labels.

These are duplicated intentionally — the backend owns what Ara sees, the frontend owns what the user sees. Keep them in sync when editing.

## Environment

**Root `.env`** — frontend only:
- `BACKEND_URL` (optional, defaults to `http://localhost:8000`)

**`backend/.env`** — everything else:
- `ARA_API_KEY`, `ARA_API_BASE_URL` (optional)
- `ARA_AGENT_ID`, `ARA_AGENT_KEY` — required for real tailoring
- `ARA_APP_ID`, `ARA_APP_KEY` — required for real LinkedIn/Reddit posting
- `ARA_STORE_PATH` (optional, defaults to `./data/store.json`)

## Demo safety nets

- Missing Ara agent env → `/tailor` returns `_mock_tailor` output.
- Missing Ara app env → `/publish` mocks LinkedIn/Reddit.
- X posting is always mocked — do not wire a real X connector without updating `backend/main.py`.
