from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    role = Column(String(100), nullable=False)
    experience = Column(String(50), nullable=False)
    interview_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)

    total_questions = Column(Integer, nullable=False)

    overall_score = Column(Integer, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )