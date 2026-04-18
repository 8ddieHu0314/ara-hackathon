# Signal backend

FastAPI service. Persists posts to `backend/data/store.json`, calls Ara for
tailoring, and triggers a deployed Ara Automation (`poster.py`) for connector-backed
posting to LinkedIn and Reddit.

## Setup

```bash
cd backend

# 1. Python env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Env vars
cp .env.example .env
# fill in ARA_API_KEY, ARA_AGENT_ID, ARA_AGENT_KEY

# 3. Deploy the Automation (creates the Ara app that runs inside Ara's sandbox
#    with access to the LinkedIn + Reddit connectors enabled on your account).
ARA_API_KEY=$(grep ARA_API_KEY .env | cut -d= -f2) ara deploy poster.py
#
# The command prints JSON with "app_id" and a runtime key. Copy both into .env:
#   ARA_APP_ID=app_...
#   ARA_APP_KEY=<runtime key>
```

## Run

```bash
source .venv/bin/activate
# load env
set -a && . .env && set +a
uvicorn main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/health`

## Endpoints

- `POST /tailor` — `{ text, platforms? }` → `{ variants }`
- `POST /publish` — `{ originalText, variants[] }` → `{ postId, results[] }`
- `GET  /posts` — list all posts + variants
- `GET  /posts/{id}` — single post + variants
- `GET  /health`

## How posting works

- **X** → always mocked.
- **LinkedIn / Reddit** → `POST /v1/apps/{ARA_APP_ID}/run` with `{"input":{"platform","content"}}`.
  The deployed `poster.py` Automation runs inside Ara's sandbox, uses the
  `LINKEDIN_CREATE_LINKED_IN_POST` / `REDDIT_SUBMIT_POST` connector tools,
  and returns a one-line JSON `{ok, url, error}`.
- If `ARA_APP_ID` / `ARA_APP_KEY` are empty, LinkedIn/Reddit fall back to mocked responses so the UI still works end-to-end.

## Reset

```bash
rm backend/data/store.json
```
