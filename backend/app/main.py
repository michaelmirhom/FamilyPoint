import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.seed import seed_data

app = FastAPI(title="FamilyPoints API")

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5173,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
from app.api.v1 import auth, children, tasks, submissions, points, settings, rewards, users
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(children.router, prefix="/api/v1/children")
app.include_router(tasks.router, prefix="/api/v1/tasks")
app.include_router(submissions.router, prefix="/api/v1/submissions")
app.include_router(points.router, prefix="/api/v1/points")
app.include_router(settings.router, prefix="/api/v1/settings")
app.include_router(rewards.router, prefix="/api/v1/rewards")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    if os.getenv("SEED_DB", "false").lower() in ("1", "true", "yes"):
        seed_data()

@app.get("/")
def read_root():
    return {"status": "ok"}
