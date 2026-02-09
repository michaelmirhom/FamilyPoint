from app.db.session import engine
from app.models.models import Base

def migrate():
    print("Creating announcement tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    migrate()
