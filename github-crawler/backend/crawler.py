"""Core crawling logic — fetch markdown files from a GitHub repository."""

from __future__ import annotations

from typing import Any

import httpx

from storage import StorageBackend

GITHUB_API = "https://api.github.com"


def _headers(token: str = "") -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


async def list_markdown_files(
    owner: str, repo: str, *, path: str = "", token: str = ""
) -> list[dict[str, Any]]:
    """Recursively list all *.md* files in *owner/repo* starting from *path*.

    Returns a flat list of ``{"path": ..., "download_url": ...}`` dicts.
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=_headers(token))
        resp.raise_for_status()
        items = resp.json()

    if not isinstance(items, list):
        items = [items]

    md_files: list[dict[str, Any]] = []
    for item in items:
        if item["type"] == "file" and item["name"].lower().endswith(".md"):
            md_files.append(
                {"path": item["path"], "download_url": item["download_url"]}
            )
        elif item["type"] == "dir":
            children = await list_markdown_files(
                owner, repo, path=item["path"], token=token
            )
            md_files.extend(children)
    return md_files


async def download_markdown_files(
    owner: str,
    repo: str,
    backend: StorageBackend,
    *,
    token: str = "",
) -> list[str]:
    """Download every markdown file from *owner/repo* via *backend*.

    Parameters
    ----------
    owner:
        Repository owner.
    repo:
        Repository name.
    backend:
        A :class:`StorageBackend` instance to persist each file.
    token:
        Optional GitHub personal access token.

    Returns
    -------
    list[str]
        Identifiers of the saved resources (paths, DB ids, etc.).
    """
    md_files = await list_markdown_files(owner, repo, token=token)

    saved: list[str] = []
    async with httpx.AsyncClient(timeout=60) as client:
        for md in md_files:
            download_url = md["download_url"]
            if not download_url:
                continue
            resp = await client.get(download_url, headers=_headers(token))
            resp.raise_for_status()

            identifier = await backend.save(owner, repo, md["path"], resp.text)
            saved.append(identifier)

    return saved
