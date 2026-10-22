"""
Database configuration and session management for Drift.
Uses SQLite for zero-setup, reliable storage.
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate the project root and database file
# backend/app/db.py -> backend/app -> backend -> project_root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "drift.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Fix postgres:// prefix for SQLAlchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite connection arguments for concurrency & thread safety
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency provider for database sessions.
    Yields an active session and ensures it closes afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Creates all database tables defined in models.py if they do not exist.
    Also ensures backward-compatible columns exist on the students table.
    """
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # If using SQLite, check and add missing columns to students table
    if "sqlite" in str(engine.url):
        try:
            with engine.connect() as conn:
                table_info = conn.exec_driver_sql("PRAGMA table_info(students)").fetchall()
                existing_cols = [c[1] for c in table_info]
                if "status" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN status VARCHAR DEFAULT 'approved'")
                if "name" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN name VARCHAR")
                if "password" not in existing_cols:
                    conn.exec_driver_sql("ALTER TABLE students ADD COLUMN password VARCHAR")
                conn.commit()
        except Exception as e:
            print(f"init_db migration notice: {e}")
