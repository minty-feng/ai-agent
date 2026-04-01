"""Application configuration with persistence."""

import json
import os
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel

CONFIG_FILE = Path(__file__).parent / "app_config.json"
DEFAULT_STORAGE_DIR = str(Path(__file__).parent / "downloads")


class StorageSettings(BaseModel):
    """Settings for the storage backend.

    Attributes
    ----------
    type:
        Backend type — ``"local"``, ``"sql"``, or ``"elasticsearch"``.
    storage_dir:
        (local) Root directory for downloaded files.
    replace_slash:
        (local) Replace ``/`` with separator in file paths.
    replace_dash:
        (local) Replace ``-`` with separator in file paths.
    separator:
        (local) Character used when replacing special characters.
    connection_url:
        (sql) Database connection URL.
    es_url:
        (elasticsearch) Elasticsearch base URL.
    index_name:
        (elasticsearch) Elasticsearch index name.
    """

    type: Literal["local", "sql", "elasticsearch"] = "local"
    # Local backend options
    storage_dir: str = DEFAULT_STORAGE_DIR
    replace_slash: bool = True
    replace_dash: bool = True
    separator: str = "_"
    # SQL backend options
    connection_url: str = "sqlite:///crawled.db"
    # Elasticsearch backend options
    es_url: str = "http://localhost:9200"
    index_name: str = "github_markdown"


class AppConfig(BaseModel):
    """Top-level application configuration.

    Attributes
    ----------
    storage:
        Storage backend settings.
    github_token:
        Optional GitHub personal access token for higher rate limits.
    """

    storage: StorageSettings = StorageSettings()
    github_token: str = ""

    # Backward compatibility: expose storage_dir at top level
    @property
    def storage_dir(self) -> str:
        return self.storage.storage_dir

    @storage_dir.setter
    def storage_dir(self, value: str) -> None:
        self.storage.storage_dir = value


def load_config() -> AppConfig:
    """Load configuration from the JSON file, falling back to defaults."""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Backward compatibility: migrate flat storage_dir to nested storage
        if "storage_dir" in data and "storage" not in data:
            data["storage"] = {"storage_dir": data.pop("storage_dir")}
        return AppConfig(**data)
    return AppConfig()


def save_config(config: AppConfig) -> None:
    """Persist configuration to disk."""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2, ensure_ascii=False)


def ensure_storage_dir(path: str) -> str:
    """Create the storage directory if it does not exist."""
    os.makedirs(path, exist_ok=True)
    return path
