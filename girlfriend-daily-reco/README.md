# girlfriend-daily-reco

一个帮助“每天穿什么、吃什么”决策的中文应用，支持：

- 按天气 / 心情 / 场景 / 饮食偏好 / 预算推荐
- 录入穿搭与菜品素材
- 明日计划一键生成
- 一键导出与自动邮件发送（后端 SMTP / mailto）
- 实时天气自动识别
- 素材可编辑/删除
- 推荐历史记录入库与查看

## 技术栈

- 后端：Python 3.12 + FastAPI + SQLite
- 前端：原生 HTML / CSS / JavaScript（由 FastAPI 托管）

## 启动方式

### 方式 1：推荐（Python 3.12，自动创建虚拟环境）

```bash
cd girlfriend-daily-reco
./start.sh
```

### 方式 2：系统 Python 3.12（无 venv）

```bash
cd girlfriend-daily-reco
python3.12 -m pip install --user -r requirements.txt
python3.12 -m uvicorn server:app --host 0.0.0.0 --port 8000
```

启动后访问：

- http://127.0.0.1:8000

## SQLite 存储

- 数据库文件：`girlfriend-daily-reco/data.db`
- 表结构：
  - `outfits`：穿搭素材
  - `meals`：菜品素材
  - `recommendation_history`：推荐历史记录
- 首次启动会自动建表并写入默认示例素材

## API

- `GET /api/health`：健康检查
- `GET /api/outfits`：获取穿搭素材
- `POST /api/outfits`：新增穿搭素材
- `PUT /api/outfits/{id}`：修改穿搭素材
- `DELETE /api/outfits/{id}`：删除穿搭素材
- `GET /api/meals`：获取菜品素材
- `POST /api/meals`：新增菜品素材
- `PUT /api/meals/{id}`：修改菜品素材
- `DELETE /api/meals/{id}`：删除菜品素材
- `GET /api/history?limit=30`：查询推荐历史
- `POST /api/history`：保存推荐历史
- `POST /api/email/send`：通过后端 SMTP 发送邮件

## 服务端邮件配置（SMTP）

后端自动发邮件依赖以下环境变量：

- `SMTP_HOST`
- `SMTP_PORT`（默认 587）
- `SMTP_USERNAME`（可选，某些 SMTP 允许匿名）
- `SMTP_PASSWORD`（若配置用户名通常需要）
- `SMTP_FROM_EMAIL`
- `SMTP_USE_TLS`（默认 true）

示例：

```bash
export SMTP_HOST=smtp.qq.com
export SMTP_PORT=587
export SMTP_USERNAME=your_account@qq.com
export SMTP_PASSWORD=your_smtp_auth_code
export SMTP_FROM_EMAIL=your_account@qq.com
export SMTP_USE_TLS=true
```
