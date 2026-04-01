"""Storage abstraction layer — supports local filesystem, SQL, and Elasticsearch.

Each storage backend implements the ``StorageBackend`` interface for saving
and listing crawled Markdown content.
"""

from __future__ import annotations

import os
import re
from abc import ABC, abstractmethod
from typing import Any


# ── Path helpers ──────────────────────────────────────────────────────────────


def sanitize_path_component(
    name: str,
    *,
    replace_slash: bool = True,
    replace_dash: bool = True,
    separator: str = "_",
) -> str:
    """Sanitize a single path component, preventing path traversal.

    Parameters
    ----------
    name:
        Raw path component (e.g. ``"owner/repo-name"``).
    replace_slash:
        If ``True``, replace ``/`` with *separator*.
    replace_dash:
        If ``True``, replace ``-`` with *separator*.
    separator:
        Character used as the replacement (default ``"_"``).

    Returns
    -------
    str
        A safe, flat filename string.
    """
    if replace_slash:
        name = name.replace("/", separator)
    name = name.replace("\\", separator)
    if replace_dash:
        name = name.replace("-", separator)
    # Remove other unsafe characters
    name = re.sub(r'[<>:"|?*]', separator, name)
    # Collapse runs of separators into one
    if separator:
        name = re.sub(re.escape(separator) + r"+", separator, name)
        name = name.strip(separator)
    # Strip leading dots to prevent hidden files / traversal
    name = name.lstrip(".")
    return name or "unnamed"


# ── Abstract backend ─────────────────────────────────────────────────────────


class StorageBackend(ABC):
    """Interface every storage backend must implement."""

    @abstractmethod
    async def save(self, owner: str, repo: str, file_path: str, content: str) -> str:
        """Persist a single Markdown file.

        Parameters
        ----------
        owner:
            Repository owner (GitHub username or org).
        repo:
            Repository name.
        file_path:
            Original relative path inside the repository (e.g. ``docs/guide.md``).
        content:
            UTF-8 text content of the file.

        Returns
        -------
        str
            An identifier for the saved resource (local path, DB id, ES doc id, …).
        """

    @abstractmethod
    async def list_files(self, owner: str, repo: str) -> list[str]:
        """Return identifiers of all files previously saved for *owner/repo*."""


# ── Local filesystem backend ─────────────────────────────────────────────────


class LocalStorageBackend(StorageBackend):
    """Save Markdown files to the local filesystem.

    Parameters
    ----------
    base_dir:
        Root directory for downloads.
    replace_slash:
        Replace ``/`` in path components with the separator.
    replace_dash:
        Replace ``-`` in path components with the separator.
    separator:
        The character used when replacing special characters (default ``"_"``).
    """

    def __init__(
        self,
        base_dir: str,
        *,
        replace_slash: bool = True,
        replace_dash: bool = True,
        separator: str = "_",
    ) -> None:
        self.base_dir = base_dir
        self.replace_slash = replace_slash
        self.replace_dash = replace_dash
        self.separator = separator

    def _repo_dir(self, owner: str, repo: str) -> str:
        safe_owner = sanitize_path_component(
            owner,
            replace_slash=self.replace_slash,
            replace_dash=self.replace_dash,
            separator=self.separator,
        )
        safe_repo = sanitize_path_component(
            repo,
            replace_slash=self.replace_slash,
            replace_dash=self.replace_dash,
            separator=self.separator,
        )
        repo_dir = os.path.join(self.base_dir, f"{safe_owner}_{safe_repo}")
        repo_dir = os.path.realpath(repo_dir)

        real_base = os.path.realpath(self.base_dir)
        if not repo_dir.startswith(real_base + os.sep) and repo_dir != real_base:
            raise ValueError("Invalid repository name — path escapes storage directory")
        return repo_dir

    async def save(self, owner: str, repo: str, file_path: str, content: str) -> str:
        repo_dir = self._repo_dir(owner, repo)
        os.makedirs(repo_dir, exist_ok=True)

        safe_relative = sanitize_path_component(
            file_path,
            replace_slash=self.replace_slash,
            replace_dash=self.replace_dash,
            separator=self.separator,
        )
        local_path = os.path.join(repo_dir, safe_relative)
        local_path = os.path.realpath(local_path)

        # Ensure the resolved path is still under repo_dir
        if not local_path.startswith(repo_dir + os.sep) and local_path != repo_dir:
            raise ValueError("File path escapes repo directory")

        local_dir = os.path.dirname(local_path)
        os.makedirs(local_dir, exist_ok=True)

        with open(local_path, "w", encoding="utf-8") as f:
            f.write(content)
        return local_path

    async def list_files(self, owner: str, repo: str) -> list[str]:
        repo_dir = self._repo_dir(owner, repo)
        if not os.path.isdir(repo_dir):
            return []
        results: list[str] = []
        for root, _dirs, files in os.walk(repo_dir):
            for fname in files:
                results.append(os.path.join(root, fname))
        return sorted(results)


# ── SQL backend ──────────────────────────────────────────────────────────────


