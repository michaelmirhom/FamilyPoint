import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.seed import seed_data

app = FastAPI(title="FamilyPoints API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://familypoint-2.onrender.com",  # Your production frontend
    "https://familypoints.onrender.com",   # Any other variants you use
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# include routers
from app.api.v1 import auth, children, tasks, submissions, points, settings, rewards, users, uploads, announcements

# Mount static directory for uploads
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(children.router, prefix="/api/v1/children")
app.include_router(tasks.router, prefix="/api/v1/tasks")
app.include_router(submissions.router, prefix="/api/v1/submissions")
app.include_router(points.router, prefix="/api/v1/points")
app.include_router(settings.router, prefix="/api/v1/settings")
app.include_router(rewards.router, prefix="/api/v1/rewards")
app.include_router(uploads.router, prefix="/api/v1/uploads")
app.include_router(announcements.router, prefix="/api/v1/announcements")

@app.on_event("startup")
def on_startup():
    from sqlalchemy import text
    print("Running startup migrations...")
    
    # Create all tables that don't exist
    Base.metadata.create_all(bind=engine)
    
    # Manually add columns that might be missing in production (Neon)
    with engine.connect() as conn:
        try:
            # 1. Add evidence_file_path to submissions if missing
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='submissions' AND column_name='evidence_file_path';
            """))
            if not result.fetchone():
                print("Adding 'evidence_file_path' column to 'submissions' table...")
                conn.execute(text("ALTER TABLE submissions ADD COLUMN evidence_file_path VARCHAR;"))
                conn.commit()
                print("Column added successfully.")
            
            # Add any other missing columns for future features here
            
        except Exception as e:
            print(f"Startup migration error: {e}")

    if os.getenv("SEED_DB", "false").lower() in ("1", "true", "yes"):
        seed_data()

@app.get("/")
def read_root():
    return {"status": "ok"}
