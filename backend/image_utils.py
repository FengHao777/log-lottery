import hashlib
import os
from io import BytesIO
from typing import Optional, Tuple

from PIL import Image


UPLOAD_DIR = "uploads"
MAX_WIDTH = 800
MAX_HEIGHT = 800
QUALITY = 75


def ensure_upload_dir():
    """确保上传目录存在"""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)


def calculate_md5(file_content: bytes) -> str:
    """计算文件的MD5值"""
    return hashlib.md5(file_content).hexdigest()


def process_image(file_content: bytes, max_width: int = MAX_WIDTH, max_height: int = MAX_HEIGHT, quality: int = QUALITY) -> Tuple[bytes, str]:
    """
    处理图片：压缩和缩放
    
    Args:
        file_content: 图片二进制内容
        max_width: 最大宽度
        max_height: 最大高度
        quality: 图片质量(1-100)
    
    Returns:
        (处理后的图片内容, 文件扩展名)
    """
    img = Image.open(BytesIO(file_content))
    
    # 获取原始格式
    file_format = img.format or "JPEG"
    ext = file_format.lower()
    if ext == "jpeg":
        ext = "jpg"
    
    # 缩放图片
    img.thumbnail((max_width, max_height), Image.LANCZOS)
    
    # 转换为RGB模式（如果需要）
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # 压缩图片
    output_buffer = BytesIO()
    img.save(output_buffer, format=file_format, quality=quality, optimize=True)
    processed_content = output_buffer.getvalue()
    
    return processed_content, ext


def save_image(file_content: bytes, max_width: int = MAX_WIDTH, max_height: int = MAX_HEIGHT, quality: int = QUALITY) -> str:
    """
    处理并保存图片到文件目录
    
    Args:
        file_content: 图片二进制内容
        max_width: 最大宽度
        max_height: 最大高度
        quality: 图片质量(1-100)
    
    Returns:
        md5文件名（不含扩展名）
    """
    ensure_upload_dir()
    
    # 处理图片
    processed_content, ext = process_image(file_content, max_width, max_height, quality)
    
    # 计算MD5
    md5_hash = calculate_md5(processed_content)
    
    # 检查文件是否已存在
    file_path = os.path.join(UPLOAD_DIR, f"{md5_hash}.{ext}")
    if not os.path.exists(file_path):
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(processed_content)
    
    return f"{md5_hash}.{ext}"


def get_image_path(md5_filename: str) -> str:
    """
    获取图片的完整路径
    
    Args:
        md5_filename: MD5文件名（如：abc123.jpg）
    
    Returns:
        图片的完整路径
    """
    return os.path.join(UPLOAD_DIR, md5_filename)


def delete_image(md5_filename: str) -> bool:
    """
    删除图片文件
    
    Args:
        md5_filename: MD5文件名
    
    Returns:
        是否删除成功
    """
    file_path = get_image_path(md5_filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False
