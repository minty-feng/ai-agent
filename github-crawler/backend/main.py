"""FastAPI application — GitHub Markdown Crawler."""

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import AppConfig, StorageSettings, ensure_storage_dir, load_config, save_config
from crawler import download_markdown_files
from storage import StorageType, create_backend
from strategies import Strategy

app = FastAPI(
    title="GitHub Markdown Crawler",
    description="Search GitHub repositories and download their Markdown documentation.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


# ── Models ────────────────────────────────────────────────────────────────────


class ConfigUpdate(BaseModel):
    """Payload for updating application configuration."""

    storage_dir: str | None = None
    github_token: str | None = None
    storage_type: StorageType | None = None
    replace_slash: bool | None = None
    replace_dash: bool | None = None
    separator: str | None = None
    connection_url: str | None = None
    es_url: str | None = None
    index_name: str | None = None


class SearchRequest(BaseModel):
    """Payload for searching GitHub repositories."""

    strategy: Strategy
    query: str
    min_stars: int = 100
    language: str = "Python"
    per_page: int = 10
    page: int = 1


class FetchRequest(BaseModel):
    """Payload for fetching Markdown files from a repository."""

    owner: str
    repo: str


# ── Config endpoints ──────────────────────────────────────────────────────────


@app.get("/api/config")
def get_config() -> dict[str, Any]:
    """Return the current application configuration."""
    cfg = load_config()
    return {
        "storage_dir": cfg.storage.storage_dir,
        "has_token": bool(cfg.github_token),
        "storage_type": cfg.storage.type,
        "replace_slash": cfg.storage.replace_slash,
        "replace_dash": cfg.storage.replace_dash,
        "separator": cfg.storage.separator,
        "connection_url": cfg.storage.connection_url,
        "es_url": cfg.storage.es_url,
        "index_name": cfg.storage.index_name,
    }


@app.put("/api/config")
def update_config(body: ConfigUpdate) -> dict[str, str]:
    """Update application configuration (partial update)."""
    cfg = load_config()
    if body.storage_dir is not None:
        cfg.storage.storage_dir = body.storage_dir
    if body.github_token is not None:
        cfg.github_token = body.github_token
    if body.storage_type is not None:
        cfg.storage.type = body.storage_type
    if body.replace_slash is not None:
        cfg.storage.replace_slash = body.replace_slash
    if body.replace_dash is not None:
        cfg.storage.replace_dash = body.replace_dash
    if body.separator is not None:
        cfg.storage.separator = body.separator
    if body.connection_url is not None:
        cfg.storage.connection_url = body.connection_url
    if body.es_url is not None:
        cfg.storage.es_url = body.es_url
    if body.index_name is not None:
        cfg.storage.index_name = body.index_name
    save_config(cfg)
    return {"status": "ok"}


# ── Search endpoint ───────────────────────────────────────────────────────────


@app.post("/api/search")
async def search_repos(body: SearchRequest) -> dict[str, Any]:
    """Search GitHub repositories using the selected strategy.

    Supports ``page`` and ``per_page`` (size) for pagination.
    """
    from strategies import STRATEGY_MAP

    cfg = load_config()
    fn = STRATEGY_MAP[body.strategy]

    kwargs: dict[str, Any] = {
        "per_page": body.per_page,
        "page": body.page,
        "token": cfg.github_token,
    }
    if body.strategy == Strategy.STARS:
        kwargs["min_stars"] = body.min_stars
    if body.strategy == Strategy.LANGUAGE:
        kwargs["language"] = body.language

    try:
        data = await fn(body.query, **kwargs)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    repos = []
    for item in data.get("items", []):
        repos.append(
            {
                "full_name": item["full_name"],
                "owner": item["owner"]["login"],
                "name": item["name"],
                "description": item.get("description", ""),
                "stars": item["stargazers_count"],
                "language": item.get("language", ""),
                "url": item["html_url"],
            }
        )
    return {
        "total_count": data.get("total_count", 0),
        "page": body.page,
        "per_page": body.per_page,
        "repos": repos,
    }


# ── Fetch markdown endpoint ──────────────────────────────────────────────────


@app.post("/api/fetch")
async def fetch_markdown(body: FetchRequest) -> dict[str, Any]:
    """Download all Markdown files from the specified repository."""
    cfg = load_config()

    # Build storage backend from config
    backend_cfg = cfg.storage.model_dump()
    if cfg.storage.type == "local":
        ensure_storage_dir(cfg.storage.storage_dir)
    backend = create_backend(backend_cfg)

    try:
        saved = await download_markdown_files(
            body.owner, body.repo, backend, token=cfg.github_token
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {
        "owner": body.owner,
        "repo": body.repo,
        "storage_type": cfg.storage.type,
        "files_saved": len(saved),
        "paths": saved,
    }
