from app.db.session import engine  
from app.models.models import Base, AnnouncementDismissal

def create_dismissals_table():
    # Create the announcement_dismissals table
    AnnouncementDismissal.__table__.create(bind=engine, checkfirst=True)
    print("Created announcement_dismissals table")

if __name__ == "__main__":
    create_dismissals_table()
