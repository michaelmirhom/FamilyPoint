from app.db.session import engine
from app.models.models import Base, SubmissionEvidence

def migrate():
    print("Creating submission_evidence table...")
    # This will create any tables that don't exist yet, which includes our new one
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    migrate()
