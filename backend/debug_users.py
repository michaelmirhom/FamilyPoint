from app.db.session import SessionLocal
from app.models import models

def check_users():
    db = SessionLocal()
    users = db.query(models.User).all()
    for u in users:
        print(f"User: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    check_users()
