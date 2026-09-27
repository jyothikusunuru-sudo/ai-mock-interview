from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime

from database import Base


class PracticeQuestion(Base):
    __tablename__ = "practice_questions"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(
        String(50),
        nullable=False
    )

    difficulty = Column(
        String(20),
        nullable=False
    )

    question = Column(
        Text,
        nullable=False
    )

    answer = Column(
        Text,
        nullable=False
    )


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    question_id = Column(
        Integer,
        ForeignKey("practice_questions.id"),
        nullable=False
    )

    is_correct = Column(
        Boolean,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )