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
    ADVANCED = "advanced"
    BY_ORG = "by_org"


def _headers(token: str = "") -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def _sort_params(sort_by: str = "best-match", sort_order: str = "desc") -> dict[str, str]:
    """Return sort/order params for the GitHub search API (omitted when best-match)."""
    if sort_by and sort_by != "best-match":
        return {"sort": sort_by, "order": sort_order}
    return {}


def _build_qualifiers(
    language: str = "",
    min_stars: int = 0,
    min_forks: int = 0,
    created_after: str = "",
    pushed_after: str = "",
) -> str:
    """Build a GitHub search qualifier string from optional filter values."""
    parts: list[str] = []
    if language:
        parts.append(f"language:{language}")
    if min_stars > 0:
        parts.append(f"stars:>={min_stars}")
    if min_forks > 0:
        parts.append(f"forks:>={min_forks}")
    if created_after:
        parts.append(f"created:>={created_after}")
    if pushed_after:
        parts.append(f"pushed:>={pushed_after}")
    return " ".join(parts)


async def search_by_repo_name(
    name: str,
    *,
    per_page: int = 10,
    page: int = 1,
    token: str = "",
    sort_by: str = "best-match",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Search repositories whose name matches *name*."""
    params: dict[str, Any] = {
        "q": f"{name} in:name",
        "per_page": per_page,
        "page": page,
        **_sort_params(sort_by, sort_order),
    }
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
    sort_by: str = "stars",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Search repositories with at least *min_stars* stars."""
    effective_sort = sort_by if sort_by != "best-match" else "stars"
    params: dict[str, Any] = {
        "q": f"{query} stars:>={min_stars}",
        "sort": effective_sort,
        "order": sort_order,
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
    sort_by: str = "best-match",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Search repositories filtered by programming language."""
    params: dict[str, Any] = {
        "q": f"{query} language:{language}",
        "per_page": per_page,
        "page": page,
        **_sort_params(sort_by, sort_order),
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
    sort_by: str = "best-match",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Search repositories by topic label."""
    params: dict[str, Any] = {
        "q": f"topic:{topic}",
        "per_page": per_page,
        "page": page,
        **_sort_params(sort_by, sort_order),
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            GITHUB_SEARCH_REPOS, params=params, headers=_headers(token)
        )
        resp.raise_for_status()
        return resp.json()


async def search_advanced(
    query: str,
    *,
    language: str = "",
    min_stars: int = 0,
    min_forks: int = 0,
    created_after: str = "",
    pushed_after: str = "",
    per_page: int = 10,
    page: int = 1,
    token: str = "",
    sort_by: str = "stars",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Advanced search combining a keyword with language, stars, forks, and date filters."""
    qualifiers = _build_qualifiers(language, min_stars, min_forks, created_after, pushed_after)
    q = f"{query} {qualifiers}".strip() if query else qualifiers
    effective_sort = sort_by if sort_by != "best-match" else "stars"
    params: dict[str, Any] = {
        "q": q,
        "sort": effective_sort,
        "order": sort_order,
        "per_page": per_page,
        "page": page,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            GITHUB_SEARCH_REPOS, params=params, headers=_headers(token)
        )
        resp.raise_for_status()
        return resp.json()


async def search_by_org(
    org: str,
    *,
    min_forks: int = 0,
    created_after: str = "",
    pushed_after: str = "",
    per_page: int = 10,
    page: int = 1,
    token: str = "",
    sort_by: str = "stars",
    sort_order: str = "desc",
) -> dict[str, Any]:
    """Search repositories belonging to a specific GitHub organization or user."""
    qualifiers = _build_qualifiers(
        min_forks=min_forks, created_after=created_after, pushed_after=pushed_after
    )
    q = f"org:{org} {qualifiers}".strip() if qualifiers else f"org:{org}"
    effective_sort = sort_by if sort_by != "best-match" else "stars"
    params: dict[str, Any] = {
        "q": q,
        "sort": effective_sort,
        "order": sort_order,
        "per_page": per_page,
        "page": page,
    }
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
    Strategy.ADVANCED: search_advanced,
    Strategy.BY_ORG: search_by_org,
}
