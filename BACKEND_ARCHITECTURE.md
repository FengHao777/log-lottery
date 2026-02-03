# 后端架构说明

## 项目结构

```
backend/
├── main.py              # FastAPI应用主入口
├── database.py          # SQLAlchemy数据库模型和连接配置
├── schemas.py           # Pydantic数据模型（请求/响应）
├── requirements.txt     # Python依赖包
├── .env.example        # 环境变量示例
├── README.md           # 后端文档
├── routers/            # API路由模块
│   ├── __init__.py
│   ├── persons.py      # 人员管理API
│   ├── prizes.py       # 奖项管理API
│   ├── config.py       # 全局配置API
│   ├── media.py        # 音乐和图片管理API
│   └── user_upload.py  # 用户上传数据API
└── lottery.db         # SQLite数据库文件（运行后生成）
```

## 技术栈

- **Python 3.12**: 编程语言
- **FastAPI**: Web框架，提供高性能的异步API
- **SQLAlchemy**: ORM框架，用于数据库操作
- **SQLite**: 轻量级关系型数据库
- **Pydantic**: 数据验证和序列化
- **Uvicorn**: ASGI服务器，用于运行FastAPI应用

## 数据库模型

### Person（人员表）
存储参与抽奖的人员信息，包括姓名、部门、职位、头像、设备指纹、中奖状态等。
- 新增字段：`position`（职位）、`device_fingerprint`（设备指纹）
- 所有人员数据（包括用户上传和管理员导入）统一存储在此表中

### Prize（奖项表）
存储奖项配置，包括奖项名称、抽取人数、图片、是否全员参加等。

### GlobalConfig（全局配置表）
存储全局配置信息，包括主题、语言、卡片样式等。

### Music（音乐表）
存储背景音乐信息。

### Image（图片表）
存储图片信息，包括背景图、奖项图片等。

## API接口

### 人员管理 (`/api/persons`)
- `GET /api/persons/` - 获取所有人员
- `GET /api/persons/{id}` - 根据ID获取人员
- `GET /api/persons/uuid/{uuid}` - 根据UUID获取人员
- `POST /api/persons/` - 创建人员
- `POST /api/persons/batch` - 批量创建人员
- `PUT /api/persons/{id}` - 更新人员
- `DELETE /api/persons/{id}` - 删除人员
- `DELETE /api/persons/` - 删除所有人员
- `GET /api/persons/already/list` - 获取已中奖人员
- `GET /api/persons/not/list` - 获取未中奖人员
- `GET /api/persons/not/prize/{prize_id}` - 获取未中此奖的人员
- `POST /api/persons/reset/won` - 重置中奖状态

### 奖项管理 (`/api/prizes`)
- `GET /api/prizes/` - 获取所有奖项
- `GET /api/prizes/{id}` - 根据ID获取奖项
- `GET /api/prizes/current` - 获取当前奖项
- `POST /api/prizes/` - 创建奖项
- `PUT /api/prizes/{id}` - 更新奖项
- `DELETE /api/prizes/{id}` - 删除奖项
- `DELETE /api/prizes/` - 删除所有奖项
- `POST /api/prizes/{id}/set-current` - 设置当前奖项
- `POST /api/prizes/reset` - 重置所有奖项

### 全局配置 (`/api/config`)
- `GET /api/config/` - 获取全局配置
- `PUT /api/config/` - 更新全局配置
- `POST /api/config/reset` - 重置全局配置

### 媒体管理 (`/api/media`)
#### 音乐
- `GET /api/media/music` - 获取所有音乐
- `GET /api/media/music/{id}` - 根据ID获取音乐
- `POST /api/media/music` - 创建音乐
- `DELETE /api/media/music/{id}` - 删除音乐
- `DELETE /api/media/music` - 删除所有音乐

#### 图片
- `GET /api/media/images` - 获取所有图片
- `GET /api/media/images/{id}` - 根据ID获取图片
- `POST /api/media/images` - 创建图片
- `DELETE /api/media/images/{id}` - 删除图片
- `DELETE /api/media/images` - 删除所有图片

### 用户上传 (`/api/user-upload`)
- `GET /api/user-upload/all` - 获取所有用户上传数据（实际查询persons表中device_fingerprint不为空的记录）
- `GET /api/user-upload/device?device_fingerprint=xxx` - 根据设备指纹获取用户（查询persons表）
- `POST /api/user-upload/` - 创建或更新用户上传数据（操作persons表）
- `PUT /api/user-upload/{device_fingerprint}` - 更新用户上传数据（操作persons表）
- `DELETE /api/user-upload/?device_fingerprint=xxx` - 删除用户上传数据（从persons表删除）
- `DELETE /api/user-upload/all` - 删除所有用户上传数据（从persons表删除device_fingerprint不为空的记录）

## 环境变量

在 `backend/.env` 文件中配置：

```env
DATABASE_URL=sqlite:///./lottery.db
HOST=0.0.0.0
PORT=8000
ALLOW_ORIGINS=*
```

## 启动服务

### 开发模式
```bash
cd backend
conda activate nianhui
python main.py
```

或使用uvicorn：
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 生产模式
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API文档

启动服务后，访问以下地址查看API文档：

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 数据库迁移

数据库会在首次运行时自动创建。如需重置数据库：

```bash
rm backend/lottery.db
python backend/main.py
```

## CORS配置

默认允许所有来源访问（`*`），生产环境应修改 `main.py` 中的CORS配置，限制具体域名。

## 安全建议

1. 生产环境应限制 `ALLOW_ORIGINS` 为具体域名
2. 添加API认证机制（如JWT）
3. 使用HTTPS
4. 实现请求频率限制
5. 添加日志记录和监控
