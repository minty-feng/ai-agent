# GitHub Markdown Crawler

搜索 GitHub 仓库，一键获取所有 Markdown 文档。提供 Python 后端 + 现代前端界面。

## 功能特性

- **四种搜索策略**
  1. **按仓库名称** — 输入关键词搜索仓库名
  2. **按 Star 数** — 筛选指定最低 Star 数的仓库
  3. **按编程语言** — 按语言类型过滤仓库
  4. **按 Topic** — 通过 GitHub Topic 标签搜索
- **分页搜索** — 可自由设置 `page`（页码）和 `per_page`（每页条数）
- **一键获取 Markdown** — 递归下载仓库中所有 `.md` 文件
- **多存储后端** — 支持本地文件系统、SQL 数据库、Elasticsearch 三种存储方式
- **灵活的路径处理** — 可配置分隔符，自定义是否将 `/` 和 `-` 替换为下划线
- **可选 GitHub Token** — 提高 API 请求限额
- **现代化 UI** — 暗色主题、毛玻璃效果、响应式设计

## 快速开始

### 1. 安装依赖

```bash
cd github-crawler/backend
pip install -r requirements.txt
```

### 2. 启动后端服务

```bash
cd github-crawler/backend
uvicorn main:app --reload --port 8000
```

### 3. 打开前端页面

浏览器访问 **http://localhost:8000/static/index.html**

### 4. 使用流程

1. 点击右上角 **⚙️ 设置** 按钮，配置存储后端和 GitHub Token
2. 选择搜索策略，输入关键词，设置每页条数
3. 点击 **搜索**，查看匹配的仓库列表
4. 使用底部分页按钮翻页
5. 点击仓库行中的 **📥 获取** 按钮下载所有 Markdown 文件

## 项目结构

```
github-crawler/
├── backend/
│   ├── main.py            # FastAPI 应用入口 & API 路由
│   ├── strategies.py      # 四种 GitHub 搜索策略
│   ├── crawler.py         # Markdown 文件爬取逻辑
│   ├── storage.py         # 存储抽象层（本地 / SQL / Elasticsearch）
│   ├── config.py          # 配置管理（持久化为 JSON）
│   ├── tests.py           # 测试套件（15 个测试用例）
│   └── requirements.txt   # Python 依赖
├── frontend/
│   ├── index.html         # 前端主页面
│   ├── style.css          # 暗色主题样式
│   └── app.js             # 前端交互逻辑
└── README.md
```

---

## API 文档

所有接口以 `/api` 为前缀，请求与响应均为 JSON 格式。

### `GET /api/config`

获取当前应用配置。

**响应示例：**

```json
{
  "storage_dir": "/path/to/downloads",
  "has_token": true,
  "storage_type": "local",
  "replace_slash": true,
  "replace_dash": true,
  "separator": "_",
  "connection_url": "sqlite:///crawled.db",
  "es_url": "http://localhost:9200",
  "index_name": "github_markdown"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `storage_dir` | string | 本地存储路径 |
| `has_token` | bool | 是否已配置 GitHub Token |
| `storage_type` | string | 当前存储后端类型（`local` / `sql` / `elasticsearch`） |
| `replace_slash` | bool | 是否将 `/` 替换为分隔符 |
| `replace_dash` | bool | 是否将 `-` 替换为分隔符 |
| `separator` | string | 路径分隔符（默认 `_`） |
| `connection_url` | string | SQL 数据库连接 URL |
| `es_url` | string | Elasticsearch 地址 |
| `index_name` | string | Elasticsearch 索引名 |

---

### `PUT /api/config`

更新应用配置（部分更新，只传需要修改的字段）。

**请求体：**

```json
{
  "storage_dir": "/new/path",
  "github_token": "ghp_xxxx",
  "storage_type": "sql",
  "replace_slash": true,
  "replace_dash": true,
  "separator": "_",
  "connection_url": "sqlite:///my.db",
  "es_url": "http://es-host:9200",
  "index_name": "my_index"
}
```

所有字段均为可选。未提供的字段保持原值不变。

**响应：**

```json
{ "status": "ok" }
```

---

### `POST /api/search`

搜索 GitHub 仓库，支持分页。

**请求体：**

```json
{
  "strategy": "stars",
  "query": "machine learning",
  "min_stars": 1000,
  "language": "Python",
  "per_page": 20,
  "page": 1
}
```

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `strategy` | string | ✅ | — | 搜索策略：`repo_name` / `stars` / `language` / `topic` |
| `query` | string | ✅ | — | 搜索关键词 |
| `min_stars` | int | — | 100 | 最低 Star 数（仅 `stars` 策略） |
| `language` | string | — | `"Python"` | 编程语言（仅 `language` 策略） |
| `per_page` | int | — | 10 | 每页返回条数（1–100） |
| `page` | int | — | 1 | 页码 |

**响应示例：**

```json
{
  "total_count": 1234,
  "page": 1,
  "per_page": 10,
  "repos": [
    {
      "full_name": "owner/repo",
      "owner": "owner",
      "name": "repo",
      "description": "A great repository",
      "stars": 5678,
      "language": "Python",
      "url": "https://github.com/owner/repo"
    }
  ]
}
```

---

### `POST /api/fetch`

下载指定仓库的所有 Markdown 文件，存入配置的存储后端。

**请求体：**

```json
{
  "owner": "octocat",
  "repo": "hello-world"
}
```

**响应示例：**

```json
{
  "owner": "octocat",
  "repo": "hello-world",
  "storage_type": "local",
  "files_saved": 3,
  "paths": [
    "/downloads/octocat_hello_world/README.md",
    "/downloads/octocat_hello_world/docs_guide.md",
    "/downloads/octocat_hello_world/CONTRIBUTING.md"
  ]
}
```

---

## 存储后端

### 本地文件系统 (`local`)

将 Markdown 文件保存到本地目录。

**路径格式示例：**

```
{storage_dir}/{owner}_{repo}/{file_path}.md
```

路径处理规则（均可在设置中配置）：

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `separator` | `_` | 替换特殊字符时使用的分隔符 |
| `replace_slash` | `true` | 将 `/` 替换为分隔符 |
| `replace_dash` | `true` | 将 `-` 替换为分隔符 |

例如：`docs/getting-started.md` → `docs_getting_started.md`

### SQL 数据库 (`sql`)

将内容存入 SQLite（或其他关系型数据库）。

**配置项：**

- `connection_url`：数据库连接 URL（如 `sqlite:///crawled.db`）

