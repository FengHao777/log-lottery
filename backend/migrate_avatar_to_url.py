"""
数据迁移脚本：将base64头像转换为URL

此脚本会：
1. 读取数据库中所有人员记录
2. 检查avatar字段是否是base64格式（以"data:image"开头）
3. 如果是base64，将其转换为文件并上传到服务器
4. 更新数据库中的avatar和thumbnail_avatar字段为URL

使用方法：
    python migrate_avatar_to_url.py
"""

import os
import sys
import base64
import uuid
from datetime import datetime
from PIL import Image as PILImage
import io

# 添加backend目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Person

UPLOAD_DIR = "uploads"
THUMBNAIL_DIR = os.path.join(UPLOAD_DIR, "thumbnails")
THUMBNAIL_SIZE = (200, 200)  # 缩略图尺寸

# 确保上传目录存在
for dir_path in [UPLOAD_DIR, THUMBNAIL_DIR]:
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)


def generate_thumbnail(image_path: str, thumbnail_path: str, size: tuple = THUMBNAIL_SIZE) -> str:
    """生成图片缩略图"""
    try:
        with PILImage.open(image_path) as img:
            # 转换为 RGB 模式（如果原图是 RGBA）
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            # 生成缩略图
            img.thumbnail(size, PILImage.Resampling.LANCZOS)
            # 保存缩略图
            img.save(thumbnail_path, 'JPEG', quality=85)
        return thumbnail_path
    except Exception as e:
        print(f"生成缩略图失败: {e}")
        return ""


def is_base64_image(data: str) -> bool:
    """检查字符串是否是base64图片"""
    if not data:
        return False
    return data.startswith("data:image/")


def base64_to_file(base64_data: str) -> tuple[str, str]:
    """
    将base64图片数据保存为文件
    返回：(文件路径, 文件扩展名)
    """
    # 提取base64数据部分
    if "," in base64_data:
        header, data = base64_data.split(",", 1)
    else:
        data = base64_data

    # 解析图片类型
    if "image/jpeg" in base64_data or "image/jpg" in base64_data:
        ext = ".jpg"
    elif "image/png" in base64_data:
        ext = ".png"
    elif "image/webp" in base64_data:
        ext = ".webp"
    else:
        ext = ".jpg"  # 默认使用jpg

    # 生成唯一文件名
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 解码base64并保存文件
    image_data = base64.b64decode(data)
    with open(file_path, "wb") as f:
        f.write(image_data)

    return file_path, ext


def process_avatar(person: Person) -> bool:
    """
    处理单个人员的头像
    返回：是否成功处理
    """
    try:
        # 检查avatar是否是base64
        avatar_value = str(person.avatar) if person.avatar else ""
        if not is_base64_image(avatar_value):
            print(f"  跳过: {person.name} - avatar已经是URL格式")
            return False

        print(f"  处理: {person.name}")

        # 将base64转换为文件
        file_path, ext = base64_to_file(avatar_value)
        print(f"    保存文件: {file_path}")

        # 生成缩略图
        thumbnail_filename = f"thumb_{os.path.basename(file_path)}"
        thumbnail_path = os.path.join(THUMBNAIL_DIR, thumbnail_filename)
        generate_thumbnail(file_path, thumbnail_path)
        print(f"    生成缩略图: {thumbnail_path}")

        # 更新数据库
        person.avatar = f"/api/uploads/{os.path.basename(file_path)}"
        person.thumbnail_avatar = f"/api/uploads/thumbnails/{thumbnail_filename}"
        person.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        print(f"    更新数据库:")
        print(f"      avatar: {person.avatar}")
        print(f"      thumbnail_avatar: {person.thumbnail_avatar}")

        return True

    except Exception as e:
        print(f"  错误: {person.name} - {str(e)}")
        return False


def migrate():
    """执行数据迁移"""
    print("=" * 60)
    print("开始迁移base64头像到URL")
    print("=" * 60)

    db = SessionLocal()

    try:
        # 获取所有人员
        persons = db.query(Person).all()
        total = len(persons)
        print(f"\n找到 {total} 条人员记录\n")

        processed = 0
        skipped = 0
        errors = 0

        for i, person in enumerate(persons, 1):
            print(f"[{i}/{total}] {person.name}:")

            if process_avatar(person):
                processed += 1
            else:
                skipped += 1

            print()

        # 提交更改
        db.commit()

        print("=" * 60)
        print("迁移完成！")
        print("=" * 60)
        print(f"总计: {total} 条记录")
        print(f"已处理: {processed} 条")
        print(f"已跳过: {skipped} 条")
        print(f"错误: {errors} 条")

    except Exception as e:
        db.rollback()
        print(f"\n迁移失败: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    # 询问用户确认
    print("此脚本将把数据库中的base64头像转换为URL格式。")
    print("建议在执行前备份数据库文件 (lottery.db)\n")

    response = input("是否继续? (yes/no): ").strip().lower()

    if response not in ["yes", "y"]:
        print("已取消")
        sys.exit(0)

    print()
    migrate()
