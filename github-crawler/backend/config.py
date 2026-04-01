"""Application configuration with persistence."""

import json
import os
from pathlib import Path

from pydantic import BaseModel

CONFIG_FILE = Path(__file__).parent / "app_config.json"
DEFAULT_STORAGE_DIR = str(Path(__file__).parent / "downloads")


class AppConfig(BaseModel):
    storage_dir: str = DEFAULT_STORAGE_DIR
    github_token: str = ""


def load_config() -> AppConfig:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return AppConfig(**data)
    return AppConfig()


def save_config(config: AppConfig) -> None:
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2, ensure_ascii=False)


def ensure_storage_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path
