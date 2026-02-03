#!/usr/bin/env python3
"""
测试数据库迁移是否成功
"""

import sys
from pathlib import Path

# 添加backend目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from database import SessionLocal, Prize, Image

def test_migration():
    """测试数据库迁移"""
    db = SessionLocal()
    
    try:
        # 测试查询prizes表
        print("测试 prizes 表...")
        prizes = db.query(Prize).all()
        print(f"✓ 成功查询 prizes 表，共 {len(prizes)} 条记录")
        
        # 验证picture_thumbnail_url字段
        for prize in prizes:
            assert hasattr(prize, 'picture_thumbnail_url'), "Prize缺少picture_thumbnail_url字段"
        print("✓ 所有prizes记录都有picture_thumbnail_url字段")
        
        # 测试查询images表
        print("\n测试 images 表...")
        images = db.query(Image).all()
        print(f"✓ 成功查询 images 表，共 {len(images)} 条记录")
        
        # 验证thumbnail_url字段
        for image in images:
            assert hasattr(image, 'thumbnail_url'), "Image缺少thumbnail_url字段"
        print("✓ 所有images记录都有thumbnail_url字段")
        
        print("\n✅ 数据库迁移测试通过！")
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_migration()
    sys.exit(0 if success else 1)
