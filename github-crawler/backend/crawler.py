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


def _sanitize_path_component(name: str) -> str:
    """Sanitize a single path component, preventing path traversal."""
    # Remove any path separators and traversal sequences
    name = name.replace("/", "_").replace("\\", "_")
    name = re.sub(r'[<>:"|?*]', "_", name)
    # Strip leading dots to prevent hidden files / traversal
    name = name.lstrip(".")
    return name or "unnamed"


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

    safe_owner = _sanitize_path_component(owner)
    safe_repo = _sanitize_path_component(repo)
    repo_dir = os.path.join(storage_dir, f"{safe_owner}__{safe_repo}")
    repo_dir = os.path.realpath(repo_dir)

    # Ensure the resolved repo_dir is still inside storage_dir
    real_storage = os.path.realpath(storage_dir)
    if not repo_dir.startswith(real_storage + os.sep) and repo_dir != real_storage:
        raise ValueError("Invalid repository name — path escapes storage directory")

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
            safe_relative = _sanitize_path_component(relative)
            local_path = os.path.join(repo_dir, safe_relative)
            local_path = os.path.realpath(local_path)

            # Ensure the resolved path is still under repo_dir
            if not local_path.startswith(repo_dir + os.sep) and local_path != repo_dir:
                continue

            local_dir = os.path.dirname(local_path)
            os.makedirs(local_dir, exist_ok=True)

            with open(local_path, "w", encoding="utf-8") as f:
                f.write(resp.text)
            saved.append(local_path)

    return saved
