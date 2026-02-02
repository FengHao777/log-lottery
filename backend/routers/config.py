from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from database import get_db
from schemas import GlobalConfig, GlobalConfigUpdate
from database import GlobalConfig as GlobalConfigModel

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/", response_model=GlobalConfig)
def get_global_config(db: Session = Depends(get_db)):
    """获取全局配置"""
    config = db.query(GlobalConfigModel).first()
    if not config:
        # 如果没有配置，创建默认配置
        config = GlobalConfigModel()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/", response_model=GlobalConfig)
def update_global_config(config_update: GlobalConfigUpdate, db: Session = Depends(get_db)):
    """更新全局配置"""
    config = db.query(GlobalConfigModel).first()
    if not config:
        config = GlobalConfigModel()
        db.add(config)

    update_data = config_update.model_dump(exclude_unset=True)

    # 处理嵌套的theme
    if "theme" in update_data:
        theme = update_data.pop("theme")
        config.theme_name = theme.name
        config.theme_detail = theme.detail.model_dump()
        config.card_color = theme.card_color
        config.card_width = theme.card_width
        config.card_height = theme.card_height
        config.text_color = theme.text_color
        config.lucky_card_color = theme.lucky_card_color
        config.text_size = theme.text_size
        config.pattern_color = theme.pattern_color
        config.pattern_list = theme.pattern_list
        config.background = theme.background
        config.font = theme.font
        config.title_font = theme.title_font
        config.title_font_sync_global = theme.title_font_sync_global

    for key, value in update_data.items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    return config


@router.post("/reset")
def reset_global_config(db: Session = Depends(get_db)):
    """重置全局配置"""
    # 删除现有配置
    db.query(GlobalConfigModel).delete()

    # 创建新的默认配置
    config = GlobalConfigModel()
    db.add(config)
    db.commit()
    db.refresh(config)
    return {"status": "success", "message": "Global config reset successfully", "config": config}
