from __future__ import annotations

import asyncio
import json
import os
import random
import re
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from mock_metrics import seed_metrics
from store import (
    create_post_with_variants,
    get_post_with_variants,
    list_posts_with_variants,
)

app = FastAPI(title="Signal backend")

ARA_API_BASE_URL = os.environ.get("ARA_API_BASE_URL", "https://api.ara.so").rstrip("/")
ARA_API_KEY = os.environ.get("ARA_API_KEY", "").strip()
ARA_AGENT_ID = os.environ.get("ARA_AGENT_ID", "").strip()
ARA_AGENT_KEY = os.environ.get("ARA_AGENT_KEY", "").strip()
ARA_APP_ID = os.environ.get("ARA_APP_ID", "").strip()
ARA_APP_KEY = os.environ.get("ARA_APP_KEY", "").strip()

Platform = Literal["linkedin", "x", "reddit"]
PLATFORMS: tuple[Platform, ...] = ("linkedin", "x", "reddit")

PLATFORM_META = {
    "linkedin": {"label": "LinkedIn", "charLimit": 3000},
    "x": {"label": "X", "charLimit": 280},
    "reddit": {"label": "Reddit", "charLimit": 40000},
}

PLATFORM_STYLE = {
    "linkedin": (
        "Tone: professional, reflective, thought-leadership. Structure: a strong "
        "1-line hook, a short story or insight (3-5 short paragraphs, "
        "single-sentence paragraphs are fine), then a question that invites "
        "discussion. Allow 3-5 relevant hashtags at the end. Avoid emoji unless "
        "crucial. Max ~1200 characters."
    ),
    "x": (
        "Tone: punchy, conversational, high signal. Single tweet: max 270 "
        "characters. Lead with a hook that stands alone. No hashtags unless "
        "they add real context. Drop filler words. Use line breaks sparingly."
    ),
    "reddit": (
        "Tone: genuine, community-first, first-person. Format: a compelling "
        "title-less body, written like a post in a relevant subreddit. Give "
        "context, the specific story, and end with an open-ended question. "
        "No marketing speak, no hashtags, no emojis. 2-5 short paragraphs."
    ),
}


def _has_ara_agent() -> bool:
    return bool(ARA_AGENT_ID and ARA_AGENT_KEY)


def _has_ara_app() -> bool:
    return bool(ARA_APP_ID and ARA_APP_KEY)


def _mock_url(platform: Platform) -> str:
    rid = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))
    if platform == "x":
        return f"https://x.com/demo/status/{rid}"
    if platform == "linkedin":
        return f"https://www.linkedin.com/feed/update/demo-{rid}"
    return f"https://reddit.com/r/demo/comments/{rid}"


def _mock_tailor(raw: str, platforms: list[Platform]) -> dict[Platform, str]:
    out: dict[Platform, str] = {}
    for p in platforms:
        label = PLATFORM_META[p]["label"]
        limit = PLATFORM_META[p]["charLimit"]
        base = f"[{label} draft — Ara not configured]\n\n{raw.strip()}"
        out[p] = base if len(base) <= limit else base[: limit - 3] + "..."
    return out


# ---------------------------- tailor ----------------------------

class TailorRequest(BaseModel):
    text: str
    platforms: list[Platform] | None = None


async def _tailor_variants(raw: str, platforms: list[Platform]) -> dict[Platform, str]:
    style_blocks = "\n\n".join(
        f"### {p}\nChar limit: {PLATFORM_META[p]['charLimit']}\nStyle: {PLATFORM_STYLE[p]}"
        for p in platforms
    )
    system = (
        "You are a senior social media editor for a startup founder. "
        "You rewrite a single raw post into platform-native versions. "
        "Preserve the author's voice and core message, but adapt tone, "
        "length, hooks, and formatting to each platform.\n\n"
        f"Platforms and styles:\n{style_blocks}\n\n"
        "Return ONLY valid JSON matching this exact shape, no markdown fence, "
        "no commentary:\n"
        "{" + ",".join(f'"{p}":"..."' for p in platforms) + "}"
    )
    user = f"Raw post from the founder:\n\n\"\"\"\n{raw}\n\"\"\"\n\nRewrite it for each platform. JSON only."

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"{ARA_API_BASE_URL}/v1/agents/{ARA_AGENT_ID}/chat",
            headers={
                "Authorization": f"Bearer {ARA_AGENT_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "stream": False,
            },
        )
    if res.status_code >= 400:
        raise HTTPException(502, f"Ara agent {res.status_code}: {res.text[:400]}")
    data = res.json()
    content = (
        (data.get("choices") or [{}])[0].get("message", {}).get("content")
        or data.get("message", {}).get("content")
        or data.get("content")
    )
    if not content:
        raise HTTPException(502, "Ara agent response missing content")

    stripped = content.strip()
    stripped = re.sub(r"^```(?:json)?", "", stripped, flags=re.I).strip()
    stripped = re.sub(r"```$", "", stripped, flags=re.I).strip()
    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", stripped)
        if not m:
            raise HTTPException(502, f"Could not parse Ara response: {stripped[:200]}")
        parsed = json.loads(m.group(0))
    if not isinstance(parsed, dict):
        raise HTTPException(502, "Ara response is not an object")

    out: dict[Platform, str] = {}
    for p in platforms:
        v = parsed.get(p)
        if not isinstance(v, str):
            raise HTTPException(502, f"Ara response missing string for '{p}'")
        out[p] = v.strip()
    return out


