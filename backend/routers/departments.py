from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Department
from schemas import DepartmentCreate, DepartmentUpdate, Department as DepartmentSchema
from datetime import datetime

router = APIRouter(prefix="/api/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentSchema])
async def get_all_departments(db: Session = Depends(get_db)):
    """获取所有部门"""
    departments = db.query(Department).order_by(Department.sort, Department.id).all()
    return departments


@router.get("/{department_id}", response_model=DepartmentSchema)
async def get_department(department_id: int, db: Session = Depends(get_db)):
    """根据ID获取部门"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="部门不存在")
    return department


@router.post("/", response_model=DepartmentSchema)
async def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    """创建部门"""
    # 检查部门名称是否已存在
    existing = db.query(Department).filter(Department.name == department.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="部门名称已存在")

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db_department = Department(
        name=department.name,
        sort=department.sort,
        create_time=now,
        update_time=now
    )
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


@router.put("/{department_id}", response_model=DepartmentSchema)
async def update_department(department_id: int, department: DepartmentUpdate, db: Session = Depends(get_db)):
    """更新部门"""
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="部门不存在")

    # 如果要更新名称，检查名称是否已被其他部门使用
    if department.name and department.name != db_department.name:
        existing = db.query(Department).filter(
            Department.name == department.name,
            Department.id != department_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="部门名称已被使用")
        db_department.name = department.name

    if department.sort is not None:
        db_department.sort = department.sort

    db_department.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db.commit()
    db.refresh(db_department)
    return db_department


@router.delete("/{department_id}")
async def delete_department(department_id: int, db: Session = Depends(get_db)):
    """删除部门"""
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="部门不存在")

    db.delete(db_department)
    db.commit()
    return {"message": "部门删除成功"}


@router.delete("/")
async def delete_all_departments(db: Session = Depends(get_db)):
    """删除所有部门"""
    db.query(Department).delete()
    db.commit()
    return {"message": "所有部门删除成功"}
