from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import ParentSettings, User, RoleEnum
from app.schemas.schemas import ParentSettingsOut, ParentSettingsBase
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=ParentSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        # If child, they might not need this or only subset.
        # Requirement: "Get ParentSettings for current parent (creating defaults if not present)."
        # For child, we need to find their parent's settings.
        if not current_user.parent_id:
             raise HTTPException(status_code=400, detail="Child has no parent found")
        parent_id = current_user.parent_id
    else:
        parent_id = current_user.id

    settings = db.query(ParentSettings).filter(ParentSettings.parent_id == parent_id).first()
    if not settings:
        if current_user.role == RoleEnum.PARENT:
            # Create default
            settings = ParentSettings(parent_id=parent_id)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        else:
             raise HTTPException(status_code=404, detail="Settings not found")
    
    return settings

@router.put("/", response_model=ParentSettingsOut)
def update_settings(
    settings_in: ParentSettingsBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can update settings")
    
    settings = db.query(ParentSettings).filter(ParentSettings.parent_id == current_user.id).first()
    if not settings:
        settings = ParentSettings(parent_id=current_user.id)
        db.add(settings)
    
    for field, value in settings_in.dict(exclude_unset=True).items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings
