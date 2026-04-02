import json
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
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


@app.exception_handler(Exception)
async def all_exception_handler(_, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/")
def home() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")
