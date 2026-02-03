# Lottery Backend API

抽奖系统后端服务，使用Python FastAPI框架和SQLite数据库。

## 技术栈

- Python 3.9+
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- Uvicorn

## 项目结构

```
backend/
├── main.py              # 主应用入口
├── database.py          # 数据库模型和连接
├── schemas.py           # Pydantic数据模型
├── migrate_db.py        # 数据库迁移脚本
├── requirements.txt     # Python依赖
├── .env.example         # 环境变量示例
├── routers/             # API路由
│   ├── __init__.py
│   ├── persons.py       # 人员相关API
│   ├── prizes.py        # 奖项相关API
│   ├── config.py        # 全局配置API
│   ├── media.py         # 音乐和图片API
│   └── user_upload.py   # 用户上传API
└── lottery.db           # SQLite数据库文件（运行后生成）
```

## 安装和运行

### 1. 创建conda环境

```bash
conda create -n nianhui python=3.9
conda activate nianhui
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 运行服务

```bash
# 开发模式
python main.py

# 或使用uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

服务将在 `http://localhost:8000` 启动。

### 4. 访问API文档

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API接口

### 人员管理 (`/api/persons`)

- `GET /api/persons/` - 获取所有人员
- `GET /api/persons/{person_id}` - 根据ID获取人员
- `GET /api/persons/uuid/{uuid}` - 根据UUID获取人员
- `POST /api/persons/` - 创建人员
- `POST /api/persons/batch` - 批量创建人员
- `PUT /api/persons/{person_id}` - 更新人员
- `DELETE /api/persons/{person_id}` - 删除人员
- `DELETE /api/persons/` - 删除所有人员
- `GET /api/persons/already/list` - 获取已中奖人员
- `GET /api/persons/not/list` - 获取未中奖人员
- `GET /api/persons/not/prize/{prize_id}` - 获取未中此奖的人员
- `POST /api/persons/reset/won` - 重置中奖状态

### 奖项管理 (`/api/prizes`)

- `GET /api/prizes/` - 获取所有奖项
- `GET /api/prizes/{prize_id}` - 根据ID获取奖项
- `GET /api/prizes/current` - 获取当前奖项
- `POST /api/prizes/` - 创建奖项
- `PUT /api/prizes/{prize_id}` - 更新奖项
- `DELETE /api/prizes/{prize_id}` - 删除奖项
- `DELETE /api/prizes/` - 删除所有奖项
- `POST /api/prizes/{prize_id}/set-current` - 设置当前奖项
- `POST /api/prizes/reset` - 重置所有奖项

### 全局配置 (`/api/config`)

- `GET /api/config/` - 获取全局配置
- `PUT /api/config/` - 更新全局配置
- `POST /api/config/reset` - 重置全局配置

### 媒体管理 (`/api/media`)

#### 音乐
- `GET /api/media/music` - 获取所有音乐
- `GET /api/media/music/{music_id}` - 根据ID获取音乐
- `POST /api/media/music` - 创建音乐
- `DELETE /api/media/music/{music_id}` - 删除音乐
- `DELETE /api/media/music` - 删除所有音乐

#### 图片
- `GET /api/media/images` - 获取所有图片
- `GET /api/media/images/{image_id}` - 根据ID获取图片
- `POST /api/media/images` - 创建图片
- `DELETE /api/media/images/{image_id}` - 删除图片
- `DELETE /api/media/images` - 删除所有图片

### 用户上传 (`/api/user-upload`)

- `GET /api/user-upload/all` - 获取所有用户上传数据（实际查询persons表中device_fingerprint不为空的记录）
- `GET /api/user-upload/device?device_fingerprint=xxx` - 根据设备指纹获取用户（查询persons表）
- `POST /api/user-upload/` - 创建或更新用户上传数据（操作persons表）
- `PUT /api/user-upload/{device_fingerprint}` - 更新用户上传数据（操作persons表）
- `DELETE /api/user-upload/?device_fingerprint=xxx` - 删除用户上传数据（从persons表删除）
- `DELETE /api/user-upload/all` - 删除所有用户上传数据（从persons表删除device_fingerprint不为空的记录）

## 数据库模型

### Person（人员）
- id: 主键
- uid: 用户ID
- uuid: 唯一标识
- name: 姓名
- department: 部门
- position: 职位
- identity: 身份
- avatar: 头像
- device_fingerprint: 设备指纹（用于标识用户上传来源）
- is_win: 是否中奖
- x, y: 坐标
- create_time, update_time: 创建和更新时间
- prize_name: 中奖名称列表
- prize_id: 中奖ID列表
- prize_time: 中奖时间列表

### Prize（奖项）
- id: 主键
- name: 奖项名称
- sort: 排序
- is_all: 是否全员参加
- count: 抽取人数
- is_used_count: 已使用次数
- picture_id, picture_name, picture_url: 奖项图片
- picture_thumbnail_url: 奖项缩略图URL
- separate_count_enable: 是否启用分批抽取
- separate_count_list: 分批抽取列表
- desc: 描述
- is_show: 是否显示
- is_used: 是否已使用
- frequency: 频率

### GlobalConfig（全局配置）
- row_count: 行数
- is_show_prize_list: 是否显示奖品列表
- is_show_avatar: 是否显示头像
- top_title: 标题
- language: 语言
- definite_time: 定时抽取时间
- win_music: 是否播放获奖音乐
- theme_*: 主题相关配置

### Music（音乐）
- id: 主键
- name: 音乐名称
- url: 音乐URL

### Image（图片）
- id: 主键
- name: 图片名称
- url: 图片URL
- thumbnail_url: 缩略图URL

## 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
DATABASE_URL=sqlite:///./lottery.db
HOST=0.0.0.0
PORT=8000
ALLOW_ORIGINS=*
```

## 开发说明

### 添加新的API端点

1. 在 `routers/` 目录下创建新的路由文件
2. 在 `main.py` 中注册路由

### 数据库迁移

当前使用SQLite，数据库会在首次运行时自动创建。

#### 运行数据库迁移

当数据库模型更新后，可以使用迁移脚本来更新现有数据库：

```bash
python migrate_db.py
```

迁移脚本会自动检查并添加缺失的列，不会影响现有数据。

#### 重置数据库

如需完全重置数据库（会删除所有数据）：

```bash
rm lottery.db
python main.py
```

## 前端集成

前端需要配置API基础URL为 `http://localhost:8000`，并调用相应的API接口。

## 许可证

MIT
