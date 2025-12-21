from app.db.session import SessionLocal
from app.models import models
from app.core.security import get_password_hash


def seed_data():
    db = SessionLocal()
    try:
        p = db.query(models.User).filter(models.User.email=="parent@example.com").first()
        if p:
            return
        parent = models.User(name="Parent Example", email="parent@example.com", password_hash=get_password_hash("password"), role=models.RoleEnum.PARENT)
        db.add(parent)
        db.commit()
        db.refresh(parent)
        c1 = models.User(name="Selina", username="selina", password_hash=get_password_hash("password"), role=models.RoleEnum.CHILD, parent_id=parent.id)
        c2 = models.User(name="Child2", username="child2", password_hash=get_password_hash("password"), role=models.RoleEnum.CHILD, parent_id=parent.id)
        db.add_all([c1, c2])
        db.commit()
        t1 = models.Task(parent_id=parent.id, name="Read Bible 10 minutes", category=models.CategoryEnum.FAITH, points=10)
        t2 = models.Task(parent_id=parent.id, name="Memorize a verse", category=models.CategoryEnum.FAITH, points=20)
        t3 = models.Task(parent_id=parent.id, name="Finish homework", category=models.CategoryEnum.SCHOOL, points=15)
        t4 = models.Task(parent_id=parent.id, name="Clean your room", category=models.CategoryEnum.HOME, points=10)
        t5 = models.Task(parent_id=parent.id, name="Help a sibling", category=models.CategoryEnum.KINDNESS, points=15)
        db.add_all([t1, t2, t3, t4, t5])
        db.commit()
        r1 = models.Reward(parent_id=parent.id, name="$5 cash", type=models.RewardType.MONEY, cost_points=500)
        r2 = models.Reward(parent_id=parent.id, name="Movie night", type=models.RewardType.PRIVILEGE, cost_points=300)
        r3 = models.Reward(parent_id=parent.id, name="Extra 30 mins screen time", type=models.RewardType.PRIVILEGE, cost_points=150)
        db.add_all([r1, r2, r3])
        db.commit()
        ps = models.ParentSettings(parent_id=parent.id, points_per_dollar=100, monthly_dollar_cap_per_child=10.0, show_money_to_children=True)
        db.add(ps)
        db.commit()
    finally:
        db.close()
