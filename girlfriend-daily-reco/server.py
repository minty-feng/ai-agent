import json
import os
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data.db"


DEFAULT_OUTFITS = [
    {
        "name": "奶油白针织开衫 + A字半身裙",
        "style": "温柔约会风",
        "weather": ["cloudy", "cold", "sunny"],
        "moods": ["happy", "romantic", "calm"],
        "occasions": ["date", "casual"],
        "budget": "mid",
        "link": "https://www.taobao.com/",
    },
    {
        "name": "浅灰西装外套 + 直筒牛仔裤",
        "style": "通勤韩系",
        "weather": ["sunny", "cloudy", "cold"],
        "moods": ["focused", "calm"],
        "occasions": ["work", "casual"],
        "budget": "budget",
        "link": "https://www.tmall.com/",
    },
    {
        "name": "薄款防晒衬衫 + 阔腿裤",
        "style": "轻松清爽",
        "weather": ["hot", "sunny"],
        "moods": ["happy", "calm"],
        "occasions": ["work", "casual", "home"],
        "budget": "budget",
        "link": "https://www.jd.com/",
    },
    {
        "name": "短款风衣 + 连衣裙",
        "style": "气质通勤",
        "weather": ["rainy", "cloudy", "cold"],
        "moods": ["focused", "romantic"],
        "occasions": ["work", "date"],
        "budget": "mid",
        "link": "https://www.taobao.com/",
    },
    {
        "name": "软糯家居套装",
        "style": "宅家治愈",
        "weather": ["rainy", "cold", "hot"],
        "moods": ["tired", "calm"],
        "occasions": ["home"],
        "budget": "budget",
        "link": "https://www.xiaohongshu.com/",
    },
]

DEFAULT_MEALS = [
    {
        "name": "番茄肥牛乌冬",
        "flavor": "酸甜浓郁",
        "weather": ["rainy", "cold", "cloudy"],
        "moods": ["tired", "happy"],
        "diets": ["comfort", "protein"],
        "budget": "mid",
        "link": "https://www.dianping.com/",
    },
    {
        "name": "清炒虾仁时蔬 + 杂粮饭",
        "flavor": "清淡鲜甜",
        "weather": ["sunny", "hot", "cloudy"],
        "moods": ["focused", "calm"],
        "diets": ["light", "protein"],
        "budget": "mid",
        "link": "https://www.meituan.com/",
    },
    {
        "name": "麻辣香锅（少油版）",
        "flavor": "麻辣上头",
        "weather": ["rainy", "cold"],
        "moods": ["happy", "tired"],
        "diets": ["spicy", "comfort"],
        "budget": "budget",
        "link": "https://www.meituan.com/",
    },
    {
        "name": "三文鱼牛油果波奇饭",
        "flavor": "清爽轻食",
        "weather": ["hot", "sunny"],
        "moods": ["calm", "focused"],
        "diets": ["light", "protein"],
        "budget": "mid",
        "link": "https://www.ele.me/",
    },
    {
        "name": "菌菇鸡汤面",
        "flavor": "暖胃鲜香",
        "weather": ["cold", "rainy", "cloudy"],
        "moods": ["tired", "romantic", "calm"],
        "diets": ["comfort"],
        "budget": "budget",
        "link": "https://www.dianping.com/",
    },
]


class OutfitInput(BaseModel):
    name: str = Field(min_length=1)
    style: str = ""
    weather: list[str] = Field(default_factory=list)
    moods: list[str] = Field(default_factory=list)
    occasions: list[str] = Field(default_factory=list)
    budget: str = "budget"
    link: str = ""


class MealInput(BaseModel):
    name: str = Field(min_length=1)
    flavor: str = ""
    weather: list[str] = Field(default_factory=list)
    moods: list[str] = Field(default_factory=list)
    diets: list[str] = Field(default_factory=list)
    budget: str = "budget"
    link: str = ""


class HistoryInput(BaseModel):
    plan_label: str = Field(min_length=1)
    condition: dict[str, Any] = Field(default_factory=dict)
    top_outfits: list[dict[str, Any]] = Field(default_factory=list)
    top_meals: list[dict[str, Any]] = Field(default_factory=list)
    hot_meals: list[str] = Field(default_factory=list)
    created_at: str = ""


class SharePlanInput(BaseModel):
    plan_label: str = Field(min_length=1)
    condition: dict[str, Any] = Field(default_factory=dict)
    top_outfits: list[dict[str, Any]] = Field(default_factory=list)
    top_meals: list[dict[str, Any]] = Field(default_factory=list)
    hot_meals: list[str] = Field(default_factory=list)
    created_at: str = ""


class EmailSendInput(BaseModel):
    to_email: str = Field(min_length=3)
    to_name: str = ""
    subject: str = Field(min_length=1)
    text: str = Field(min_length=1)
    html: str = ""


def db_connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def serialize_tags(value: list[str]) -> str:
    return json.dumps(value, ensure_ascii=False)


def parse_tags(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except json.JSONDecodeError:
        return []
    return []


def parse_json(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        parsed = json.loads(value)
        if isinstance(fallback, list) and isinstance(parsed, list):
            return parsed
        if isinstance(fallback, dict) and isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        return fallback
    return fallback


def ensure_db() -> None:
    with db_connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS outfits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                style TEXT NOT NULL DEFAULT '',
                weather TEXT NOT NULL DEFAULT '[]',
                moods TEXT NOT NULL DEFAULT '[]',
                occasions TEXT NOT NULL DEFAULT '[]',
                budget TEXT NOT NULL DEFAULT 'budget',
                link TEXT NOT NULL DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                flavor TEXT NOT NULL DEFAULT '',
                weather TEXT NOT NULL DEFAULT '[]',
                moods TEXT NOT NULL DEFAULT '[]',
                diets TEXT NOT NULL DEFAULT '[]',
                budget TEXT NOT NULL DEFAULT 'budget',
                link TEXT NOT NULL DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS recommendation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_label TEXT NOT NULL,
                condition_json TEXT NOT NULL DEFAULT '{}',
                outfits_json TEXT NOT NULL DEFAULT '[]',
                meals_json TEXT NOT NULL DEFAULT '[]',
                hot_meals_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shared_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                share_token TEXT NOT NULL UNIQUE,
                plan_label TEXT NOT NULL,
                condition_json TEXT NOT NULL DEFAULT '{}',
                outfits_json TEXT NOT NULL DEFAULT '[]',
                meals_json TEXT NOT NULL DEFAULT '[]',
                hot_meals_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        outfit_count = conn.execute("SELECT COUNT(1) FROM outfits").fetchone()[0]
        meal_count = conn.execute("SELECT COUNT(1) FROM meals").fetchone()[0]

        if outfit_count == 0:
            conn.executemany(
                """
                INSERT INTO outfits (name, style, weather, moods, occasions, budget, link)
                VALUES (:name, :style, :weather, :moods, :occasions, :budget, :link)
                """,
                [
                    {
                        **item,
                        "weather": serialize_tags(item["weather"]),
                        "moods": serialize_tags(item["moods"]),
                        "occasions": serialize_tags(item["occasions"]),
                    }
                    for item in DEFAULT_OUTFITS
                ],
            )

        if meal_count == 0:
            conn.executemany(
                """
                INSERT INTO meals (name, flavor, weather, moods, diets, budget, link)
                VALUES (:name, :flavor, :weather, :moods, :diets, :budget, :link)
                """,
                [
                    {
                        **item,
                        "weather": serialize_tags(item["weather"]),
                        "moods": serialize_tags(item["moods"]),
                        "diets": serialize_tags(item["diets"]),
                    }
                    for item in DEFAULT_MEALS
                ],
            )
        conn.commit()


def row_to_outfit(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "style": row["style"],
        "weather": parse_tags(row["weather"]),
        "moods": parse_tags(row["moods"]),
        "occasions": parse_tags(row["occasions"]),
        "budget": row["budget"],
        "link": row["link"],
    }


def row_to_meal(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "flavor": row["flavor"],
        "weather": parse_tags(row["weather"]),
        "moods": parse_tags(row["moods"]),
        "diets": parse_tags(row["diets"]),
        "budget": row["budget"],
        "link": row["link"],
    }


def row_to_history(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "plan_label": row["plan_label"],
        "condition": parse_json(row["condition_json"], {}),
        "top_outfits": parse_json(row["outfits_json"], []),
        "top_meals": parse_json(row["meals_json"], []),
        "hot_meals": parse_json(row["hot_meals_json"], []),
        "created_at": row["created_at"],
    }


def row_to_shared_plan(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "share_token": row["share_token"],
        "plan_label": row["plan_label"],
        "condition": parse_json(row["condition_json"], {}),
        "top_outfits": parse_json(row["outfits_json"], []),
        "top_meals": parse_json(row["meals_json"], []),
        "hot_meals": parse_json(row["hot_meals_json"], []),
        "created_at": row["created_at"],
    }


def must_find_outfit(conn: sqlite3.Connection, outfit_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM outfits WHERE id = ?", (outfit_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="outfit not found")
    return row


def must_find_meal(conn: sqlite3.Connection, meal_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM meals WHERE id = ?", (meal_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="meal not found")
    return row


def must_find_shared_plan(conn: sqlite3.Connection, share_token: str) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM shared_plans WHERE share_token = ?", (share_token,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="shared plan not found")
    return row


def send_email_via_smtp(payload: EmailSendInput) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587").strip() or "587")
    username = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() in {"1", "true", "yes"}

    if not host or not from_email:
        raise HTTPException(
            status_code=400,
            detail="SMTP not configured. Required: SMTP_HOST, SMTP_FROM_EMAIL.",
        )

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = payload.to_email
    msg["Subject"] = payload.subject
    msg.set_content(payload.text)
    if payload.html:
        msg.add_alternative(payload.html, subtype="html")

    try:
        with smtplib.SMTP(host, port, timeout=20) as server:
            if use_tls:
                server.starttls()
            if username:
                server.login(username, password)
            server.send_message(msg)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"smtp send failed: {exc}") from exc


app = FastAPI(title="Girlfriend Daily Reco API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    ensure_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/outfits")
def list_outfits() -> list[dict[str, Any]]:
    with db_connect() as conn:
        rows = conn.execute("SELECT * FROM outfits ORDER BY id DESC").fetchall()
    return [row_to_outfit(row) for row in rows]


@app.post("/api/outfits")
def create_outfit(payload: OutfitInput) -> dict[str, Any]:
    with db_connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO outfits (name, style, weather, moods, occasions, budget, link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                payload.style.strip(),
                serialize_tags(payload.weather),
                serialize_tags(payload.moods),
                serialize_tags(payload.occasions),
                payload.budget.strip() or "budget",
                payload.link.strip(),
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM outfits WHERE id = ?", (cur.lastrowid,)).fetchone()
    return row_to_outfit(row)


@app.put("/api/outfits/{outfit_id}")
def update_outfit(outfit_id: int, payload: OutfitInput) -> dict[str, Any]:
    with db_connect() as conn:
        must_find_outfit(conn, outfit_id)
        conn.execute(
            """
            UPDATE outfits
            SET name = ?, style = ?, weather = ?, moods = ?, occasions = ?, budget = ?, link = ?
            WHERE id = ?
            """,
            (
                payload.name.strip(),
                payload.style.strip(),
                serialize_tags(payload.weather),
                serialize_tags(payload.moods),
                serialize_tags(payload.occasions),
                payload.budget.strip() or "budget",
                payload.link.strip(),
                outfit_id,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM outfits WHERE id = ?", (outfit_id,)).fetchone()
    return row_to_outfit(row)


@app.delete("/api/outfits/{outfit_id}")
def delete_outfit(outfit_id: int) -> dict[str, bool]:
    with db_connect() as conn:
        must_find_outfit(conn, outfit_id)
        conn.execute("DELETE FROM outfits WHERE id = ?", (outfit_id,))
        conn.commit()
    return {"ok": True}


@app.get("/api/meals")
def list_meals() -> list[dict[str, Any]]:
    with db_connect() as conn:
        rows = conn.execute("SELECT * FROM meals ORDER BY id DESC").fetchall()
    return [row_to_meal(row) for row in rows]


@app.post("/api/meals")
def create_meal(payload: MealInput) -> dict[str, Any]:
    with db_connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO meals (name, flavor, weather, moods, diets, budget, link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                payload.flavor.strip(),
                serialize_tags(payload.weather),
                serialize_tags(payload.moods),
                serialize_tags(payload.diets),
                payload.budget.strip() or "budget",
                payload.link.strip(),
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM meals WHERE id = ?", (cur.lastrowid,)).fetchone()
    return row_to_meal(row)


@app.put("/api/meals/{meal_id}")
def update_meal(meal_id: int, payload: MealInput) -> dict[str, Any]:
    with db_connect() as conn:
        must_find_meal(conn, meal_id)
        conn.execute(
            """
            UPDATE meals
            SET name = ?, flavor = ?, weather = ?, moods = ?, diets = ?, budget = ?, link = ?
            WHERE id = ?
            """,
            (
                payload.name.strip(),
                payload.flavor.strip(),
                serialize_tags(payload.weather),
                serialize_tags(payload.moods),
                serialize_tags(payload.diets),
                payload.budget.strip() or "budget",
                payload.link.strip(),
                meal_id,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM meals WHERE id = ?", (meal_id,)).fetchone()
    return row_to_meal(row)


@app.delete("/api/meals/{meal_id}")
def delete_meal(meal_id: int) -> dict[str, bool]:
    with db_connect() as conn:
        must_find_meal(conn, meal_id)
        conn.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
        conn.commit()
    return {"ok": True}


@app.get("/api/history")
def list_history(limit: int = Query(default=20, ge=1, le=200)) -> list[dict[str, Any]]:
    with db_connect() as conn:
        rows = conn.execute(
            "SELECT * FROM recommendation_history ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [row_to_history(row) for row in rows]


@app.post("/api/history")
def create_history(payload: HistoryInput) -> dict[str, Any]:
    created_at_value = payload.created_at.strip() or datetime.now(timezone.utc).isoformat()
    with db_connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO recommendation_history
            (plan_label, condition_json, outfits_json, meals_json, hot_meals_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.plan_label.strip(),
                json.dumps(payload.condition, ensure_ascii=False),
                json.dumps(payload.top_outfits, ensure_ascii=False),
                json.dumps(payload.top_meals, ensure_ascii=False),
                json.dumps(payload.hot_meals, ensure_ascii=False),
                created_at_value,
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM recommendation_history WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return row_to_history(row)


@app.post("/api/share")
def create_share(payload: SharePlanInput) -> dict[str, Any]:
    created_at_value = payload.created_at.strip() or datetime.now(timezone.utc).isoformat()
    share_token = os.urandom(9).hex()
    with db_connect() as conn:
        conn.execute(
            """
            INSERT INTO shared_plans
            (share_token, plan_label, condition_json, outfits_json, meals_json, hot_meals_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                share_token,
                payload.plan_label.strip(),
                json.dumps(payload.condition, ensure_ascii=False),
                json.dumps(payload.top_outfits, ensure_ascii=False),
                json.dumps(payload.top_meals, ensure_ascii=False),
                json.dumps(payload.hot_meals, ensure_ascii=False),
                created_at_value,
            ),
        )
        conn.commit()
    return {"share_token": share_token}


@app.get("/api/share/{share_token}")
def get_share(share_token: str) -> dict[str, Any]:
    with db_connect() as conn:
        row = must_find_shared_plan(conn, share_token)
    return row_to_shared_plan(row)


@app.post("/api/email/send")
def send_email(payload: EmailSendInput) -> dict[str, str]:
    send_email_via_smtp(payload)
    return {"status": "sent"}


@app.exception_handler(Exception)
async def all_exception_handler(_, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/")
def home() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")
