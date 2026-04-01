"""GitHub crawling strategies for discovering repositories."""

from enum import Enum
from typing import Any

import httpx

GITHUB_API = "https://api.github.com"
GITHUB_SEARCH_REPOS = f"{GITHUB_API}/search/repositories"


class Strategy(str, Enum):
    REPO_NAME = "repo_name"
    STARS = "stars"
    LANGUAGE = "language"
    TOPIC = "topic"


def _headers(token: str = "") -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


async def search_by_repo_name(
    name: str,
    *,
    per_page: int = 10,
    page: int = 1,
    token: str = "",
) -> dict[str, Any]:
    """Search repositories whose name matches *name*."""
    params = {"q": f"{name} in:name", "per_page": per_page, "page": page}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            GITHUB_SEARCH_REPOS, params=params, headers=_headers(token)
        )
        resp.raise_for_status()
        return resp.json()


async def search_by_stars(
    query: str,
    *,
    min_stars: int = 100,
    per_page: int = 10,
    page: int = 1,
    token: str = "",
) -> dict[str, Any]:
    """Search repositories with at least *min_stars* stars."""
    params = {
        "q": f"{query} stars:>={min_stars}",
        "sort": "stars",
        "order": "desc",
        "per_page": per_page,
        "page": page,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            GITHUB_SEARCH_REPOS, params=params, headers=_headers(token)
        )
        resp.raise_for_status()
        return resp.json()


async def search_by_language(
    query: str,
    *,
    language: str = "Python",
    per_page: int = 10,
    page: int = 1,
    token: str = "",
) -> dict[str, Any]:
    """Search repositories filtered by programming language."""
    params = {
        "q": f"{query} language:{language}",
        "per_page": per_page,
        "page": page,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            GITHUB_SEARCH_REPOS, params=params, headers=_headers(token)
        )
        resp.raise_for_status()
        return resp.json()


async def search_by_topic(
    topic: str,
    *,
    per_page: int = 10,
    page: int = 1,
    token: str = "",
) -> dict[str, Any]:
    """Search repositories by topic label."""
    params = {"q": f"topic:{topic}", "per_page": per_page, "page": page}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            GITHUB_SEARCH_REPOS, params=params, headers=_headers(token)
        )
        resp.raise_for_status()
        return resp.json()


STRATEGY_MAP = {
    Strategy.REPO_NAME: search_by_repo_name,
    Strategy.STARS: search_by_stars,
    Strategy.LANGUAGE: search_by_language,
    Strategy.TOPIC: search_by_topic,
}
