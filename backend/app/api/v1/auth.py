from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas import schemas
from app.db.session import get_db
from app.models import models
from app.core import security
from datetime import timedelta

router = APIRouter()

@router.post("/register-parent", response_model=schemas.UserOut)
def register_parent(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if payload.role != schemas.Role.PARENT:
        raise HTTPException(status_code=400, detail="Role must be PARENT for this endpoint")
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        raise HTTPException(status_code=400, detail=f"Email '{payload.email}' already registered")
    hashed = security.get_password_hash(payload.password)
    u = models.User(name=payload.name, email=payload.email, password_hash=hashed, role=models.RoleEnum.PARENT)
    db.add(u)
    db.commit()
    db.refresh(u)
    
    # Initialize settings for the new parent
    settings = models.ParentSettings(parent_id=u.id)
    db.add(settings)
    db.commit()

    return u

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_or_username = form_data.username
    password = form_data.password
    user = None
    if "@" in (email_or_username or ""):
        user = db.query(models.User).filter(models.User.email == email_or_username).first()
    else:
        user = db.query(models.User).filter(models.User.username == email_or_username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not security.verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = security.create_access_token(subject=str(user.id), expires_delta=timedelta(days=7))
    return {"access_token": token, "user": user}
