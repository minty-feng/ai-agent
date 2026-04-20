"""Tianya Classic Posts — backend server.

Provides:
* Admin API (POST/DELETE /api/admin/posts, POST /api/admin/upload)
* Public API  (GET /api/posts, GET /api/posts/:id)
* Serves admin panel at /admin
* Serves uploaded PDFs at /uploads
"""

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data.db"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="天涯神贴 Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

CATEGORIES = [
    "经济预言",
    "历史解读",
    "人生感悟",
    "灵异悬疑",
    "情感故事",
    "职场江湖",
    "社会百态",
    "其他",
]


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _init_db() -> None:
    conn = _get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            author      TEXT NOT NULL DEFAULT '佚名',
            category    TEXT NOT NULL DEFAULT '其他',
            description TEXT NOT NULL DEFAULT '',
            pdf_file    TEXT NOT NULL DEFAULT '',
            cover_color TEXT NOT NULL DEFAULT '#d4a574',
            view_count  INTEGER NOT NULL DEFAULT 0,
            is_featured INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


_init_db()

# ---------------------------------------------------------------------------
# Seed some demo data (if table is empty)
# ---------------------------------------------------------------------------


def _seed_demo() -> None:
    conn = _get_db()
    count = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    if count > 0:
        conn.close()
        return

    now = datetime.now(timezone.utc).isoformat()
    demos = [
        {
            "id": str(uuid.uuid4()),
            "title": "2005年预言中国房价走势（天涯神预言）",
            "author": "KK",
            "category": "经济预言",
            "description": "2005年天涯网友精准预测中国未来20年房价走势，从一线到三四线，几乎全部应验。被誉为天涯第一神贴。",
            "cover_color": "#c9956b",
            "view_count": 128350,
            "is_featured": 1,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "明朝那些事儿（连载精华）",
            "author": "当年明月",
            "category": "历史解读",
            "description": "以诙谐幽默的笔法讲述明朝三百年历史，从朱元璋到崇祯，波澜壮阔又接地气。天涯最受欢迎的历史连载之一。",
            "cover_color": "#8b6914",
            "view_count": 256780,
            "is_featured": 1,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "我在北京奋斗的日子",
            "author": "北漂人生",
            "category": "人生感悟",
            "description": "一个小镇青年在北京打拼十年的真实记录，从月薪两千到年薪百万，辛酸与成长并存。",
            "cover_color": "#5a7d5a",
            "view_count": 87600,
            "is_featured": 0,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "我所经历的灵异事件",
            "author": "夜行者",
            "category": "灵异悬疑",
            "description": "作者以亲身经历讲述在偏远山村工作时遇到的一系列无法解释的事件，情节引人入胜。",
            "cover_color": "#4a4a6a",
            "view_count": 198400,
            "is_featured": 1,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "股市十年——一个散户的血泪史",
            "author": "韭菜往事",
            "category": "经济预言",
            "description": "真实记录一个普通股民在A股十年的投资经历，从追涨杀跌到价值投资的蜕变过程。",
            "cover_color": "#8b4513",
            "view_count": 156200,
            "is_featured": 0,
        },
        {
            "id": str(uuid.uuid4()),
            "title": "毕业五年，我在体制内外的抉择",
            "author": "围城内外",
            "category": "职场江湖",
            "description": "体制内与互联网大厂的双重视角，深刻剖析当代年轻人的职业焦虑与选择困境。",
            "cover_color": "#6b8e8e",
            "view_count": 94500,
            "is_featured": 0,
        },
    ]

    for d in demos:
        conn.execute(
            """
            INSERT INTO posts (id, title, author, category, description,
                               cover_color, view_count, is_featured,
                               pdf_file, created_at, updated_at)
            VALUES (:id, :title, :author, :category, :description,
                    :cover_color, :view_count, :is_featured, '', :now, :now)
            """,
            {**d, "now": now},
        )
    conn.commit()
    conn.close()


