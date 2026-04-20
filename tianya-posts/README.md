# 天涯神贴

收录天涯论坛历年经典帖子 — 经济预言、历史解读、人生感悟、灵异悬疑……重温互联网黄金时代的文字力量。

## 架构

| 组件 | 技术栈 | 端口 |
|------|--------|------|
| **前端** | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 | `3006` |
| **后端** | Python FastAPI + SQLite | `8000` |
| **管理后台** | 原生 HTML/CSS/JS（FastAPI 静态文件） | `8000/admin` |

## 快速启动

```bash
# 一键启动（需要 Python 3.10+ 和 Node.js 18+）
chmod +x start.sh
./start.sh
```

或者分别启动：

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000

# 前端（新终端）
cd frontend
npm install
npm run dev
```

## 访问地址

- **前端页面**: http://localhost:3006
- **后台管理**: http://localhost:8000/admin
- **API 文档**: http://localhost:8000/docs

## 功能特性

### 前端
- 📜 温暖复古纸质感设计风格
- 📚 分类筛选（经济预言、历史解读、人生感悟、灵异悬疑等）
- ⭐ 精选推荐展示
- 📄 PDF 在线预览 & 下载
- 📱 响应式移动端适配

### 后台管理
- ✏️ 帖子 CRUD（创建、编辑、删除）
- 📤 PDF 文件上传管理
- 🏷️ 分类管理
- ⭐ 精选/置顶控制
- 🎨 封面颜色自定义

### API
- `GET /api/posts` — 帖子列表（支持分类筛选）
- `GET /api/posts/:id` — 帖子详情
- `GET /api/categories` — 分类列表
- `POST /api/admin/posts` — 创建/更新帖子（含 PDF 上传）
- `DELETE /api/admin/posts/:id` — 删除帖子
- `GET /uploads/:filename` — PDF 文件下载

## PDF 素材管理

1. 打开后台管理 http://localhost:8000/admin
2. 填写帖子信息（标题、作者、分类、简介）
3. 上传 PDF 文件
4. 点击"创建帖子"
5. 前端自动从后端获取并展示
