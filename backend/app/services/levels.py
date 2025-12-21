from sqlalchemy import func
from app.models import models

def compute_level(db, child_id: int) -> int:
    total = db.query(func.coalesce(func.sum(models.PointsLedger.delta_points), 0)).filter(models.PointsLedger.child_id==child_id).scalar() or 0
    if total < 200:
        return 1
    if total < 400:
        return 2
    if total < 700:
        return 3
    if total < 1000:
        return 4
    return 5