@app.post("/tailor")
async def tailor(req: TailorRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(400, "'text' is required")
    platforms = req.platforms or list(PLATFORMS)
    platforms = [p for p in platforms if p in PLATFORMS]
    if not platforms:
        platforms = list(PLATFORMS)
    if not _has_ara_agent():
        return {"variants": _mock_tailor(text, platforms), "mocked": True}
    variants = await _tailor_variants(text, platforms)
    return {"variants": variants}


# ---------------------------- publish ----------------------------

class VariantIn(BaseModel):
    platform: Platform
    content: str


class PublishRequest(BaseModel):
    originalText: str
    variants: list[VariantIn]


async def _run_app_post(platform: Platform, content: str) -> dict:
    """Trigger the deployed Ara Automation to post via the connector."""
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(
            f"{ARA_API_BASE_URL}/v1/apps/{ARA_APP_ID}/run",
            headers={
                "Authorization": f"Bearer {ARA_APP_KEY}",
                "Content-Type": "application/json",
            },
            json={"input": {"platform": platform, "content": content}},
        )
    if res.status_code >= 400:
        return {"ok": False, "mocked": False, "error": f"Ara app {res.status_code}: {res.text[:300]}"}

    try:
        body = res.json()
    except Exception:
        return {"ok": False, "mocked": False, "error": f"Non-JSON response: {res.text[:200]}"}

    # The Automation returns a single-line JSON. The response envelope varies;
    # scan likely fields for the payload string.
    text = ""
    for key in ("output", "result", "content"):
        v = body.get(key)
        if isinstance(v, str) and v:
            text = v
            break
        if isinstance(v, dict):
            t = v.get("content") or v.get("text")
            if isinstance(t, str):
                text = t
                break
    if not text:
        # last-ditch: stringify whole body
        text = json.dumps(body)

    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            parsed = json.loads(m.group(0))
            return {
                "ok": bool(parsed.get("ok")),
                "url": parsed.get("url") or None,
                "error": parsed.get("error") or None,
                "mocked": False,
            }
        except json.JSONDecodeError:
            pass
    return {"ok": True, "mocked": False, "url": None, "error": None}


async def _publish_one(v: VariantIn) -> dict:
    if v.platform == "x":
        return {"ok": True, "mocked": True, "url": _mock_url("x"), "error": None}
    if not _has_ara_app():
        return {"ok": True, "mocked": True, "url": _mock_url(v.platform), "error": None}
    return await _run_app_post(v.platform, v.content)


@app.post("/publish")
async def publish(req: PublishRequest):
    text = req.originalText.strip()
    if not text:
        raise HTTPException(400, "'originalText' is required")
    variants = [v for v in req.variants if v.content.strip()]
    if not variants:
        raise HTTPException(400, "At least one variant required")

    results = await asyncio.gather(*(_publish_one(v) for v in variants))

    now_iso = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()

    variant_rows = []
    for v, r in zip(variants, results):
        if r["ok"]:
            status = "mocked" if r.get("mocked") else "posted"
        else:
            status = "failed"
        metrics = (
            seed_metrics(v.platform)
            if status in ("posted", "mocked")
            else {"impressions": 0, "likes": 0, "comments": 0, "shares": 0}
        )
        variant_rows.append(
            {
                "platform": v.platform,
                "content": v.content.strip(),
                "status": status,
                "platform_post_url": r.get("url"),
                "error": r.get("error"),
                "posted_at": None if status == "failed" else now_iso,
                **metrics,
            }
        )

    saved = await create_post_with_variants(text, variant_rows)
    return {
        "postId": saved["id"],
        "results": [
            {
                "platform": v["platform"],
                "status": v["status"],
                "url": v["platform_post_url"],
                "error": v["error"],
            }
            for v in saved["variants"]
        ],
    }


# ---------------------------- posts ----------------------------


@app.get("/posts")
async def list_posts():
    return {"posts": await list_posts_with_variants()}


@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    post = await get_post_with_variants(post_id)
    if not post:
        raise HTTPException(404, "Not found")
    return post


@app.get("/health")
async def health():
    return {
        "ok": True,
        "ara_agent_configured": _has_ara_agent(),
        "ara_app_configured": _has_ara_app(),
    }
