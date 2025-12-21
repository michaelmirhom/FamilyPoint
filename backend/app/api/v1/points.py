from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.schemas import schemas
from sqlalchemy import func
import datetime

router = APIRouter()

@router.get("/{child_id}", response_model=schemas.PointsSummary)
def child_points(child_id: int, db: Session = Depends(get_db)):
    total = db.query(func.coalesce(func.sum(models.PointsLedger.delta_points), 0)).filter(models.PointsLedger.child_id==child_id).scalar() or 0
    child = db.query(models.User).filter(models.User.id==child_id).first()
    if not child:
        raise HTTPException(status_code=404)
    parent_settings = db.query(models.ParentSettings).filter(models.ParentSettings.parent_id==child.parent_id).first()
    points_per_dollar = parent_settings.points_per_dollar if parent_settings else 100
    total_money = total / points_per_dollar
    start_month = datetime.datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_points = db.query(func.coalesce(func.sum(models.PointsLedger.delta_points), 0)).filter(models.PointsLedger.child_id==child_id, models.PointsLedger.created_at >= start_month).scalar() or 0
    month_money = month_points / points_per_dollar
    return {"totalPoints": total, "totalMoneyEquivalent": float(total_money), "thisMonthMoneyEquivalent": float(month_money)}
