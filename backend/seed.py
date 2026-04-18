"""Populate backend/data/store.json with hand-crafted sample posts.

Run from the backend/ directory with the venv active:
    python seed.py           # wipes and seeds
    python seed.py --append  # keep existing posts, add seeded ones

The goal is to make the dashboard look alive for the demo without requiring
any real Ara posting. Every variant is already "posted" with seeded
metrics that match its platform profile (X volume, LinkedIn engagement,
Reddit comment-heavy).
"""

from __future__ import annotations

import argparse
import json
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from mock_metrics import seed_metrics

_DEFAULT_STORE = Path(__file__).resolve().parent / "data" / "store.json"
STORE_PATH = Path(os.environ.get("ARA_STORE_PATH") or _DEFAULT_STORE).resolve()

# --- Curated sample posts (original drafts + per-platform variants) ---

SAMPLES: list[dict] = [
    {
        "days_ago": 1,
        "original": (
            "Shipped Signal 2.0 today. One paste → three platform-native drafts → one-click publish. "
            "Took 4 months longer than the first version. Worth every day."
        ),
        "linkedin": (
            "Shipping Signal 2.0 today.\n\n"
            "Four months longer than we estimated. Worth every week.\n\n"
            "The first version let founders distribute a single post to LinkedIn, X, and Reddit. "
            "The second version does it well. The gap between those two sentences is where we spent the last quarter.\n\n"
            "Per-platform AI tailoring that respects your voice. Real connector-backed publishing. "
            "A dashboard that actually tells you where your content landed.\n\n"
            "What's the longest you've spent rebuilding something that already technically worked?\n\n"
            "#buildinpublic #founders #ai #startups"
        ),
        "x": (
            "Signal 2.0 is live.\n\n"
            "Paste once. Three platform-native drafts. One click to ship.\n\n"
            "Took 4 months longer than v1. Best thing we've built."
        ),
        "reddit": (
            "Finally shipped the v2 of our distribution tool today and I'm exhausted in the good way.\n\n"
            "V1 worked — you could take one post and it'd fan out to LinkedIn, X, and Reddit. But it was mechanical. "
            "The same text crammed into three character limits. Nobody was actually using it after week two.\n\n"
            "So we spent four months rebuilding the tailoring pipeline. Per-platform style prompts, connector-backed "
            "posting, a proper dashboard. Everything that sounded trivial on a whiteboard took three revisions and "
            "a weekend each.\n\n"
            "Not asking for upvotes, just curious — how do the builders in here handle the second version of something "
            "that already technically worked? How do you decide it's worth it?"
        ),
        "base_metrics": {"linkedin": 1.4, "x": 1.2, "reddit": 1.1},
    },
    {
        "days_ago": 3,
        "original": (
            "Hot take: 'AI will commoditize content' is wrong. AI commoditizes mediocre content. "
            "The ceiling just moved."
        ),
        "linkedin": (
            "Hot take: AI won't commoditize content. It will commoditize mediocre content.\n\n"
            "The floor is rising fast. The ceiling is rising faster.\n\n"
            "Every founder I know who treats AI as a replacement for thinking produces forgettable output. "
            "Every founder who treats it as a leverage tool is doing the best work of their career.\n\n"
            "The gap between those two groups is widening, not narrowing. Pick a side.\n\n"
            "#ai #content #leadership"
        ),
        "x": (
            "\"AI will commoditize content.\"\n\n"
            "Wrong.\n\n"
            "AI commoditizes *mediocre* content. The ceiling just moved."
        ),
        "reddit": (
            "Been thinking a lot about the doomer take that AI is going to flatten content into a grey paste. "
            "I don't buy it, and I think the framing is wrong.\n\n"
            "What I'm actually seeing: the floor is rising fast — anyone can generate a passable blog post now. "
            "But the ceiling is rising too, because the people who already knew how to think clearly are using "
            "AI as a multiplier, not a crutch.\n\n"
            "The gap between those two groups is widening, not narrowing. Curious if others here are seeing the same — "
            "or if you think the commoditization argument holds up?"
        ),
        "base_metrics": {"linkedin": 2.1, "x": 2.4, "reddit": 1.8},
    },
    {
        "days_ago": 5,
        "original": (
            "We hit $1M ARR this morning. 22 months from first line of code. "
            "Feels wild to type."
        ),
        "linkedin": (
            "$1M ARR this morning.\n\n"
            "22 months from first line of code.\n\n"
            "Things I thought would matter: the launch video, the Product Hunt day, the fundraising round.\n\n"
            "Things that actually mattered: shipping on Wednesdays, replying to every single support email for "
            "the first 14 months, firing the one hire that didn't fit before it infected the team.\n\n"
            "To the 3,400 customers who bet on us when we were clearly unfinished — thank you. "
            "We're just getting started.\n\n"
            "#milestone #saas #startups #founders #buildinpublic"
        ),
        "x": (
            "$1M ARR this morning.\n\n"
            "22 months from first line of code.\n\n"
            "Still feels fake to type."
        ),
        "reddit": (
            "Hit $1M ARR today and I wanted to share some things that were wildly different from what I expected "
            "going in, since this sub helped me a lot early on.\n\n"
            "Things I thought would be the inflection points: the polished launch video, PH #1, our seed round. "
            "None of those moved the needle the way I thought they would.\n\n"
            "Things that actually moved it: shipping every single Wednesday no matter what, replying to every "
            "support email personally for the first 14 months, and firing a bad hire early instead of hoping it'd "
            "work out.\n\n"
            "22 months from commit #1. Happy to answer questions about any part of the journey if it helps anyone "
            "in an earlier stage."
        ),
        "base_metrics": {"linkedin": 3.2, "x": 3.8, "reddit": 2.5},
    },
    {
        "days_ago": 8,
        "original": (
            "We're hiring our first dedicated designer. Remote, senior, full-time. "
            "DM me if you want the JD."
        ),
        "linkedin": (
            "We're hiring our first dedicated designer at Signal.\n\n"
            "The brief is simple: own the entire product surface. Every screen, every interaction, every pixel.\n\n"
            "We're looking for someone who can move from a Figma idea to a shipped feature in the same week, who "
            "cares about micro-interactions as much as information architecture, and who wants to shape a product "
            "from the ~15k-user mark.\n\n"
            "Senior, full-time, remote (US/EU). Comment or DM if you'd like the full JD.\n\n"
            "#hiring #design #remote #startup"
        ),
        "x": (
            "Hiring our first dedicated designer.\n\n"
            "Senior. Full-time. Remote. US/EU.\n\n"
            "You'd own the whole product. Reply or DM for the JD."
        ),
        "reddit": (
            "We're hiring our first in-house designer and I wanted to post here because every single designer we've "
            "loved working with came through a community like this, never through a job board.\n\n"
            "The role: senior product designer, remote (US/EU), fully own the product surface. You'd ship from day "
            "one, not sit in meetings. We're at ~15k active users and our current design is held together by "
            "duct tape and my own terrible CSS.\n\n"
            "Open to all seniority discussions. Happy to chat even if you're just curious. DM me and I'll send the "
            "full JD + comp range."
        ),
        "base_metrics": {"linkedin": 1.6, "x": 0.7, "reddit": 1.4},
    },
    {
        "days_ago": 12,
        "original": (
            "Spent 3 days chasing a bug that only happened on Tuesdays at 2pm ET. "
            "Turned out to be a cron misconfigured in UTC. Debugging is 80% timezone."
        ),
        "linkedin": (
            "Spent three full days chasing a bug that only happened on Tuesdays at 2pm ET.\n\n"
            "Not Wednesdays. Not 1pm. Not other regions. Just that one window.\n\n"
            "Turned out: a cron I wrote eight months ago was configured in UTC, not ET. The 2pm window was really "
            "6pm UTC — the exact moment a batch job we'd added later was clearing the cache the cron expected.\n\n"
            "Debugging is 80% timezones and the other 20% is believing the user the first time.\n\n"
            "What's the weirdest bug you've shipped?\n\n"
            "#engineering #startups #buildinpublic"
        ),
        "x": (
            "3 days chasing a bug that only hit Tuesdays at 2pm ET.\n\n"
            "Cron was in UTC. 2pm ET = 6pm UTC = right when another job cleared the cache.\n\n"
            "Debugging is 80% timezones."
        ),
        "reddit": (
            "Going to vent because I just closed a bug ticket that took three days and I need this on the internet.\n\n"
            "Symptom: one specific customer reported the app hanging every Tuesday around 2pm ET. Only Tuesdays. "
            "Only 2pm. Only that one window. For weeks I assumed it was user error, until a second customer "
            "reported the same pattern.\n\n"
            "Eight months ago I wrote a cron job in UTC. 2pm ET is 6pm UTC — which happens to be exactly when a "
            "separate batch job I added four months later clears a cache the cron expected to be warm. "
            "Three-way time zone collision.\n\n"
            "Lesson I'm apparently doomed to relearn: when a user says the app breaks on a specific weekday, "
            "believe them immediately, don't spend a week assuming they're confused. What's the weirdest timezone "
            "bug you've ever shipped?"
        ),
        "base_metrics": {"linkedin": 1.3, "x": 1.9, "reddit": 2.3},
    },
    {
        "days_ago": 17,
        "original": (
            "Looking for 10 early users for our new AI research assistant. "
            "You get lifetime access, we get honest feedback."
        ),
        "linkedin": (
            "Looking for 10 early users for our new AI research assistant.\n\n"
            "What you get: lifetime access. Permanent. No renewal, no tier dance.\n\n"
            "What I get: your honest, unfiltered, sometimes-brutal feedback. Plus the occasional 15-minute call "
            "when I want to dig into something.\n\n"
            "Ideal candidates: founders, researchers, analysts — anyone who spends real time synthesizing sources "
            "into decisions. Not looking for mass users. Looking for careful ones.\n\n"
            "Comment 'in' or DM and I'll send the access link today.\n\n"
            "#buildinpublic #betatesters #ai"
        ),
        "x": (
            "Looking for 10 early users for a new AI research assistant.\n\n"
            "You get lifetime access. I get your honest feedback.\n\n"
            "Reply 'in' and I'll DM you."
        ),
        "reddit": (
            "Hey — we've been building an AI research assistant for the last six months and we're ready for a "
            "real user cohort. Looking for exactly 10 people.\n\n"
            "What I'm offering: lifetime access to the product, no subscription, no renewal, no tier game. Permanent.\n\n"
            "What I'm asking: your honest feedback. Which means you'll probably hate parts of it for the first "
            "month, and I want to hear exactly what and why. Plus the occasional 15-minute call when I want to "
            "dig into something.\n\n"
            "Ideal fit: founders, researchers, analysts — anyone who spends real time turning scattered sources "
            "into decisions. If that's you, drop a comment and I'll DM the access link."
        ),
        "base_metrics": {"linkedin": 1.0, "x": 0.8, "reddit": 1.6},
    },
]


