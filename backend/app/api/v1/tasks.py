from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from typing import Optional
from app.schemas import schemas
from app.core.auth import get_current_user

router = APIRouter()

@router.post("", response_model=schemas.TaskOut)
def create_task(payload: schemas.TaskBase, db: Session = Depends(get_db), current = Depends(get_current_user)):
    if current.role != models.RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Parent only")
    task = models.Task(parent_id=current.id, name=payload.name, description=payload.description, category=payload.category, points=payload.points, is_active=payload.is_active)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("")
def list_tasks(category: Optional[str] = None, active: Optional[bool] = None, db: Session = Depends(get_db), current = Depends(get_current_user)):
    q = db.query(models.Task)
    if current.role == models.RoleEnum.PARENT:
        q = q.filter(models.Task.parent_id == current.id)
    elif current.role == models.RoleEnum.CHILD:
        # Child sees tasks from their parent
        q = q.filter(models.Task.parent_id == current.parent_id)
        
    if category:
        q = q.filter(models.Task.category==category)
    if active is not None:
        q = q.filter(models.Task.is_active==active)
    return q.all()


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id==task_id).first()
    if not task:
        raise HTTPException(status_code=404)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current = Depends(get_current_user)):
    if current.role != models.RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can delete tasks")

    task = db.query(models.Task).filter(models.Task.id==task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify ownership (assuming tasks linked to parent ID directly or via logical grouping)
    # The Task model has parent_id.
    if task.parent_id != current.id:
        raise HTTPException(status_code=403, detail="Not your task")

    # Cleanup related data
    try:
        # 1. Submissions for this task
        submissions = db.query(models.Submission).filter(models.Submission.task_id == task_id).all()
        sub_ids = [s.id for s in submissions]
        
        if sub_ids:
            # 2. Update PointsLedger to decouple from these submissions before deleting
            db.query(models.PointsLedger).filter(models.PointsLedger.related_submission_id.in_(sub_ids)).update({models.PointsLedger.related_submission_id: None}, synchronize_session=False)

            # 3. Delete Submissions
            db.query(models.Submission).filter(models.Submission.task_id == task_id).delete(synchronize_session=False)
        
        db.delete(task)
        db.commit()
    except Exception as e:
        print(f"Error deleting task {task_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

    return {"status": "ok"}