_seed_demo()

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@app.get("/api/posts")
def list_posts(category: str | None = None, featured: bool | None = None):
    """Return all posts (optionally filtered)."""
    conn = _get_db()
    query = "SELECT * FROM posts WHERE 1=1"
    params: list = []
    if category:
        query += " AND category = ?"
        params.append(category)
    if featured is not None:
        query += " AND is_featured = ?"
        params.append(1 if featured else 0)
    query += " ORDER BY is_featured DESC, view_count DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/posts/{post_id}")
def get_post(post_id: str):
    """Return single post and bump view count."""
    conn = _get_db()
    conn.execute(
        "UPDATE posts SET view_count = view_count + 1 WHERE id = ?", (post_id,)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Post not found")
    return dict(row)


@app.get("/api/categories")
def list_categories():
    """Return available categories."""
    return CATEGORIES


# ---------------------------------------------------------------------------
# Admin API
# ---------------------------------------------------------------------------


@app.post("/api/admin/posts")
async def create_or_update_post(
    id: str = Form(""),
    title: str = Form(...),
    author: str = Form("佚名"),
    category: str = Form("其他"),
    description: str = Form(""),
    cover_color: str = Form("#d4a574"),
    is_featured: int = Form(0),
    pdf: UploadFile | None = File(None),
):
    """Create or update a post. Optionally attach a PDF."""
    conn = _get_db()
    now = datetime.now(timezone.utc).isoformat()
    pdf_file = ""

    if pdf and pdf.filename:
        ext = Path(pdf.filename).suffix.lower()
        if ext != ".pdf":
            raise HTTPException(400, "Only PDF files are allowed")
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_DIR / safe_name
        content = await pdf.read()
        dest.write_bytes(content)
        pdf_file = safe_name

    if id:
        # Update
        existing = conn.execute("SELECT * FROM posts WHERE id = ?", (id,)).fetchone()
        if not existing:
            conn.close()
            raise HTTPException(404, "Post not found")
        if pdf_file:
            # Delete old PDF
            if existing["pdf_file"]:
                old_path = UPLOAD_DIR / existing["pdf_file"]
                if old_path.exists():
                    old_path.unlink()
            conn.execute(
                """UPDATE posts SET title=?, author=?, category=?, description=?,
                   cover_color=?, is_featured=?, pdf_file=?, updated_at=?
                   WHERE id=?""",
                (title, author, category, description, cover_color, is_featured, pdf_file, now, id),
            )
        else:
            conn.execute(
                """UPDATE posts SET title=?, author=?, category=?, description=?,
                   cover_color=?, is_featured=?, updated_at=?
                   WHERE id=?""",
                (title, author, category, description, cover_color, is_featured, now, id),
            )
        conn.commit()
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (id,)).fetchone()
    else:
        # Create
        new_id = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO posts (id, title, author, category, description,
                               cover_color, is_featured, pdf_file,
                               view_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (new_id, title, author, category, description, cover_color, is_featured, pdf_file, now, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (new_id,)).fetchone()

    conn.close()
    return dict(row)


@app.delete("/api/admin/posts/{post_id}")
def delete_post(post_id: str):
    """Delete a post and its PDF."""
    conn = _get_db()
    row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Post not found")
    if row["pdf_file"]:
        p = UPLOAD_DIR / row["pdf_file"]
        if p.exists():
            p.unlink()
    conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Serve PDF files
# ---------------------------------------------------------------------------


@app.get("/uploads/{filename}")
def serve_pdf(filename: str):
    """Serve an uploaded PDF file."""
    safe = Path(filename).name
    p = UPLOAD_DIR / safe
    if not p.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(p, media_type="application/pdf")


# ---------------------------------------------------------------------------
# Static files — admin UI
# ---------------------------------------------------------------------------

app.mount("/admin", StaticFiles(directory=str(BASE_DIR / "static"), html=True), name="admin")