def _platform_mix(sample: dict) -> list[tuple[str, str, float]]:
    """Return [(platform, content, metric_multiplier)] for a sample."""
    out = []
    for p in ("linkedin", "x", "reddit"):
        content = sample[p]
        mul = sample["base_metrics"].get(p, 1.0)
        out.append((p, content, mul))
    return out


def _scale_metrics(platform: str, mul: float) -> dict:
    m = seed_metrics(platform)
    return {k: max(0, round(v * mul)) for k, v in m.items()}


def _build() -> dict:
    posts, variants = [], []
    now = datetime.now(timezone.utc)

    for sample in SAMPLES:
        post_id = str(uuid.uuid4())
        created = now - timedelta(
            days=sample["days_ago"],
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )
        posts.append(
            {
                "id": post_id,
                "original_text": sample["original"],
                "created_at": created.isoformat(),
            }
        )
        for platform, content, mul in _platform_mix(sample):
            status = "mocked"
            url = {
                "linkedin": f"https://www.linkedin.com/feed/update/demo-{uuid.uuid4().hex[:10]}",
                "x": f"https://x.com/demo/status/{uuid.uuid4().hex[:12]}",
                "reddit": f"https://reddit.com/r/demo/comments/{uuid.uuid4().hex[:8]}",
            }[platform]
            metrics = _scale_metrics(platform, mul)
            variants.append(
                {
                    "id": str(uuid.uuid4()),
                    "post_id": post_id,
                    "platform": platform,
                    "content": content,
                    "status": status,
                    "platform_post_url": url,
                    "error": None,
                    "posted_at": created.isoformat(),
                    **metrics,
                }
            )

    # newest first (the frontend sorts too, but keep the file tidy)
    posts.sort(key=lambda p: p["created_at"], reverse=True)
    return {"posts": posts, "variants": variants}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--append",
        action="store_true",
        help="Keep existing posts in store.json, append the seeded set",
    )
    args = parser.parse_args()

    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    seeded = _build()

    if args.append and STORE_PATH.exists():
        existing = json.loads(STORE_PATH.read_text(encoding="utf-8"))
        existing["posts"] = (existing.get("posts") or []) + seeded["posts"]
        existing["variants"] = (existing.get("variants") or []) + seeded["variants"]
        existing["posts"].sort(key=lambda p: p["created_at"], reverse=True)
        to_write = existing
    else:
        to_write = seeded

    STORE_PATH.write_text(json.dumps(to_write, indent=2), encoding="utf-8")
    print(
        f"Wrote {len(to_write['posts'])} posts / {len(to_write['variants'])} variants "
        f"to {STORE_PATH}"
    )


if __name__ == "__main__":
    main()
