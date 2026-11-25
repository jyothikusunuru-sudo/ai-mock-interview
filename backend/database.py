from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or not DATABASE_URL.strip():
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Please set it in backend/.env or the process environment."
    )

try:
    engine = create_engine(
        DATABASE_URL.strip(),
        pool_pre_ping=True,
    )
except Exception as exc:
    raise RuntimeError(
        "DATABASE_URL is invalid. "
        "Use a valid SQLAlchemy database URL."
    ) from exc

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()