**表结构：**

```sql
CREATE TABLE markdown_files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    owner       TEXT NOT NULL,
    repo        TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner, repo, file_path)
);
```

### Elasticsearch (`elasticsearch`)

将内容索引到 Elasticsearch，便于全文搜索。

**配置项：**

- `es_url`：Elasticsearch 地址（如 `http://localhost:9200`）
- `index_name`：索引名称（默认 `github_markdown`）

**文档结构：**

```json
{
  "owner": "octocat",
  "repo": "hello-world",
  "file_path": "README.md",
  "content": "# Hello World\n..."
}
```

---

## 模块说明

### `main.py` — FastAPI 应用入口

应用入口文件，定义所有 HTTP 路由和请求/响应模型。

**主要组件：**

- `ConfigUpdate` — 配置更新请求模型
- `SearchRequest` — 搜索请求模型（含 `page`、`per_page`）
- `FetchRequest` — 下载请求模型
- `GET /api/config` — 读取配置
- `PUT /api/config` — 更新配置
- `POST /api/search` — 搜索仓库
- `POST /api/fetch` — 下载 Markdown

### `strategies.py` — 搜索策略

实现四种 GitHub 搜索策略，每种策略封装为一个异步函数。

| 函数 | 策略 | GitHub API 查询 |
|------|------|----------------|
| `search_by_repo_name(name)` | 按仓库名 | `{name} in:name` |
| `search_by_stars(query, min_stars)` | 按 Star 数 | `{query} stars:>={min_stars}` |
| `search_by_language(query, language)` | 按语言 | `{query} language:{language}` |
| `search_by_topic(topic)` | 按 Topic | `topic:{topic}` |

所有函数均支持 `per_page`、`page`、`token` 参数。

### `crawler.py` — 爬取逻辑

核心爬取模块，负责从 GitHub 仓库递归获取 Markdown 文件。

| 函数 | 说明 |
|------|------|
| `list_markdown_files(owner, repo)` | 递归列出仓库中所有 `.md` 文件 |
| `download_markdown_files(owner, repo, backend)` | 下载并通过存储后端保存 |

### `storage.py` — 存储抽象层

定义统一的存储接口和三种实现。

| 类 | 说明 |
|----|------|
| `StorageBackend` | 抽象基类，定义 `save()` 和 `list_files()` 接口 |
| `LocalStorageBackend` | 本地文件系统存储 |
| `SQLStorageBackend` | SQLite 数据库存储 |
| `ElasticsearchStorageBackend` | Elasticsearch 存储 |
| `create_backend(cfg)` | 工厂函数，根据配置创建对应后端 |

**辅助函数：**

- `sanitize_path_component(name, *, replace_slash, replace_dash, separator)` — 安全处理路径组件

### `config.py` — 配置管理

使用 Pydantic 模型管理配置，持久化为 JSON 文件。

| 类 / 函数 | 说明 |
|-----------|------|
| `StorageSettings` | 存储后端配置 |
| `AppConfig` | 顶层应用配置 |
| `load_config()` | 从 JSON 文件加载（支持向后兼容） |
| `save_config(config)` | 保存到 JSON 文件 |
| `ensure_storage_dir(path)` | 确保目录存在 |

---

## 运行测试

```bash
cd github-crawler/backend
pip install -r requirements.txt
python -m pytest tests.py -v
```

测试覆盖：

- 配置管理（默认值、保存/加载、向后兼容）
- 路径清理（默认、不替换连字符、自定义分隔符）
- 本地存储后端（保存和列表）
- SQL 存储后端（保存和列表）
- 后端工厂函数
- 搜索策略枚举
- FastAPI 端点

## 技术栈

- **后端**: Python 3.12+, FastAPI, httpx, Pydantic v2
- **前端**: 原生 HTML / CSS / JavaScript（无框架依赖）
- **存储**: 本地文件系统 / SQLite / Elasticsearch
- **测试**: pytest + pytest-asyncio
