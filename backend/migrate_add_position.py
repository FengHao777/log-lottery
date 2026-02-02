import sqlite3
import os

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'lottery.db')

def migrate_add_position():
    """添加position字段到user_uploads表"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 检查position列是否已存在
        cursor.execute("PRAGMA table_info(user_uploads)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'position' not in columns:
            print("正在添加position字段...")
            cursor.execute("ALTER TABLE user_uploads ADD COLUMN position TEXT DEFAULT ''")
            conn.commit()
            print("position字段添加成功！")
        else:
            print("position字段已存在，无需迁移")

    except Exception as e:
        print(f"迁移失败: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_add_position()
