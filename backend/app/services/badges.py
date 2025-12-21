from sqlalchemy import func
from app.models import models
import datetime

BADGES = [
    {"code": "BIBLE_READER", "name": "Bible Reader", "description": "5 FAITH submissions on different days", "criteria": "BIBLE_READER"},
    {"code": "HOMEWORK_HERO", "name": "Homework Hero", "description": "10 approved SCHOOL submissions", "criteria": "HOMEWORK_HERO"},
    {"code": "KIND_HEART", "name": "Kind Heart", "description": "10 approved KINDNESS submissions", "criteria": "KIND_HEART"},
    {"code": "LEVEL_2", "name": "Level 2 Reached", "description": "Reached 200 Points", "criteria": "POINTS_200"},
    {"code": "LEVEL_3", "name": "Level 3 Reached", "description": "Reached 400 Points", "criteria": "POINTS_400"},
    {"code": "LEVEL_4", "name": "Level 4 Reached", "description": "Reached 700 Points", "criteria": "POINTS_700"},
    {"code": "LEVEL_5", "name": "Level 5 Reached", "description": "Reached 1000 Points", "criteria": "POINTS_1000"},
]


def ensure_badges_exist(db):
    for b in BADGES:
        ex = db.query(models.Badge).filter(models.Badge.code==b["code"]).first()
        if not ex:
            nb = models.Badge(code=b["code"], name=b["name"], description=b["description"], criteria_type=b["criteria"], is_active=True)
            db.add(nb)
    db.commit()


def check_and_award_badges(db, child_id: int):
    ensure_badges_exist(db)
    
    # Calculate Total Points (Lifetime XP, ignoring spendings)
    ledger = db.query(models.PointsLedger).filter(models.PointsLedger.child_id == child_id).all()
    total_points = sum(l.delta_points for l in ledger if l.delta_points > 0)
    
    # Check Level Badges
    if total_points >= 200:
        _award_if_missing(db, child_id, "LEVEL_2")
    if total_points >= 400:
        _award_if_missing(db, child_id, "LEVEL_3")
    if total_points >= 700:
        _award_if_missing(db, child_id, "LEVEL_4")
    if total_points >= 1000:
        _award_if_missing(db, child_id, "LEVEL_5")

    # Check Submission Badges
    faith_subs = db.query(models.Submission).join(models.Task, models.Submission.task_id==models.Task.id).filter(models.Submission.child_id==child_id, models.Submission.status==models.SubmissionStatus.APPROVED, models.Task.category==models.CategoryEnum.FAITH).all()
    faith_dates = set(s.created_at.date() for s in faith_subs)
    if len(faith_dates) >= 5:
        _award_if_missing(db, child_id, "BIBLE_READER")
    school_count = db.query(models.Submission).join(models.Task, models.Submission.task_id==models.Task.id).filter(models.Submission.child_id==child_id, models.Submission.status==models.SubmissionStatus.APPROVED, models.Task.category==models.CategoryEnum.SCHOOL).count()
    if school_count >= 10:
        _award_if_missing(db, child_id, "HOMEWORK_HERO")
    kind_count = db.query(models.Submission).join(models.Task, models.Submission.task_id==models.Task.id).filter(models.Submission.child_id==child_id, models.Submission.status==models.SubmissionStatus.APPROVED, models.Task.category==models.CategoryEnum.KINDNESS).count()
    if kind_count >= 10:
        _award_if_missing(db, child_id, "KIND_HEART")


def _award_if_missing(db, child_id: int, badge_code: str):
    badge = db.query(models.Badge).filter(models.Badge.code==badge_code).first()
    if not badge:
        return
    exists = db.query(models.ChildBadge).filter(models.ChildBadge.child_id==child_id, models.ChildBadge.badge_id==badge.id).first()
    if exists:
        return
    cb = models.ChildBadge(child_id=child_id, badge_id=badge.id)
    db.add(cb)
    db.commit()
