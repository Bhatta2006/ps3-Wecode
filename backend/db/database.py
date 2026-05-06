import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# We default to a simple local SQLite file so the user doesn't need to configure a Dockerized Postgres immediately.
# When ready for Phase 4 (Docker), we just change this env variable!
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tradelab.db")

# connect_args is needed only for SQLite so it can handle concurrent requests correctly without crashing
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency used by FastAPI to inject a database session securely into any endpoint API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
