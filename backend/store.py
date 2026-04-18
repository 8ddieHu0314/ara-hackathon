from __future__ import annotations

import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_STORE_PATH = Path(os.environ.get("ARA_STORE_PATH", "./data/store.json")).resolve()
_LOCK = asyncio.Lock()


async def _read() -> dict[str, list[dict[str, Any]]]:
    try:
        raw = await asyncio.to_thread(_STORE_PATH.read_text, encoding="utf-8")
    except FileNotFoundError:
        return {"posts": [], "variants": []}
    parsed = json.loads(raw) or {}
    return {
        "posts": list(parsed.get("posts") or []),
        "variants": list(parsed.get("variants") or []),
    }


async def _write(data: dict[str, list[dict[str, Any]]]) -> None:
    await asyncio.to_thread(_STORE_PATH.parent.mkdir, parents=True, exist_ok=True)
    tmp = _STORE_PATH.with_suffix(_STORE_PATH.suffix + f".{os.getpid()}.tmp")
    await asyncio.to_thread(tmp.write_text, json.dumps(data, indent=2), encoding="utf-8")
    await asyncio.to_thread(os.replace, tmp, _STORE_PATH)


async def create_post_with_variants(
    original_text: str, variants: list[dict[str, Any]]
) -> dict[str, Any]:
    async with _LOCK:
        data = await _read()
        post = {
            "id": str(uuid.uuid4()),
            "original_text": original_text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        materialized = [
            {"id": str(uuid.uuid4()), "post_id": post["id"], **v} for v in variants
        ]
        data["posts"].insert(0, post)
        data["variants"].extend(materialized)
        await _write(data)
        return {**post, "variants": materialized}


async def list_posts_with_variants() -> list[dict[str, Any]]:
    data = await _read()
    posts = sorted(data["posts"], key=lambda p: p["created_at"], reverse=True)
    return [
        {**p, "variants": [v for v in data["variants"] if v["post_id"] == p["id"]]}
        for p in posts
    ]


async def get_post_with_variants(post_id: str) -> dict[str, Any] | None:
    data = await _read()
    post = next((p for p in data["posts"] if p["id"] == post_id), None)
    if not post:
        return None
    variants = [v for v in data["variants"] if v["post_id"] == post_id]
    return {**post, "variants": variants}
