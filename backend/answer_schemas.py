from pydantic import BaseModel


class AnswerCreate(BaseModel):
    interview_id: int
    question: str
    answer: str