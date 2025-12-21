from sqlalchemy import func
from app.models import models
import datetime


def compute_streak(db, child_id: int, category: models.CategoryEnum) -> int:
    subs = db.query(models.Submission).join(models.Task, models.Submission.task_id==models.Task.id).filter(models.Submission.child_id==child_id, models.Submission.status==models.SubmissionStatus.APPROVED, models.Task.category==category).order_by(models.Submission.created_at.desc()).all()
    dates = sorted({s.created_at.date() for s in subs}, reverse=True)
    if not dates:
        return 0
    streak = 0
    today = datetime.date.today()
    cur = today
    for d in dates:
        if d == cur:
            streak += 1
            cur = cur - datetime.timedelta(days=1)
        elif d < cur:
            break
    return streak


def compute_all_streaks(db, child_id: int) -> dict:
    return {
        "bibleReadingStreak": compute_streak(db, child_id, models.CategoryEnum.FAITH),
        "homeworkStreak": compute_streak(db, child_id, models.CategoryEnum.SCHOOL),
    }
