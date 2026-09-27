from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from datetime import datetime

from database import Base


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id"),
        nullable=False
    )

    question_number = Column(
        Integer,
        nullable=False
    )

    question = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )