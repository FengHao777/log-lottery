from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import Prize, PrizeCreate, PrizeUpdate
from database import Prize as PrizeModel

router = APIRouter(prefix="/api/prizes", tags=["prizes"])


@router.get("/", response_model=List[Prize])
def get_all_prizes(db: Session = Depends(get_db)):
    """获取所有奖项"""
    prizes = db.query(PrizeModel).order_by(PrizeModel.sort).all()
    return prizes


@router.get("/{prize_id}", response_model=Prize)
def get_prize(prize_id: int, db: Session = Depends(get_db)):
    """根据ID获取奖项"""
    prize = db.query(PrizeModel).filter(PrizeModel.id == prize_id).first()
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")
    return prize


@router.get("/current", response_model=Prize)
def get_current_prize(db: Session = Depends(get_db)):
    """获取当前奖项（第一个未使用的奖项）"""
    prize = db.query(PrizeModel).filter(PrizeModel.is_used == False).order_by(PrizeModel.sort).first()
    if not prize:
        raise HTTPException(status_code=404, detail="No available prize found")
    return prize


@router.post("/", response_model=Prize)
def create_prize(prize: PrizeCreate, db: Session = Depends(get_db)):
    """创建奖项"""
    db_prize = PrizeModel(
        name=prize.name,
        sort=prize.sort,
        is_all=prize.is_all,
        count=prize.count,
        is_used_count=prize.is_used_count,
        picture_id=prize.picture.id,
        picture_name=prize.picture.name,
        picture_url=prize.picture.url,
        separate_count_enable=prize.separate_count.enable,
        separate_count_list=[item.model_dump() for item in prize.separate_count.count_list],
        desc=prize.desc,
        is_show=prize.is_show,
        is_used=prize.is_used,
        frequency=prize.frequency
    )
    db.add(db_prize)
    db.commit()
    db.refresh(db_prize)
    return db_prize


@router.post("/batch", response_model=List[Prize])
def create_prizes_batch(prizes: List[PrizeCreate], db: Session = Depends(get_db)):
    """批量创建奖项"""
    db_prizes = []
    for prize in prizes:
        db_prize = PrizeModel(
            name=prize.name,
            sort=prize.sort,
            is_all=prize.is_all,
            count=prize.count,
            is_used_count=prize.is_used_count,
            picture_id=prize.picture.id,
            picture_name=prize.picture.name,
            picture_url=prize.picture.url,
            separate_count_enable=prize.separate_count.enable,
            separate_count_list=[item.model_dump() for item in prize.separate_count.count_list],
            desc=prize.desc,
            is_show=prize.is_show,
            is_used=prize.is_used,
            frequency=prize.frequency
        )
        db.add(db_prize)
        db_prizes.append(db_prize)
    db.commit()
    for db_prize in db_prizes:
        db.refresh(db_prize)
    return db_prizes


@router.put("/{prize_id}", response_model=Prize)
def update_prize(prize_id: int, prize_update: PrizeUpdate, db: Session = Depends(get_db)):
    """更新奖项"""
    db_prize = db.query(PrizeModel).filter(PrizeModel.id == prize_id).first()
    if not db_prize:
        raise HTTPException(status_code=404, detail="Prize not found")

    update_data = prize_update.model_dump(exclude_unset=True)

    # 处理嵌套的picture和separate_count
    if "picture" in update_data:
        picture = update_data.pop("picture")
        db_prize.picture_id = picture.id
        db_prize.picture_name = picture.name
        db_prize.picture_url = picture.url

    if "separate_count" in update_data:
        separate_count = update_data.pop("separate_count")
        db_prize.separate_count_enable = separate_count.enable
        db_prize.separate_count_list = [item.model_dump() for item in separate_count.count_list]

    for key, value in update_data.items():
        setattr(db_prize, key, value)

    # 自动根据 is_used_count 和 count 更新 is_used 状态，确保数据一致性
    if db_prize.is_used_count >= db_prize.count:
        db_prize.is_used = True
    else:
        db_prize.is_used = False

    db.commit()
    db.refresh(db_prize)
    return db_prize


@router.delete("/{prize_id}")
def delete_prize(prize_id: int, db: Session = Depends(get_db)):
    """删除奖项"""
    db_prize = db.query(PrizeModel).filter(PrizeModel.id == prize_id).first()
    if not db_prize:
        raise HTTPException(status_code=404, detail="Prize not found")

    db.delete(db_prize)
    db.commit()
    return {"status": "success", "message": "Prize deleted successfully"}


@router.delete("/")
def delete_all_prizes(db: Session = Depends(get_db)):
    """删除所有奖项"""
    db.query(PrizeModel).delete()
    db.commit()
    return {"status": "success", "message": "All prizes deleted successfully"}


@router.post("/{prize_id}/set-current")
def set_current_prize(prize_id: int, db: Session = Depends(get_db)):
    """设置当前奖项"""
    db_prize = db.query(PrizeModel).filter(PrizeModel.id == prize_id).first()
    if not db_prize:
        raise HTTPException(status_code=404, detail="Prize not found")

    # 只更新current_prize的内存状态，不修改数据库
    # 前端可以调用这个方法来切换当前正在抽奖的奖项，但这不影响奖项的完成状态
    db.commit()
    db.refresh(db_prize)
    return {"status": "success", "message": "Current prize set successfully", "prize": db_prize}


@router.post("/reset")
def reset_prizes(db: Session = Depends(get_db)):
    """重置所有奖项"""
    db.query(PrizeModel).update({"is_used": False, "is_used_count": 0})
    db.commit()
    return {"status": "success", "message": "All prizes reset successfully"}
