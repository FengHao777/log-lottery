from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from datetime import datetime

from database import get_db
from schemas import Music, MusicCreate, Image, ImageCreate
from database import Music as MusicModel, Image as ImageModel

router = APIRouter(prefix="/api/media", tags=["media"])

UPLOAD_DIR = "uploads"
THUMBNAIL_DIR = os.path.join(UPLOAD_DIR, "thumbnails")

for dir_path in [UPLOAD_DIR, THUMBNAIL_DIR]:
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)


# ==================== 音乐相关接口 ====================
@router.get("/music", response_model=List[Music])
def get_all_music(db: Session = Depends(get_db)):
    """获取所有音乐"""
    music_list = db.query(MusicModel).all()
    return music_list


@router.get("/music/{music_id}", response_model=Music)
def get_music(music_id: str, db: Session = Depends(get_db)):
    """根据ID获取音乐"""
    music = db.query(MusicModel).filter(MusicModel.id == music_id).first()
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
    return music


@router.post("/music", response_model=Music)
def create_music(music: MusicCreate, db: Session = Depends(get_db)):
    """创建音乐"""
    db_music = MusicModel(**music.model_dump())
    db.add(db_music)
    db.commit()
    db.refresh(db_music)
    return db_music


@router.delete("/music/{music_id}")
def delete_music(music_id: str, db: Session = Depends(get_db)):
    """删除音乐"""
    db_music = db.query(MusicModel).filter(MusicModel.id == music_id).first()
    if not db_music:
        raise HTTPException(status_code=404, detail="Music not found")

    db.delete(db_music)
    db.commit()
    return {"status": "success", "message": "Music deleted successfully"}


@router.delete("/music")
def delete_all_music(db: Session = Depends(get_db)):
    """删除所有音乐"""
    db.query(MusicModel).delete()
    db.commit()
    return {"status": "success", "message": "All music deleted successfully"}


# ==================== 图片相关接口 ====================
@router.get("/images", response_model=List[Image])
def get_all_images(db: Session = Depends(get_db)):
    """获取所有图片"""
    images = db.query(ImageModel).all()
    return images


@router.get("/images/{image_id}", response_model=Image)
def get_image(image_id: str, db: Session = Depends(get_db)):
    """根据ID获取图片"""
    image = db.query(ImageModel).filter(ImageModel.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.post("/images", response_model=Image)
def create_image(image: ImageCreate, db: Session = Depends(get_db)):
    """创建图片"""
    db_image = ImageModel(**image.model_dump())
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@router.delete("/images/{image_id}")
def delete_image(image_id: str, db: Session = Depends(get_db)):
    """删除图片"""
    db_image = db.query(ImageModel).filter(ImageModel.id == image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")

    db.delete(db_image)
    db.commit()
    return {"status": "success", "message": "Image deleted successfully"}


@router.delete("/images")
def delete_all_images(db: Session = Depends(get_db)):
    """删除所有图片"""
    db.query(ImageModel).delete()
    db.commit()
    return {"status": "success", "message": "All images deleted successfully"}


@router.post("/upload", response_model=dict)
async def upload_image(file: UploadFile = File(...)):
    """上传图片并返回URL"""
    # 检查文件类型
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WebP are allowed.")

    # 生成唯一文件名
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 保存文件
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # 返回文件URL
    file_url = f"/api/uploads/{unique_filename}"
    return {
        "url": file_url,
        "filename": unique_filename,
        "original_filename": file.filename
    }
