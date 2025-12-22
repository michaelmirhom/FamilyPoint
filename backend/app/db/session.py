from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Configure engine with settings optimized for Neon (serverless Postgres)
# - pool_pre_ping: Tests connections before use, helps wake up suspended DBs
# - connect_args: Increase timeout to allow Neon to wake from suspension
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connection is alive before using
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,  # Wait up to 30s for a connection from pool
    connect_args={
        "connect_timeout": 30,  # Allow 30s for Neon to wake up
        "options": "-c statement_timeout=60000"  # 60s statement timeout
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
