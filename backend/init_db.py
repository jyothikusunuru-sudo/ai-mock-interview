from database import Base, engine

# Import ALL models
from models import User
from interview_models import Interview
from question_models import InterviewQuestion
from answer_models import InterviewAnswer
from evaluation_models import InterviewEvaluation
from practice_models import PracticeQuestion, PracticeAttempt


print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")