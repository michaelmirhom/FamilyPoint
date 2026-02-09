import os
from sqlalchemy import create_all, text
from app.db.session import engine

def migrate_missing_columns():
    print("Checking for missing columns in production database...")
    
    with engine.connect() as conn:
        # Check if evidence_file_path exists in submissions table
        try:
            # PostgreSQL specific query to check column existence
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='submissions' AND column_name='evidence_file_path';
            """))
            
            if not result.fetchone():
                print("Adding 'evidence_file_path' column to 'submissions' table...")
                conn.execute(text("ALTER TABLE submissions ADD COLUMN evidence_file_path VARCHAR;"))
                conn.commit()
                print("Successfully added column!")
            else:
                print("Column 'evidence_file_path' already exists.")

            # Also ensure the new submission_evidence table exists
            print("Ensuring 'submission_evidence' table exists...")
            from app.models.models import Base
            Base.metadata.create_all(bind=engine)
            print("Table check complete.")
            
        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_missing_columns()
