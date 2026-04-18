import random
from typing import TypedDict

class Metrics(TypedDict):
    impressions: int
    likes: int
    comments: int
    shares: int

_BASE: dict[str, Metrics] = {
    "linkedin": {"impressions": 2800, "likes": 120, "comments": 18, "shares": 9},
    "x": {"impressions": 4200, "likes": 95, "comments": 12, "shares": 22},
    "reddit": {"impressions": 1600, "likes": 180, "comments": 46, "shares": 3},
}


def _jitter(base: int, spread: float = 0.6) -> int:
    delta = base * spread
    return max(0, round(base + (random.random() * 2 - 1) * delta))


def seed_metrics(platform: str) -> Metrics:
    b = _BASE[platform]
    return {
        "impressions": _jitter(b["impressions"]),
        "likes": _jitter(b["likes"]),
        "comments": _jitter(b["comments"]),
        "shares": _jitter(b["shares"]),
    }
