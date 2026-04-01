"""Tests for the GitHub Markdown Crawler backend."""

import json
import os
import tempfile

import pytest
from config import AppConfig, StorageSettings, load_config, save_config, ensure_storage_dir
from strategies import Strategy, STRATEGY_MAP
from storage import (
    sanitize_path_component,
    LocalStorageBackend,
    SQLStorageBackend,
    create_backend,
)


# ── Config tests ──────────────────────────────────────────────────────────────


def test_app_config_defaults():
    cfg = AppConfig()
    assert cfg.storage.storage_dir != ""
    assert cfg.github_token == ""
    assert cfg.storage.type == "local"
    assert cfg.storage.separator == "_"
    assert cfg.storage.replace_slash is True
    assert cfg.storage.replace_dash is True


def test_save_and_load_config(tmp_path, monkeypatch):
    cfg_file = tmp_path / "test_config.json"
    monkeypatch.setattr("config.CONFIG_FILE", cfg_file)

    cfg = AppConfig(
        storage=StorageSettings(storage_dir="/tmp/test-downloads"),
        github_token="tok_123",
    )
    save_config(cfg)

    loaded = load_config()
    assert loaded.storage.storage_dir == "/tmp/test-downloads"
    assert loaded.github_token == "tok_123"


def test_backward_compat_flat_storage_dir(tmp_path, monkeypatch):
    """Old config files with flat storage_dir should still load."""
    cfg_file = tmp_path / "test_config.json"
    monkeypatch.setattr("config.CONFIG_FILE", cfg_file)
    with open(cfg_file, "w") as f:
        json.dump({"storage_dir": "/old/path", "github_token": "old_tok"}, f)
    loaded = load_config()
    assert loaded.storage.storage_dir == "/old/path"
    assert loaded.github_token == "old_tok"


def test_ensure_storage_dir(tmp_path):
    target = str(tmp_path / "new_dir")
    result = ensure_storage_dir(target)
    assert result == target
    assert os.path.isdir(target)


# ── Storage tests ─────────────────────────────────────────────────────────────


def test_sanitize_path_default():
    assert sanitize_path_component("docs/guide-zh.md") == "docs_guide_zh.md"


def test_sanitize_path_no_dash():
    result = sanitize_path_component("my-repo", replace_dash=False)
    assert result == "my-repo"


def test_sanitize_path_custom_separator():
    result = sanitize_path_component("a/b-c", separator=".")
    assert result == "a.b.c"


@pytest.mark.asyncio
async def test_local_backend_save_and_list(tmp_path):
    backend = LocalStorageBackend(str(tmp_path))
    path = await backend.save("octocat", "hello-world", "README.md", "# Hello")
    assert os.path.isfile(path)
    assert "octocat_hello_world" in path

    files = await backend.list_files("octocat", "hello-world")
    assert len(files) == 1


@pytest.mark.asyncio
async def test_sql_backend_save_and_list(tmp_path):
    db_path = str(tmp_path / "test.db")
    backend = SQLStorageBackend(f"sqlite:///{db_path}")
    ident = await backend.save("owner", "repo", "docs/README.md", "# Doc")
    assert "sql://" in ident

    files = await backend.list_files("owner", "repo")
    assert "docs/README.md" in files


def test_create_backend_local(tmp_path):
    backend = create_backend({"type": "local", "storage_dir": str(tmp_path)})
    assert isinstance(backend, LocalStorageBackend)


def test_create_backend_sql(tmp_path):
    db_path = str(tmp_path / "test.db")
    backend = create_backend({"type": "sql", "connection_url": f"sqlite:///{db_path}"})
    assert isinstance(backend, SQLStorageBackend)


# ── Strategies tests ──────────────────────────────────────────────────────────


def test_strategy_enum_values():
    assert Strategy.REPO_NAME.value == "repo_name"
    assert Strategy.STARS.value == "stars"
    assert Strategy.LANGUAGE.value == "language"
    assert Strategy.TOPIC.value == "topic"


def test_strategy_map_has_all_strategies():
    for s in Strategy:
        assert s in STRATEGY_MAP


# ── FastAPI endpoint tests ────────────────────────────────────────────────────


@pytest.fixture
def client(monkeypatch, tmp_path):
    cfg_file = tmp_path / "test_config.json"
    monkeypatch.setattr("config.CONFIG_FILE", cfg_file)
    monkeypatch.setattr(
        "main.load_config",
        lambda: AppConfig(
            storage=StorageSettings(storage_dir=str(tmp_path)),
        ),
    )
    monkeypatch.setattr("main.save_config", lambda c: None)

    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)


def test_get_config(client):
    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "storage_dir" in data
    assert "has_token" in data
    assert "storage_type" in data
    assert "replace_slash" in data
    assert "separator" in data


def test_update_config(client):
    resp = client.put(
        "/api/config",
        json={"storage_dir": "/tmp/new-path", "storage_type": "local"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
