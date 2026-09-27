from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # Email verification
    email_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    verification_otp = Column(
        String(6),
        nullable=True
    )

    verification_otp_expiry = Column(
        DateTime,
        nullable=True
    )

    # Password reset
    reset_token = Column(
        String(255),
        nullable=True
    )

    reset_token_expiry = Column(
        DateTime,
        nullable=True
    )