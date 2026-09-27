from pydantic import BaseModel


class InterviewCreate(BaseModel):
    role: str
    experience: str
    interview_type: str
    difficulty: str
    total_questions: int