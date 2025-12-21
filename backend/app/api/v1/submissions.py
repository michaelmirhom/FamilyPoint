from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from datetime import datetime
from app.services import badges as badge_service
from app.core.auth import get_current_user

router = APIRouter()

@router.post("", response_model=schemas.SubmissionOut)
def create_submission(
    payload: schemas.SubmissionCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.CHILD:
        raise HTTPException(status_code=403, detail="Only children can submit tasks")
        
    submission = models.Submission(
        child_id=current_user.id,
        task_id=payload.task_id,
        note=payload.note,
        bible_reference=payload.bible_reference,
        reflection=payload.reflection
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/my", response_model=List[schemas.SubmissionOut])
def my_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.CHILD:
        raise HTTPException(status_code=403)
        
    subs = db.query(models.Submission).filter(models.Submission.child_id == current_user.id).order_by(models.Submission.created_at.desc()).all()
    return subs

@router.get("/pending", response_model=List[schemas.SubmissionOut])
def pending_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.PARENT:
        raise HTTPException(status_code=403)
    
    # Get all pending submissions for this parent's children
    subs = (
        db.query(models.Submission)
        .join(models.User, models.Submission.child_id == models.User.id)
        .filter(models.User.parent_id == current_user.id)
        .filter(models.Submission.status == models.SubmissionStatus.PENDING)
        .all()
    )
    return subs

@router.post("/{submission_id}/approve")
def approve_submission(
    submission_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.PARENT:
        raise HTTPException(status_code=403)

    sub = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404)
        
    # Verify child belongs to parent
    child = db.query(models.User).filter(models.User.id == sub.child_id).first()
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your child's submission")

    sub.status = models.SubmissionStatus.APPROVED
    sub.approved_at = datetime.utcnow()
    sub.reviewed_by_parent_id = current_user.id
    
    task = db.query(models.Task).filter(models.Task.id == sub.task_id).first()
    if task:
        pl = models.PointsLedger(
            child_id=sub.child_id,
            delta_points=task.points,
            reason="TASK_APPROVED",
            related_submission_id=sub.id,
            created_by_parent_id=current_user.id
        )
        db.add(pl)
    
    db.commit()
    badge_service.check_and_award_badges(db, sub.child_id)
    return {"status": "approved"}

@router.post("/{submission_id}/reject")
def reject_submission(
    submission_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.PARENT:
        raise HTTPException(status_code=403)

    sub = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404)

    # Verify child belongs to parent
    child = db.query(models.User).filter(models.User.id == sub.child_id).first()
    if not child or child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your child's submission")

    sub.status = models.SubmissionStatus.REJECTED
    sub.reviewed_by_parent_id = current_user.id
    db.commit()
    return {"status": "rejected"}
