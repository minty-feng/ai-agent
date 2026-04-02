# girlfriend-daily-reco

一个帮助“每天穿什么、吃什么”决策的中文应用，支持：

- 按天气 / 心情 / 场景 / 饮食偏好 / 预算推荐
- 录入穿搭与菜品素材
- 明日计划一键生成
- 一键导出与自动邮件发送（EmailJS / mailto）
- 实时天气自动识别

## 技术栈

- 后端：Python + FastAPI + SQLite
- 前端：原生 HTML / CSS / JavaScript（由 FastAPI 托管）

## 启动方式

### 方式 1：推荐（自动创建虚拟环境）

```bash
cd girlfriend-daily-reco
./start.sh
```

### 方式 2：系统 Python（无 venv）

```bash
cd girlfriend-daily-reco
python3 -m pip install --user -r requirements.txt
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
```

启动后访问：

- http://127.0.0.1:8000

## SQLite 存储

- 数据库文件：`girlfriend-daily-reco/data.db`
- 表结构：
  - `outfits`：穿搭素材
  - `meals`：菜品素材
- 首次启动会自动建表并写入默认示例素材

## API

- `GET /api/health`：健康检查
- `GET /api/outfits`：获取穿搭素材
- `POST /api/outfits`：新增穿搭素材
- `GET /api/meals`：获取菜品素材
- `POST /api/meals`：新增菜品素材
