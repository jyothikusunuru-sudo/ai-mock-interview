from pydantic import BaseModel


class PracticeAttemptCreate(BaseModel):
    question_id: int
    is_correct: bool