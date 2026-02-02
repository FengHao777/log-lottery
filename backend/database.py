from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# SQLite数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./lottery.db"

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()


# 数据库模型
class Person(Base):
    """人员配置表"""
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, default="")
    uuid = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    department = Column(String, default="")
    identity = Column(String, default="")
    avatar = Column(Text, default="")
    is_win = Column(Boolean, default=False)
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)
    create_time = Column(String, default="")
    update_time = Column(String, default="")
    prize_name = Column(JSON, default=list)
    prize_id = Column(JSON, default=list)
    prize_time = Column(JSON, default=list)


class Prize(Base):
    """奖项配置表"""
    __tablename__ = "prizes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sort = Column(Integer, default=0)
    is_all = Column(Boolean, default=False)
    count = Column(Integer, default=1)
    is_used_count = Column(Integer, default=0)
    picture_id = Column(String, default="-1")
    picture_name = Column(String, default="")
    picture_url = Column(Text, default="")
    separate_count_enable = Column(Boolean, default=True)
    separate_count_list = Column(JSON, default=list)
    desc = Column(Text, default="")
    is_show = Column(Boolean, default=False)
    is_used = Column(Boolean, default=False)
    frequency = Column(Integer, default=1)


class GlobalConfig(Base):
    """全局配置表"""
    __tablename__ = "global_config"

    id = Column(Integer, primary_key=True, index=True)
    row_count = Column(Integer, default=30)
    is_show_prize_list = Column(Boolean, default=True)
    is_show_avatar = Column(Boolean, default=False)
    top_title = Column(String, default="")
    language = Column(String, default="zh-CN")
    definite_time = Column(Integer, nullable=True)
    win_music = Column(Boolean, default=False)
    theme_name = Column(String, default="dracula")
    theme_detail = Column(JSON, default=dict)
    card_color = Column(String, default="#ff79c6")
    card_width = Column(Integer, default=140)
    card_height = Column(Integer, default=200)
    text_color = Column(String, default="#00000000")
    lucky_card_color = Column(String, default="#ECB1AC")
    text_size = Column(Integer, default=30)
    pattern_color = Column(String, default="#1b66c9")
    pattern_list = Column(JSON, default=list)
    background = Column(JSON, default=dict)
    font = Column(String, default="微软雅黑")
    title_font = Column(String, default="微软雅黑")
    title_font_sync_global = Column(Boolean, default=True)


class Music(Base):
    """音乐表"""
    __tablename__ = "music"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(Text, nullable=False)


class Image(Base):
    """图片表"""
    __tablename__ = "images"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(Text, nullable=False)


class UserUpload(Base):
    """用户上传数据表"""
    __tablename__ = "user_uploads"

    id = Column(String, primary_key=True, index=True)
    device_fingerprint = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, default="")
    position = Column(String, default="")
    photo = Column(String, default="")
    create_time = Column(String, default="")
    update_time = Column(String, default="")


class Department(Base):
    """部门配置表"""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    sort = Column(Integer, default=0)
    create_time = Column(String, default="")
    update_time = Column(String, default="")


# 创建所有表
def init_db():
    """初始化数据库"""
    Base.metadata.create_all(bind=engine)


# 获取数据库会话
def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
