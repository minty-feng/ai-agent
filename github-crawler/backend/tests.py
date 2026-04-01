"""Tests for the GitHub Markdown Crawler backend."""

import json
import os
import tempfile

import pytest
from config import AppConfig, load_config, save_config, ensure_storage_dir, CONFIG_FILE
from strategies import Strategy, STRATEGY_MAP


# ── Config tests ──────────────────────────────────────────────────────────────


def test_app_config_defaults():
    cfg = AppConfig()
    assert cfg.storage_dir != ""
    assert cfg.github_token == ""


def test_save_and_load_config(tmp_path, monkeypatch):
    cfg_file = tmp_path / "test_config.json"
    monkeypatch.setattr("config.CONFIG_FILE", cfg_file)

    cfg = AppConfig(storage_dir="/tmp/test-downloads", github_token="tok_123")
    save_config(cfg)

    loaded = load_config()
    assert loaded.storage_dir == "/tmp/test-downloads"
    assert loaded.github_token == "tok_123"


def test_ensure_storage_dir(tmp_path):
    target = str(tmp_path / "new_dir")
    result = ensure_storage_dir(target)
    assert result == target
    assert os.path.isdir(target)


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
    monkeypatch.setattr("main.load_config", lambda: AppConfig(storage_dir=str(tmp_path)))
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


def test_update_config(client):
    resp = client.put(
        "/api/config",
        json={"storage_dir": "/tmp/new-path"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