class SQLStorageBackend(StorageBackend):
    """Store Markdown content in a relational database.

    Parameters
    ----------
    connection_url:
        Database connection URL (e.g. ``sqlite:///crawled.db``,
        ``postgresql://user:pass@host/db``).

    Notes
    -----
    This is a reference implementation using **SQLite** via the stdlib
    ``sqlite3`` module.  For production PostgreSQL / MySQL, swap in
    ``asyncpg`` or ``aiomysql``.
    """

    def __init__(self, connection_url: str) -> None:
        self.connection_url = connection_url
        self._ensure_table()

    def _get_db_path(self) -> str:
        """Extract file path from a ``sqlite:///`` URL."""
        if self.connection_url.startswith("sqlite:///"):
            return self.connection_url[len("sqlite:///"):]
        return self.connection_url

    def _ensure_table(self) -> None:
        import sqlite3

        db_path = self._get_db_path()
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        conn = sqlite3.connect(db_path)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS markdown_files (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                owner       TEXT NOT NULL,
                repo        TEXT NOT NULL,
                file_path   TEXT NOT NULL,
                content     TEXT NOT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(owner, repo, file_path)
            )
            """
        )
        conn.commit()
        conn.close()

    async def save(self, owner: str, repo: str, file_path: str, content: str) -> str:
        import sqlite3

        db_path = self._get_db_path()
        conn = sqlite3.connect(db_path)
        conn.execute(
            """
            INSERT INTO markdown_files (owner, repo, file_path, content)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(owner, repo, file_path) DO UPDATE SET
                content = excluded.content,
                created_at = CURRENT_TIMESTAMP
            """,
            (owner, repo, file_path, content),
        )
        conn.commit()
        conn.close()
        return f"sql://{owner}/{repo}/{file_path}"

    async def list_files(self, owner: str, repo: str) -> list[str]:
        import sqlite3

        db_path = self._get_db_path()
        conn = sqlite3.connect(db_path)
        cursor = conn.execute(
            "SELECT file_path FROM markdown_files WHERE owner = ? AND repo = ? ORDER BY file_path",
            (owner, repo),
        )
        results = [row[0] for row in cursor.fetchall()]
        conn.close()
        return results


# ── Elasticsearch backend ────────────────────────────────────────────────────


class ElasticsearchStorageBackend(StorageBackend):
    """Store Markdown content in Elasticsearch.

    Parameters
    ----------
    es_url:
        Elasticsearch base URL (e.g. ``http://localhost:9200``).
    index_name:
        Index to store documents in (default ``github_markdown``).

    Notes
    -----
    Uses plain ``httpx`` so no extra Elasticsearch client library is needed.
    """

    def __init__(
        self, es_url: str = "http://localhost:9200", index_name: str = "github_markdown"
    ) -> None:
        self.es_url = es_url.rstrip("/")
        self.index_name = index_name

    def _doc_id(self, owner: str, repo: str, file_path: str) -> str:
        return sanitize_path_component(
            f"{owner}/{repo}/{file_path}", replace_dash=False
        )

    async def save(self, owner: str, repo: str, file_path: str, content: str) -> str:
        import httpx

        doc_id = self._doc_id(owner, repo, file_path)
        url = f"{self.es_url}/{self.index_name}/_doc/{doc_id}"
        body = {
            "owner": owner,
            "repo": repo,
            "file_path": file_path,
            "content": content,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.put(
                url,
                json=body,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
        return f"es://{self.index_name}/{doc_id}"

    async def list_files(self, owner: str, repo: str) -> list[str]:
        import httpx

        url = f"{self.es_url}/{self.index_name}/_search"
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"owner": owner}},
                        {"term": {"repo": repo}},
                    ]
                }
            },
            "_source": ["file_path"],
            "size": 10000,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                json=query,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        return sorted(
            hit["_source"]["file_path"] for hit in data.get("hits", {}).get("hits", [])
        )


# ── Factory ──────────────────────────────────────────────────────────────────

BACKEND_TYPES = {
    "local": "LocalStorageBackend",
    "sql": "SQLStorageBackend",
    "elasticsearch": "ElasticsearchStorageBackend",
}


def create_backend(cfg: dict[str, Any]) -> StorageBackend:
    """Create a storage backend from configuration dict.

    Parameters
    ----------
    cfg:
        Must contain ``"type"`` (``"local"`` | ``"sql"`` | ``"elasticsearch"``).
        Additional keys depend on the backend:

        * **local** — ``storage_dir``, ``replace_slash``, ``replace_dash``, ``separator``
        * **sql** — ``connection_url``
        * **elasticsearch** — ``es_url``, ``index_name``

    Returns
    -------
    StorageBackend
    """
    backend_type = cfg.get("type", "local")

    if backend_type == "local":
        return LocalStorageBackend(
            base_dir=cfg.get("storage_dir", "downloads"),
            replace_slash=cfg.get("replace_slash", True),
            replace_dash=cfg.get("replace_dash", True),
            separator=cfg.get("separator", "_"),
        )
    elif backend_type == "sql":
        return SQLStorageBackend(
            connection_url=cfg.get("connection_url", "sqlite:///crawled.db"),
        )
    elif backend_type == "elasticsearch":
        return ElasticsearchStorageBackend(
            es_url=cfg.get("es_url", "http://localhost:9200"),
            index_name=cfg.get("index_name", "github_markdown"),
        )
    else:
        raise ValueError(f"Unknown storage backend type: {backend_type!r}")
