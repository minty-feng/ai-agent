"""Core crawling logic — fetch markdown files from a GitHub repository."""

import os
import re
from typing import Any

import httpx

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


def _sanitize_filename(name: str) -> str:
    """Replace characters that are unsafe in file-system paths."""
    return re.sub(r'[<>:"/\\|?*]', "_", name)


async def download_markdown_files(
    owner: str,
    repo: str,
    storage_dir: str,
    *,
    token: str = "",
) -> list[str]:
    """Download every markdown file from *owner/repo* into *storage_dir*.

    Returns the list of local file paths that were written.
    """
    md_files = await list_markdown_files(owner, repo, token=token)

    repo_dir = os.path.join(storage_dir, _sanitize_filename(f"{owner}__{repo}"))
    os.makedirs(repo_dir, exist_ok=True)

    saved: list[str] = []
    async with httpx.AsyncClient(timeout=60) as client:
        for md in md_files:
            download_url = md["download_url"]
            if not download_url:
                continue
            resp = await client.get(download_url, headers=_headers(token))
            resp.raise_for_status()

            relative = md["path"]
            local_path = os.path.join(repo_dir, _sanitize_filename(relative))
            local_dir = os.path.dirname(local_path)
            os.makedirs(local_dir, exist_ok=True)

            with open(local_path, "w", encoding="utf-8") as f:
                f.write(resp.text)
            saved.append(local_path)

    return saved
