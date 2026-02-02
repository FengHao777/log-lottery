from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
import base64
import re

from database import get_db
from schemas import UserUpload, UserUploadCreate, UserUploadUpdate, MessageResponse
from database import UserUpload as UserUploadModel
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from image_utils import save_image

router = APIRouter(prefix="/api/user-upload", tags=["user-upload"])


def is_base64_image(photo: str) -> bool:
    """检查是否是base64编码的图片"""
    if not photo:
        return False
    base64_pattern = r'^data:image\/([a-zA-Z]*);base64,([a-zA-Z0-9+/=]+)$'
    return bool(re.match(base64_pattern, photo))


def decode_base64_image(photo: str) -> bytes:
    """解码base64图片"""
    if not photo:
        return b""
    base64_pattern = r'^data:image\/([a-zA-Z]*);base64,([a-zA-Z0-9+/=]+)$'
    match = re.match(base64_pattern, photo)
    if match:
        return base64.b64decode(match.group(2))
    return base64.b64decode(photo)


@router.get("/all", response_model=List[UserUpload])
def get_all_user_uploads(db: Session = Depends(get_db)):
    """获取所有用户上传数据"""
    uploads = db.query(UserUploadModel).all()
    return uploads


@router.get("/device", response_model=UserUpload)
def get_user_by_device_fingerprint(
    device_fingerprint: str = Query(..., description="设备指纹"),
    db: Session = Depends(get_db)
):
    """根据设备指纹获取用户数据"""
    user = db.query(UserUploadModel).filter(
        UserUploadModel.device_fingerprint == device_fingerprint
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=MessageResponse)
def create_or_update_user_upload(user_data: UserUploadCreate, db: Session = Depends(get_db)):
    """创建或更新用户上传数据"""
    # 处理图片：如果是base64编码，则解码并保存到文件目录
    photo_filename = user_data.photo
    if is_base64_image(user_data.photo):
        try:
            image_bytes = decode_base64_image(user_data.photo)
            photo_filename = save_image(image_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
    
    # 检查是否已存在该设备指纹的用户
    existing_user = db.query(UserUploadModel).filter(
        UserUploadModel.device_fingerprint == user_data.device_fingerprint
    ).first()

    if existing_user:
        # 更新现有用户
        existing_user.name = user_data.name  # type: ignore
        existing_user.department = user_data.department  # type: ignore
        existing_user.position = user_data.position  # type: ignore
        existing_user.photo = photo_filename  # type: ignore
        existing_user.update_time = user_data.update_time  # type: ignore
        db.commit()
        return {"status": "success", "message": "User updated successfully"}
    else:
        # 创建新用户，使用前端提供的 id（如果有的话），否则自动生成
        user_dict = user_data.model_dump()
        user_dict['photo'] = photo_filename
        if not user_dict.get('id'):
            user_dict['id'] = str(uuid.uuid4())
        db_user = UserUploadModel(**user_dict)
        db.add(db_user)
        db.commit()
        return {"status": "success", "message": "User created successfully"}


@router.put("/{device_fingerprint}", response_model=MessageResponse)
def update_user_upload(
    device_fingerprint: str,
    user_update: UserUploadUpdate,
    db: Session = Depends(get_db)
):
    """更新用户上传数据"""
    db_user = db.query(UserUploadModel).filter(
        UserUploadModel.device_fingerprint == device_fingerprint
    ).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)  # type: ignore

    db.commit()
    return {"status": "success", "message": "User updated successfully"}


@router.delete("/", response_model=MessageResponse)
def delete_user_upload(
    device_fingerprint: str = Query(..., description="设备指纹"),
    db: Session = Depends(get_db)
):
    """删除用户上传数据"""
    db_user = db.query(UserUploadModel).filter(
        UserUploadModel.device_fingerprint == device_fingerprint
    ).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()
    return {"status": "success", "message": "User deleted successfully"}


@router.delete("/all", response_model=MessageResponse)
def delete_all_user_uploads(db: Session = Depends(get_db)):
    """删除所有用户上传数据"""
    db.query(UserUploadModel).delete()
    db.commit()
    return {"status": "success", "message": "All user uploads deleted successfully"}


@router.post("/upload-photo", response_model=dict)
async def upload_photo(
    file: UploadFile = File(...),
    max_width: int = Query(800, description="最大宽度"),
    max_height: int = Query(800, description="最大高度"),
    quality: int = Query(75, description="图片质量(1-100)")
):
    """
    上传并处理图片
    
    - 处理图片：压缩和缩放
    - 保存到文件目录
    - 返回文件名(MD5)
    """
    try:
        # 读取文件内容
        file_content = await file.read()
        
        # 保存并处理图片
        filename = save_image(file_content, max_width, max_height, quality)
        
        return {
            "status": "success",
            "filename": filename,
            "message": "Photo uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")
