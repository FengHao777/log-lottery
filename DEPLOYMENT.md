# 部署指南

本文档介绍如何将抽奖系统部署到Linux服务器。

## 前提条件

- Linux服务器（Ubuntu 20.04+ 或 CentOS 7+）
- Python 3.9+
- Node.js 18+
- Nginx（可选，用于反向代理）
- Conda（可选，也可使用venv）

## 部署架构

```
┌─────────────┐
│   Nginx    │ (可选，反向代理)
│   :80/443   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐  ┌─────▼──────┐
│   前端      │  │   后端      │
│   :5173     │  │   :8000     │
│  (静态文件)  │  │  (FastAPI)  │
└─────────────┘  └─────┬──────┘
                        │
                        ▼
                   ┌─────────┐
                   │ SQLite  │
                   │ lottery.db│
                   └─────────┘
```

## 部署步骤

### 1. 准备服务器环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y git curl wget vim

# 安装Node.js（使用nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装Python和pip
sudo apt install -y python3 python3-pip

# 安装Conda（可选）
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh
source ~/.bashrc
```

### 2. 克隆项目

```bash
# 克隆代码仓库
git clone <your-repo-url> /opt/lottery
cd /opt/lottery
```

### 3. 部署后端

```bash
# 创建conda环境
conda create -n nianhui python=3.12 -y
conda activate nianhui

# 安装依赖
cd backend
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
vim .env
# 修改配置：
# DATABASE_URL=sqlite:///./lottery.db
# HOST=0.0.0.0
# PORT=8000
# ALLOW_ORIGINS=https://your-domain.com

# 测试运行
python main.py
# 访问 http://your-server-ip:8000/docs 测试API
```

### 4. 使用Systemd管理后端服务

创建服务文件：

```bash
sudo vim /etc/systemd/system/lottery-backend.service
```

内容：

```ini
[Unit]
Description=Lottery Backend Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/lottery/backend
Environment="PATH=/home/your-username/miniconda3/envs/nianhui/bin"
ExecStart=/home/your-username/miniconda3/envs/nianhui/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable lottery-backend
sudo systemctl start lottery-backend
sudo systemctl status lottery-backend
```

### 5. 部署前端

```bash
cd /opt/lottery

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
vim .env
# 修改后端API地址：
# VITE_API_BASE_URL=https://your-domain.com/api

# 构建前端
npm run build

# 构建产物在 dist/ 目录
```

### 6. 使用Nginx部署前端

安装Nginx：

```bash
sudo apt install -y nginx
```

配置Nginx：

```bash
sudo vim /etc/nginx/sites-available/lottery
```

内容：

```nginx
# 后端API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 前端静态文件
server {
    listen 80;
    server_name your-domain.com;

    root /opt/lottery/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理到后端
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/lottery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 配置HTTPS（使用Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 使用Docker部署（推荐）

### 创建Dockerfile

#### 后端Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["python", "main.py"]
```

#### 前端Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/lottery.db:/app/lottery.db
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 启动服务

```bash
docker-compose up -d
```

## 监控和日志

### 查看后端日志

```bash
sudo journalctl -u lottery-backend -f
```

### 查看Nginx日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份

```bash
# 创建备份脚本
vim /opt/backup-lottery-db.sh
```

内容：

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

cp /opt/lottery/backend/lottery.db $BACKUP_DIR/lottery_$DATE.db

# 保留最近7天的备份
find $BACKUP_DIR -name "lottery_*.db" -mtime +7 -delete
```

添加到crontab：

```bash
crontab -e
# 每天凌晨2点备份
0 2 * * * /opt/backup-lottery-db.sh
```

## 性能优化

### 后端优化

1. 使用Gunicorn + Uvicorn workers
2. 启用数据库连接池
3. 添加Redis缓存（可选）

### 前端优化

1. 启用Gzip压缩
2. 配置CDN
3. 使用HTTP/2

### Nginx优化

```nginx
# 在nginx配置中添加
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

## 安全建议

1. 配置防火墙，只开放必要端口
2. 定期更新系统和依赖
3. 使用强密码和SSH密钥
4. 配置fail2ban防止暴力破解
5. 定期备份数据库

## 故障排查

### 后端无法启动

```bash
# 检查端口占用
sudo netstat -tlnp | grep 8000

# 检查服务状态
sudo systemctl status lottery-backend

# 查看详细日志
sudo journalctl -u lottery-backend -n 50
```

### 前端无法访问

```bash
# 检查Nginx配置
sudo nginx -t

# 检查Nginx状态
sudo systemctl status nginx

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### API请求失败

1. 检查CORS配置
2. 检查防火墙规则
3. 查看后端日志
4. 验证环境变量配置

## 更新部署

```bash
cd /opt/lottery
git pull

# 更新后端
cd backend
conda activate nianhui
pip install -r requirements.txt
sudo systemctl restart lottery-backend

# 更新前端
cd ..
npm install
npm run build
sudo systemctl reload nginx
```
