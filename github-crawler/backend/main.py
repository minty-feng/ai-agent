"""FastAPI application — GitHub Markdown Crawler."""

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import AppConfig, ensure_storage_dir, load_config, save_config
from crawler import download_markdown_files
from strategies import Strategy

app = FastAPI(title="GitHub Markdown Crawler")

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
    storage_dir: str | None = None
    github_token: str | None = None


class SearchRequest(BaseModel):
    strategy: Strategy
    query: str
    min_stars: int = 100
    language: str = "Python"
    per_page: int = 10
    page: int = 1


class FetchRequest(BaseModel):
    owner: str
    repo: str


# ── Config endpoints ──────────────────────────────────────────────────────────


@app.get("/api/config")
def get_config() -> dict[str, Any]:
    cfg = load_config()
    return {
        "storage_dir": cfg.storage_dir,
        "has_token": bool(cfg.github_token),
    }


@app.put("/api/config")
def update_config(body: ConfigUpdate) -> dict[str, str]:
    cfg = load_config()
    if body.storage_dir is not None:
        cfg.storage_dir = body.storage_dir
    if body.github_token is not None:
        cfg.github_token = body.github_token
    save_config(cfg)
    return {"status": "ok"}


# ── Search endpoint ───────────────────────────────────────────────────────────


@app.post("/api/search")
async def search_repos(body: SearchRequest) -> dict[str, Any]:
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
    return {"total_count": data.get("total_count", 0), "repos": repos}


# ── Fetch markdown endpoint ──────────────────────────────────────────────────


@app.post("/api/fetch")
async def fetch_markdown(body: FetchRequest) -> dict[str, Any]:
    cfg = load_config()
    storage = ensure_storage_dir(cfg.storage_dir)

    try:
        saved = await download_markdown_files(
            body.owner, body.repo, storage, token=cfg.github_token
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {
        "owner": body.owner,
        "repo": body.repo,
        "files_saved": len(saved),
        "paths": saved,
    }
