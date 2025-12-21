from fastapi import APIRouter, Depends
from app.models import models
from app.schemas import schemas
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
