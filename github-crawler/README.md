# GitHub Markdown 爬虫

搜索 GitHub 仓库，一键获取所有 Markdown 文档。提供 Python 后端 + 前端配置页面。

## 功能特性

- **四种搜索策略**
  1. **按仓库名称** — 输入关键词搜索仓库名
  2. **按 Star 数** — 筛选指定最低 Star 数的仓库
  3. **按编程语言** — 按语言类型过滤仓库
  4. **按 Topic** — 通过 GitHub Topic 标签搜索
- **一键获取 Markdown** — 递归下载仓库中所有 `.md` 文件
- **可配置存储路径** — 在前端页面设置文件保存位置
- **可选 GitHub Token** — 提高 API 请求限额

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

1. 展开 **⚙️ 配置** 面板，设置存储路径（可选：填入 GitHub Token）
2. 选择搜索策略，输入关键词
3. 点击 **🔍 搜索**，查看匹配的仓库列表
4. 点击仓库行中的 **📥 获取 MD** 按钮，后端自动下载所有 Markdown 文件

## 项目结构

```
github-crawler/
├── backend/
│   ├── main.py            # FastAPI 应用入口
│   ├── strategies.py      # 四种搜索策略
│   ├── crawler.py         # Markdown 文件爬取逻辑
│   ├── config.py          # 配置管理（持久化为 JSON）
│   └── requirements.txt   # Python 依赖
├── frontend/
│   ├── index.html         # 前端主页面
│   ├── style.css          # 样式
│   └── app.js             # 前端交互逻辑
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/config` | 获取当前配置 |
| `PUT` | `/api/config` | 更新存储路径和 Token |
| `POST` | `/api/search` | 搜索 GitHub 仓库 |
| `POST` | `/api/fetch` | 下载指定仓库的 Markdown 文件 |

## 技术栈

- **后端**: Python 3.12+, FastAPI, httpx
- **前端**: 原生 HTML / CSS / JavaScript（无框架依赖）
