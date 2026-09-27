import os

from datetime import datetime, timedelta, timezone
from jose import jwt
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# Make sure the application does not start
# with an insecure/missing JWT secret.
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not configured. "
        "Please add it to your .env file."
    )


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )