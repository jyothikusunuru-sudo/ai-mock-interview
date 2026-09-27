from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from datetime import datetime

from database import Base


class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    answer_id = Column(
        Integer,
        ForeignKey("interview_answers.id"),
        nullable=False
    )

    technical_score = Column(
        Integer,
        nullable=False
    )

    communication_score = Column(
        Integer,
        nullable=False
    )

    relevance_score = Column(
        Integer,
        nullable=False
    )

    clarity_score = Column(
        Integer,
        nullable=False
    )

    overall_score = Column(
        Integer,
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )