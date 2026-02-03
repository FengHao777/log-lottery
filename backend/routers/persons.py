from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import Person, PersonCreate, PersonUpdate
from database import Person as PersonModel

router = APIRouter(prefix="/api/persons", tags=["persons"])


@router.get("/", response_model=List[Person])
def get_all_persons(db: Session = Depends(get_db)):
    """获取所有人员"""
    persons = db.query(PersonModel).all()
    return persons


@router.get("/device", response_model=Person)
def get_person_by_device_fingerprint(
    device_fingerprint: str = Query(..., description="设备指纹"),
    db: Session = Depends(get_db)
):
    """根据设备指纹获取人员"""
    person = db.query(PersonModel).filter(PersonModel.device_fingerprint == device_fingerprint).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.delete("/device", response_model=dict)
def delete_person_by_device_fingerprint(
    device_fingerprint: str = Query(..., description="设备指纹"),
    db: Session = Depends(get_db)
):
    """根据设备指纹删除人员"""
    person = db.query(PersonModel).filter(PersonModel.device_fingerprint == device_fingerprint).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    db.delete(person)
    db.commit()
    return {"status": "success", "message": "Person deleted successfully"}


@router.get("/{person_id}", response_model=Person)
def get_person(person_id: int, db: Session = Depends(get_db)):
    """根据ID获取人员"""
    person = db.query(PersonModel).filter(PersonModel.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.get("/uuid/{uuid}", response_model=Person)
def get_person_by_uuid(uuid: str, db: Session = Depends(get_db)):
    """根据UUID获取人员"""
    person = db.query(PersonModel).filter(PersonModel.uuid == uuid).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.post("/", response_model=Person)
def create_person(person: PersonCreate, db: Session = Depends(get_db)):
    """创建人员"""
    db_person = PersonModel(**person.model_dump())
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person


@router.post("/batch", response_model=List[Person])
def create_persons_batch(persons: List[PersonCreate], db: Session = Depends(get_db)):
    """批量创建人员"""
    db_persons = [PersonModel(**person.model_dump()) for person in persons]
    db.add_all(db_persons)
    db.commit()
    for person in db_persons:
        db.refresh(person)
    return db_persons


@router.put("/{person_id}", response_model=Person)
def update_person(person_id: int, person_update: PersonUpdate, db: Session = Depends(get_db)):
    """更新人员"""
    db_person = db.query(PersonModel).filter(PersonModel.id == person_id).first()
    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")

    update_data = person_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_person, key, value)

    db.commit()
    db.refresh(db_person)
    return db_person


@router.delete("/{person_id}")
def delete_person(person_id: int, db: Session = Depends(get_db)):
    """删除人员"""
    db_person = db.query(PersonModel).filter(PersonModel.id == person_id).first()
    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")

    db.delete(db_person)
    db.commit()
    return {"status": "success", "message": "Person deleted successfully"}


@router.delete("/")
def delete_all_persons(db: Session = Depends(get_db)):
    """删除所有人员"""
    db.query(PersonModel).delete()
    db.commit()
    return {"status": "success", "message": "All persons deleted successfully"}


@router.get("/already/list", response_model=List[Person])
def get_already_won_persons(db: Session = Depends(get_db)):
    """获取已中奖人员列表"""
    persons = db.query(PersonModel).filter(PersonModel.is_win == True).all()
    return persons


@router.get("/not/list", response_model=List[Person])
def get_not_won_persons(db: Session = Depends(get_db)):
    """获取未中奖人员列表"""
    persons = db.query(PersonModel).filter(PersonModel.is_win == False).all()
    return persons


@router.get("/not/prize/{prize_id}", response_model=List[Person])
def get_not_won_this_prize_persons(prize_id: str, db: Session = Depends(get_db)):
    """获取未中此奖的人员列表"""
    persons = db.query(PersonModel).all()
    result = []
    for person in persons:
        if prize_id not in person.prize_id:
            result.append(person)
    return result


@router.post("/reset/won")
def reset_won_status(db: Session = Depends(get_db)):
    """重置所有人员的中奖状态"""
    persons = db.query(PersonModel).all()
    for person in persons:
        person.is_win = False
        person.prize_name = []
        person.prize_id = []
        person.prize_time = []
    db.commit()
    return {"status": "success", "message": "Won status reset successfully"}
