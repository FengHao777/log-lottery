#!/usr/bin/env python3
"""
数据库迁移脚本
用于更新数据库架构以匹配最新的模型定义
"""

import sqlite3
from pathlib import Path

# 数据库路径
DB_PATH = Path(__file__).parent / "lottery.db"


def check_column_exists(conn, table_name, column_name):
    """检查表中是否存在指定列"""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = [col[1] for col in cursor.fetchall()]
    return column_name in columns


def migrate():
    """执行数据库迁移"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 检查并添加 prizes.picture_thumbnail_url 列
        if not check_column_exists(conn, "prizes", "picture_thumbnail_url"):
            print("添加 prizes.picture_thumbnail_url 列...")
            cursor.execute(
                "ALTER TABLE prizes ADD COLUMN picture_thumbnail_url TEXT DEFAULT '';"
            )
            print("✓ prizes.picture_thumbnail_url 列已添加")
        else:
            print("✓ prizes.picture_thumbnail_url 列已存在")

        # 检查并添加 images.thumbnail_url 列
        if not check_column_exists(conn, "images", "thumbnail_url"):
            print("添加 images.thumbnail_url 列...")
            cursor.execute(
                "ALTER TABLE images ADD COLUMN thumbnail_url TEXT DEFAULT '';"
            )
            print("✓ images.thumbnail_url 列已添加")
        else:
            print("✓ images.thumbnail_url 列已存在")

        # 提交更改
        conn.commit()
        print("\n数据库迁移完成！")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ 迁移失败: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
