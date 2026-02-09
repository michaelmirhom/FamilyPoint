from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from datetime import datetime
from app.core.auth import get_current_user

router = APIRouter()

@router.post("", response_model=schemas.AnnouncementOut)
def create_announcement(
    payload: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can create announcements")
        
    ann = models.Announcement(
        parent_id=current_user.id,
        message=payload.message
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

@router.get("", response_model=List[schemas.AnnouncementOut])
def list_announcements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.RoleEnum.PARENT:
        # Parent sees all their announcements
        return db.query(models.Announcement).filter(models.Announcement.parent_id == current_user.id).order_by(models.Announcement.created_at.desc()).all()
    else:
        # Child sees active announcements from their parent, excluding dismissed ones
        if not current_user.parent_id:
             return []
        
        # Get IDs of dismissed announcements
        dismissed_ids = db.query(models.AnnouncementDismissal.announcement_id).filter(
            models.AnnouncementDismissal.child_id == current_user.id
        ).all()
        dismissed_ids = [d[0] for d in dismissed_ids]
        
        anns = db.query(models.Announcement).filter(
            models.Announcement.parent_id == current_user.parent_id,
            models.Announcement.is_active == True,
            ~models.Announcement.id.in_(dismissed_ids) if dismissed_ids else True
        ).order_by(models.Announcement.created_at.desc()).all()
        
        return anns

@router.post("/{announcement_id}/read")
def mark_read(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.CHILD:
        raise HTTPException(status_code=403)
        
    # Check if exists
    ann = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404)
        
    # Check if already read
    existing = db.query(models.AnnouncementRead).filter(
        models.AnnouncementRead.announcement_id == announcement_id,
        models.AnnouncementRead.child_id == current_user.id
    ).first()
    
    if not existing:
        read = models.AnnouncementRead(
            announcement_id=announcement_id,
            child_id=current_user.id
        )
        db.add(read)
        db.commit()
        
    return {"status": "ok"}

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if announcement exists
    ann = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    if current_user.role == models.RoleEnum.PARENT:
        # Parent can delete their own announcements
        if ann.parent_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your announcement")
        db.delete(ann)
        db.commit()
        return {"status": "deleted"}
    
    elif current_user.role == models.RoleEnum.CHILD:
        # Child can only dismiss if they've read it
        has_read = db.query(models.AnnouncementRead).filter(
            models.AnnouncementRead.announcement_id == announcement_id,
            models.AnnouncementRead.child_id == current_user.id
        ).first()
        
        if not has_read:
            raise HTTPException(status_code=403, detail="You must read the announcement before dismissing it")
        
        # Check if already dismissed
        existing_dismissal = db.query(models.AnnouncementDismissal).filter(
            models.AnnouncementDismissal.announcement_id == announcement_id,
            models.AnnouncementDismissal.child_id == current_user.id
        ).first()
        
        if not existing_dismissal:
            dismissal = models.AnnouncementDismissal(
                announcement_id=announcement_id,
                child_id=current_user.id
            )
            db.add(dismissal)
            db.commit()
        
        return {"status": "dismissed"}
    
    raise HTTPException(status_code=403)


