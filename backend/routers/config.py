from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from database import get_db
from schemas import GlobalConfig, GlobalConfigUpdate, Theme, ThemeDetail
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
    
    # 构造嵌套的 theme 对象以匹配 Pydantic 模型
    theme = Theme(
        name=config.theme_name,
        detail=ThemeDetail(**config.theme_detail) if config.theme_detail else ThemeDetail(),
        card_color=config.card_color,
        card_width=config.card_width,
        card_height=config.card_height,
        text_color=config.text_color,
        lucky_card_color=config.lucky_card_color,
        text_size=config.text_size,
        pattern_color=config.pattern_color,
        pattern_list=config.pattern_list if config.pattern_list else [],
        background=config.background if config.background else {},
        font=config.font,
        title_font=config.title_font,
        title_font_sync_global=config.title_font_sync_global,
    )
    
    # 返回完整的 GlobalConfig 对象
    return GlobalConfig(
        id=config.id,
        row_count=config.row_count,
        is_show_prize_list=config.is_show_prize_list,
        is_show_avatar=config.is_show_avatar,
        top_title=config.top_title,
        language=config.language,
        definite_time=config.definite_time,
        win_music=config.win_music,
        theme=theme,
    )


def _get_global_config_internal(db: Session):
    """内部函数：获取全局配置并构造嵌套结构"""
    config = db.query(GlobalConfigModel).first()
    if not config:
        config = GlobalConfigModel()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    # 构造嵌套的 theme 对象以匹配 Pydantic 模型
    theme = Theme(
        name=config.theme_name,
        detail=ThemeDetail(**config.theme_detail) if config.theme_detail else ThemeDetail(),
        card_color=config.card_color,
        card_width=config.card_width,
        card_height=config.card_height,
        text_color=config.text_color,
        lucky_card_color=config.lucky_card_color,
        text_size=config.text_size,
        pattern_color=config.pattern_color,
        pattern_list=config.pattern_list if config.pattern_list else [],
        background=config.background if config.background else {},
        font=config.font,
        title_font=config.title_font,
        title_font_sync_global=config.title_font_sync_global,
    )
    
    # 返回完整的 GlobalConfig 对象
    return GlobalConfig(
        id=config.id,
        row_count=config.row_count,
        is_show_prize_list=config.is_show_prize_list,
        is_show_avatar=config.is_show_avatar,
        top_title=config.top_title,
        language=config.language,
        definite_time=config.definite_time,
        win_music=config.win_music,
        theme=theme,
    )

@router.get("/", response_model=GlobalConfig)
def get_global_config(db: Session = Depends(get_db)):
    """获取全局配置"""
    return _get_global_config_internal(db)

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
        # theme 可能是 Pydantic 对象或字典
        if isinstance(theme, dict):
            config.theme_name = theme.get("name", "dracula")
            config.theme_detail = theme.get("detail", {"primary": "#0f5fd3"})
            config.card_color = theme.get("card_color", "#ff79c6")
            config.card_width = theme.get("card_width", 140)
            config.card_height = theme.get("card_height", 200)
            config.text_color = theme.get("text_color", "#00000000")
            config.lucky_card_color = theme.get("lucky_card_color", "#ECB1AC")
            config.text_size = theme.get("text_size", 30)
            config.pattern_color = theme.get("pattern_color", "#1b66c9")
            config.pattern_list = theme.get("pattern_list", [])
            config.background = theme.get("background", {})
            config.font = theme.get("font", "微软雅黑")
            config.title_font = theme.get("title_font", "微软雅黑")
            config.title_font_sync_global = theme.get("title_font_sync_global", True)
        else:
            config.theme_name = theme.name
            config.theme_detail = theme.detail.model_dump() if hasattr(theme.detail, 'model_dump') else theme.detail
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
    
    # 返回完整的配置对象（需要构造嵌套结构）
    return _get_global_config_internal(db)


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
