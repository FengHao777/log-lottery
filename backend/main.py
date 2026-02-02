from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db
from routers import persons, prizes, config, media, user_upload, departments
import os

# 创建FastAPI应用
app = FastAPI(
    title="Lottery Backend API",
    description="抽奖系统后端API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(persons.router)
app.include_router(prizes.router)
app.include_router(config.router)
app.include_router(media.router)
app.include_router(user_upload.router)
app.include_router(departments.router)


# 挂载静态文件服务
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_db()


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Lottery Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
