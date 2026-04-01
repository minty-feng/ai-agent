"""Core crawling logic — fetch markdown files from a GitHub repository."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx

from storage import StorageBackend

GITHUB_API = "https://api.github.com"
RAW_CONTENT_BASE = "https://raw.githubusercontent.com"


def _headers(token: str = "") -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


async def list_markdown_files(
    owner: str, repo: str, *, path: str = "", token: str = ""
) -> list[dict[str, Any]]:
    """List all *.md* files in *owner/repo* using the Git Trees API.

    Uses a single recursive API call instead of one call per directory,
    which avoids hitting GitHub's rate limit on large repositories.

    Returns a flat list of ``{"path": ..., "download_url": ...}`` dicts.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        # Fetch the default branch name
        repo_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}", headers=_headers(token)
        )
        repo_resp.raise_for_status()
        default_branch = repo_resp.json()["default_branch"]

        # Fetch the full recursive tree in one API call
        tree_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{quote(default_branch, safe='')}",
            params={"recursive": "1"},
            headers=_headers(token),
        )
        tree_resp.raise_for_status()
        tree_data = tree_resp.json()

    if tree_data.get("truncated"):
        raise RuntimeError(
            f"Repository {owner}/{repo} has too many files: the file tree was truncated "
            "by GitHub. Try crawling a specific subdirectory using the 'path' parameter, "
            "or use a GitHub token to increase your rate limit allowance."
        )

    prefix = f"{path}/" if path else ""
    md_files: list[dict[str, Any]] = []
    for item in tree_data.get("tree", []):
        if item.get("type") != "blob":
            continue
        file_path: str = item["path"]
        if not file_path.lower().endswith(".md"):
            continue
        if prefix and not file_path.startswith(prefix):
            continue
        encoded_path = "/".join(quote(seg, safe="") for seg in file_path.split("/"))
        download_url = (
            f"{RAW_CONTENT_BASE}/{owner}/{repo}"
            f"/{quote(default_branch, safe='')}/{encoded_path}"
        )
        md_files.append({"path": file_path, "download_url": download_url})

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
