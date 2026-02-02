from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ==================== 人员相关模型 ====================
class PersonBase(BaseModel):
    uid: str = ""
    uuid: str = ""
    name: str
    department: str = ""
    identity: str = ""
    avatar: str = ""
    is_win: bool = False
    x: int = 0
    y: int = 0
    create_time: str = ""
    update_time: str = ""
    prize_name: List[str] = []
    prize_id: List[str] = []
    prize_time: List[str] = []


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    uid: Optional[str] = None
    uuid: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    identity: Optional[str] = None
    avatar: Optional[str] = None
    is_win: Optional[bool] = None
    x: Optional[int] = None
    y: Optional[int] = None
    create_time: Optional[str] = None
    update_time: Optional[str] = None
    prize_name: Optional[List[str]] = None
    prize_id: Optional[List[str]] = None
    prize_time: Optional[List[str]] = None


class Person(PersonBase):
    id: int

    class Config:
        from_attributes = True


# ==================== 奖项相关模型 ====================
class SeparateCountItem(BaseModel):
    id: str
    count: int
    is_used_count: int


class PrizePicture(BaseModel):
    id: str
    name: str
    url: str


class SeparateCount(BaseModel):
    enable: bool = True
    count_list: List[SeparateCountItem] = []


class PrizeBase(BaseModel):
    name: str
    sort: int = 0
    is_all: bool = False
    count: int = 1
    is_used_count: int = 0
    picture: PrizePicture = PrizePicture(id="-1", name="", url="")
    separate_count: SeparateCount = SeparateCount()
    desc: str = ""
    is_show: bool = False
    is_used: bool = False
    frequency: int = 1


class PrizeCreate(PrizeBase):
    pass


class PrizeUpdate(BaseModel):
    name: Optional[str] = None
    sort: Optional[int] = None
    is_all: Optional[bool] = None
    count: Optional[int] = None
    is_used_count: Optional[int] = None
    picture: Optional[PrizePicture] = None
    separate_count: Optional[SeparateCount] = None
    desc: Optional[str] = None
    is_show: Optional[bool] = None
    is_used: Optional[bool] = None
    frequency: Optional[int] = None


class Prize(PrizeBase):
    id: int

    class Config:
        from_attributes = True


# ==================== 全局配置相关模型 ====================
class ThemeDetail(BaseModel):
    primary: str = "#0f5fd3"


class Theme(BaseModel):
    name: str = "dracula"
    detail: ThemeDetail = ThemeDetail()
    card_color: str = "#ff79c6"
    card_width: int = 140
    card_height: int = 200
    text_color: str = "#00000000"
    lucky_card_color: str = "#ECB1AC"
    text_size: int = 30
    pattern_color: str = "#1b66c9"
    pattern_list: List[int] = []
    background: Dict[str, Any] = {}
    font: str = "微软雅黑"
    title_font: str = "微软雅黑"
    title_font_sync_global: bool = True


class GlobalConfigBase(BaseModel):
    row_count: int = 30
    is_show_prize_list: bool = True
    is_show_avatar: bool = False
    top_title: str = ""
    language: str = "zh-CN"
    definite_time: Optional[int] = None
    win_music: bool = False
    theme: Theme = Theme()


class GlobalConfigUpdate(BaseModel):
    row_count: Optional[int] = None
    is_show_prize_list: Optional[bool] = None
    is_show_avatar: Optional[bool] = None
    top_title: Optional[str] = None
    language: Optional[str] = None
    definite_time: Optional[int] = None
    win_music: Optional[bool] = None
    theme: Optional[Theme] = None


class GlobalConfig(GlobalConfigBase):
    id: int

    class Config:
        from_attributes = True


# ==================== 音乐相关模型 ====================
class MusicBase(BaseModel):
    name: str
    url: str


class MusicCreate(MusicBase):
    pass


class Music(MusicBase):
    id: str

    class Config:
        from_attributes = True


# ==================== 图片相关模型 ====================
class ImageBase(BaseModel):
    name: str
    url: str


class ImageCreate(ImageBase):
    pass


class Image(ImageBase):
    id: str

    class Config:
        from_attributes = True


# ==================== 用户上传相关模型 ====================
class UserUploadBase(BaseModel):
    device_fingerprint: str
    name: str
    department: str = ""
    position: str = ""
    photo: str = ""
    create_time: str = ""
    update_time: str = ""


class UserUploadCreate(UserUploadBase):
    id: Optional[str] = None


class UserUploadUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    photo: Optional[str] = None
    update_time: Optional[str] = None


class UserUpload(UserUploadBase):
    id: str

    class Config:
        from_attributes = True


# ==================== 通用响应模型 ====================
class MessageResponse(BaseModel):
    status: str
    message: str


# ==================== 部门相关模型 ====================
class DepartmentBase(BaseModel):
    name: str
    sort: int = 0
    create_time: str = ""
    update_time: str = ""


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    sort: Optional[int] = None
    update_time: Optional[str] = None


class Department(DepartmentBase):
    id: int

    class Config:
        from_attributes = True
