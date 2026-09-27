from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import bcrypt
import json
import secrets
from datetime import datetime, timedelta

from database import get_db

from models import User
from interview_models import Interview
from answer_models import InterviewAnswer
from question_models import InterviewQuestion
from evaluation_models import InterviewEvaluation
from practice_models import PracticeQuestion, PracticeAttempt

from schemas import UserCreate, UserLogin
from interview_schemas import InterviewCreate
from answer_schemas import AnswerCreate
from practice_schemas import PracticeAttemptCreate

from auth import create_access_token
from dependencies import get_current_user

from ai_service import (
    generate_interview_questions,
    evaluate_interview_answer,
    generate_practice_questions
)


# ==========================================
# PASSWORD RESET REQUEST MODELS
# ==========================================

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():
    return {
        "message": "AI Mock Interview API is running!"
    }


# ==========================================
# DATABASE TEST
# ==========================================

@app.get("/db-test")
def database_test(
    db: Session = Depends(get_db)
):
    return {
        "message": "Database connection is working!"
    }


# ==========================================
# REGISTER
# ==========================================

@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully!",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }


# ==========================================
# LOGIN
# ==========================================

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_valid = bcrypt.checkpw(
        user.password.encode("utf-8"),
        existing_user.password.encode("utf-8")
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email
        }
    )

    return {
        "message": "Login successful!",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email
    }



# ==========================================
# FORGOT PASSWORD
# ==========================================

@app.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email"
        )

    reset_token = secrets.token_urlsafe(32)
    reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)

    user.reset_token = reset_token
    user.reset_token_expiry = reset_token_expiry

    db.commit()

    # Local development only: return the token directly.
    # Production should email the reset link instead.
    return {
        "message": "Password reset link generated successfully",
        "reset_token": reset_token
    }


# ==========================================
# RESET PASSWORD
# ==========================================

@app.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.reset_token == request.token)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    if (
        not user.reset_token_expiry
        or user.reset_token_expiry < datetime.utcnow()
    ):
        user.reset_token = None
        user.reset_token_expiry = None
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long"
        )

    hashed_password = bcrypt.hashpw(
        request.new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user.password = hashed_password

    # Make the reset token single-use.
    user.reset_token = None
    user.reset_token_expiry = None

    db.commit()

    return {
        "message": "Password reset successfully. Please login with your new password."
    }

# ==========================================
# PROFILE
# ==========================================

@app.get("/profile")
def get_profile(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.id == int(current_user_id)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }


# ==========================================
# CREATE INTERVIEW
# ==========================================

@app.post("/interviews")
def create_interview(
    interview: InterviewCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    new_interview = Interview(
        user_id=int(current_user_id),
        role=interview.role,
        experience=interview.experience,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        total_questions=interview.total_questions
    )

    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    # --------------------------------
    # GENERATE QUESTIONS
    # --------------------------------

    try:

        questions = generate_interview_questions(
            role=interview.role,
            experience=interview.experience,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty,
            total_questions=interview.total_questions
        )

    except Exception as e:

        db.rollback()

        print("\n==============================")
        print("INTERVIEW QUESTION GENERATION ERROR:")
        print(repr(e))
        print("==============================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview questions: {str(e)}"
        )

    # --------------------------------
    # SAVE QUESTIONS
    # --------------------------------

    for index, question_text in enumerate(
        questions,
        start=1
    ):

        new_question = InterviewQuestion(
            interview_id=new_interview.id,
            question_number=index,
            question=question_text
        )

        db.add(new_question)

    db.commit()

    # --------------------------------
    # RESPONSE
    # --------------------------------

    return {
        "message": "Interview created successfully!",
        "interview_id": new_interview.id,
        "user_id": new_interview.user_id,
        "role": new_interview.role,
        "experience": new_interview.experience,
        "interview_type": new_interview.interview_type,
        "difficulty": new_interview.difficulty,
        "total_questions": new_interview.total_questions,
        "questions": questions
    }


# ==========================================
# GET USER INTERVIEWS
# ==========================================

@app.get("/interviews")
def get_interviews(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == int(current_user_id)
        )
        .order_by(
            Interview.created_at.desc()
        )
        .all()
    )

    return interviews


# ==========================================
# CREATE ANSWER
# ==========================================

@app.post("/answers")
def create_answer(
    answer_data: AnswerCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # CHECK INTERVIEW OWNERSHIP
    # --------------------------------

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == answer_data.interview_id,
            Interview.user_id == int(current_user_id)
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    # --------------------------------
    # CREATE ANSWER
    # --------------------------------

    new_answer = InterviewAnswer(
        interview_id=answer_data.interview_id,
        question=answer_data.question,
        answer=answer_data.answer
    )

    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)

    return {
        "message": "Answer saved successfully!",
        "answer_id": new_answer.id,
        "interview_id": new_answer.interview_id,
        "question": new_answer.question,
        "answer": new_answer.answer
    }


# ==========================================
# CREATE INTERVIEW QUESTION
# ==========================================

@app.post("/interview-questions")
def create_interview_question(
    interview_id: int,
    question_number: int,
    question: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # CHECK INTERVIEW OWNERSHIP
    # --------------------------------

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == int(current_user_id)
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    # --------------------------------
    # CREATE QUESTION
    # --------------------------------

    new_question = InterviewQuestion(
        interview_id=interview_id,
        question_number=question_number,
        question=question
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return {
        "message": "Interview question saved successfully!",
        "question_id": new_question.id,
        "interview_id": new_question.interview_id,
        "question_number": new_question.question_number,
        "question": new_question.question
    }


# ==========================================
# GET INTERVIEW QUESTIONS
# ==========================================

@app.get("/interview-questions/{interview_id}")
def get_interview_questions(
    interview_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # CHECK INTERVIEW OWNERSHIP
    # --------------------------------

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == int(current_user_id)
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    # --------------------------------
    # GET QUESTIONS
    # --------------------------------

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_id == interview_id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    return questions


# ==========================================
# EVALUATE INTERVIEW ANSWER
# ==========================================

@app.post("/evaluate-answer/{answer_id}")
def evaluate_answer(
    answer_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # GET ANSWER
    # --------------------------------

    answer = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.id == answer_id
        )
        .first()
    )

    if not answer:
        raise HTTPException(
            status_code=404,
            detail="Answer not found"
        )

    # --------------------------------
    # GET INTERVIEW
    # --------------------------------

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == answer.interview_id,
            Interview.user_id == int(current_user_id)
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    # --------------------------------
    # CHECK EMPTY ANSWER
    # --------------------------------

    if not answer.answer or not answer.answer.strip():

        return {
            "message": "Answer is empty. Evaluation skipped.",
            "evaluation_id": None,
            "answer_id": answer.id,
            "technical_score": 0,
            "communication_score": 0,
            "relevance_score": 0,
            "clarity_score": 0,
            "overall_score": 0,
            "feedback": "No answer was provided."
        }

    # --------------------------------
    # CALL GEMINI
    # --------------------------------

    try:

        ai_result = evaluate_interview_answer(
            question=answer.question,
            answer=answer.answer,
            role=interview.role,
            interview_type=interview.interview_type,
            difficulty=interview.difficulty
        )

        print("\n==============================")
        print("AI RAW RESULT:")
        print(ai_result)
        print("==============================\n")

    except Exception as e:

        print("\n==============================")
        print("AI EVALUATION ERROR:")
        print(repr(e))
        print("==============================\n")

        raise HTTPException(
            status_code=500,
            detail=f"AI evaluation failed: {str(e)}"
        )

    # --------------------------------
    # CONVERT AI JSON
    # --------------------------------

    try:

        evaluation_data = json.loads(
            ai_result
        )

        print("\n==============================")
        print("PARSED EVALUATION:")
        print(evaluation_data)
        print("==============================\n")

    except Exception as e:

        print("\n==============================")
        print("JSON PARSING ERROR:")
        print(repr(e))
        print("==============================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Invalid AI JSON: {str(e)}"
        )

    # --------------------------------
    # VALIDATE REQUIRED FIELDS
    # --------------------------------

    required_fields = [
        "technical_score",
        "communication_score",
        "relevance_score",
        "clarity_score",
        "overall_score",
        "feedback"
    ]

    for field in required_fields:

        if field not in evaluation_data:

            raise HTTPException(
                status_code=500,
                detail=f"AI response missing field: {field}"
            )

    # --------------------------------
    # SAVE EVALUATION
    # --------------------------------

    try:

        evaluation = (
            db.query(InterviewEvaluation)
            .filter(
                InterviewEvaluation.answer_id == answer.id
            )
            .first()
        )

        if evaluation:

            evaluation.technical_score = int(
                evaluation_data["technical_score"]
            )

            evaluation.communication_score = int(
                evaluation_data["communication_score"]
            )

            evaluation.relevance_score = int(
                evaluation_data["relevance_score"]
            )

            evaluation.clarity_score = int(
                evaluation_data["clarity_score"]
            )

            evaluation.overall_score = int(
                evaluation_data["overall_score"]
            )

            evaluation.feedback = str(
                evaluation_data["feedback"]
            )

        else:

            evaluation = InterviewEvaluation(
                answer_id=answer.id,

                technical_score=int(
                    evaluation_data["technical_score"]
                ),

                communication_score=int(
                    evaluation_data["communication_score"]
                ),

                relevance_score=int(
                    evaluation_data["relevance_score"]
                ),

                clarity_score=int(
                    evaluation_data["clarity_score"]
                ),

                overall_score=int(
                    evaluation_data["overall_score"]
                ),

                feedback=str(
                    evaluation_data["feedback"]
                )
            )

            db.add(evaluation)

        db.commit()
        db.refresh(evaluation)

        # --------------------------------
        # CALCULATE INTERVIEW SCORE
        # --------------------------------

        evaluations = (
            db.query(InterviewEvaluation)
            .join(InterviewAnswer)
            .filter(
                InterviewAnswer.interview_id == interview.id
            )
            .all()
        )

        if evaluations:

            average_score = sum(
                item.overall_score
                for item in evaluations
            ) / len(evaluations)

            interview.overall_score = round(
                average_score * 10
            )

            db.commit()
            db.refresh(interview)

    except Exception as e:

        db.rollback()

        print("\n==============================")
        print("DATABASE EVALUATION ERROR:")
        print(repr(e))
        print("==============================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save evaluation: {str(e)}"
        )

    # --------------------------------
    # RESPONSE
    # --------------------------------

    return {
        "message": "Answer evaluated successfully!",
        "evaluation_id": evaluation.id,
        "answer_id": evaluation.answer_id,
        "technical_score": evaluation.technical_score,
        "communication_score": evaluation.communication_score,
        "relevance_score": evaluation.relevance_score,
        "clarity_score": evaluation.clarity_score,
        "overall_score": evaluation.overall_score,
        "feedback": evaluation.feedback
    }


# ==========================================
# GET INTERVIEW REPORT
# ==========================================

@app.get("/interviews/{interview_id}/report")
def get_interview_report(
    interview_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # CHECK INTERVIEW OWNERSHIP
    # --------------------------------

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == int(current_user_id)
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    # --------------------------------
    # GET ANSWERS
    # --------------------------------

    answers = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.interview_id == interview_id
        )
        .order_by(
            InterviewAnswer.id
        )
        .all()
    )

    report_answers = []

    for answer in answers:

        evaluation = (
            db.query(InterviewEvaluation)
            .filter(
                InterviewEvaluation.answer_id == answer.id
            )
            .first()
        )

        report_answers.append({
            "answer_id": answer.id,
            "question": answer.question,
            "answer": answer.answer,

            "technical_score": (
                evaluation.technical_score
                if evaluation else None
            ),

            "communication_score": (
                evaluation.communication_score
                if evaluation else None
            ),

            "relevance_score": (
                evaluation.relevance_score
                if evaluation else None
            ),

            "clarity_score": (
                evaluation.clarity_score
                if evaluation else None
            ),

            "overall_score": (
                evaluation.overall_score
                if evaluation else None
            ),

            "feedback": (
                evaluation.feedback
                if evaluation else None
            )
        })

    return {
        "interview_id": interview.id,
        "role": interview.role,
        "experience": interview.experience,
        "interview_type": interview.interview_type,
        "difficulty": interview.difficulty,
        "total_questions": interview.total_questions,
        "overall_score": interview.overall_score,
        "created_at": interview.created_at,
        "answers": report_answers
    }


# ==========================================
# PRACTICE QUESTIONS
# ==========================================

@app.get("/practice/questions")
def get_practice_questions(
    category: str = "Technical",
    difficulty: str = "Easy",
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    questions = (
        db.query(PracticeQuestion)
        .filter(
            PracticeQuestion.category == category,
            PracticeQuestion.difficulty == difficulty
        )
        .all()
    )

    return questions


# ==========================================
# GENERATE PRACTICE QUESTIONS USING AI
# ==========================================

@app.post("/practice/generate")
def generate_practice(
    category: str = "Technical",
    difficulty: str = "Easy",
    total_questions: int = 5,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # VALIDATE CATEGORY
    # --------------------------------

    valid_categories = [
        "Technical",
        "Behavioral",
        "Quick Questions"
    ]

    if category not in valid_categories:

        raise HTTPException(
            status_code=400,
            detail="Invalid practice category."
        )

    # --------------------------------
    # VALIDATE DIFFICULTY
    # --------------------------------

    valid_difficulties = [
        "Easy",
        "Medium",
        "Hard"
    ]

    if difficulty not in valid_difficulties:

        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty."
        )

    # --------------------------------
    # VALIDATE QUESTION COUNT
    # --------------------------------

    if total_questions < 1 or total_questions > 10:

        raise HTTPException(
            status_code=400,
            detail="Total questions must be between 1 and 10."
        )

    # --------------------------------
    # CALL GEMINI
    # --------------------------------

    try:

        questions = generate_practice_questions(
            category=category,
            difficulty=difficulty,
            total_questions=total_questions
        )

    except Exception as e:

        print("\n==============================")
        print("PRACTICE AI GENERATION ERROR:")
        print(repr(e))
        print("==============================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate practice questions: {str(e)}"
        )

    # --------------------------------
    # VALIDATE AI RESPONSE
    # --------------------------------

    if not questions:

        raise HTTPException(
            status_code=500,
            detail="AI did not generate any practice questions."
        )

    # --------------------------------
    # SAVE QUESTIONS
    # --------------------------------

    saved_questions = []

    try:

        for item in questions:

            if not isinstance(item, dict):
                continue

            question_text = item.get("question")
            answer_text = item.get("answer")

            if not question_text or not answer_text:
                continue

            new_question = PracticeQuestion(
                category=category,
                difficulty=difficulty,
                question=question_text,
                answer=answer_text
            )

            db.add(new_question)

            db.flush()

            saved_questions.append({
                "id": new_question.id,
                "category": new_question.category,
                "difficulty": new_question.difficulty,
                "question": new_question.question,
                "answer": new_question.answer
            })

        if not saved_questions:

            db.rollback()

            raise HTTPException(
                status_code=500,
                detail="No valid practice questions were generated."
            )

        db.commit()

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        print("\n==============================")
        print("PRACTICE DATABASE ERROR:")
        print(repr(e))
        print("==============================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save practice questions: {str(e)}"
        )

    # --------------------------------
    # RESPONSE
    # --------------------------------

    return {
        "message": "Practice questions generated successfully!",
        "category": category,
        "difficulty": difficulty,
        "total_questions": len(saved_questions),
        "questions": saved_questions
    }


# ==========================================
# SAVE PRACTICE ATTEMPT
# ==========================================

@app.post("/practice/attempt")
def save_practice_attempt(
    attempt_data: PracticeAttemptCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # GET QUESTION
    # --------------------------------

    question = (
        db.query(PracticeQuestion)
        .filter(
            PracticeQuestion.id == attempt_data.question_id
        )
        .first()
    )

    if not question:

        raise HTTPException(
            status_code=404,
            detail="Practice question not found"
        )

    # --------------------------------
    # SAVE ATTEMPT
    # --------------------------------

    attempt = PracticeAttempt(
        user_id=int(current_user_id),
        question_id=attempt_data.question_id,
        is_correct=attempt_data.is_correct
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "message": "Practice attempt saved successfully",
        "attempt_id": attempt.id
    }


# ==========================================
# PRACTICE STATISTICS
# ==========================================

@app.get("/practice/stats")
def get_practice_stats(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    attempts = (
        db.query(PracticeAttempt)
        .filter(
            PracticeAttempt.user_id == int(current_user_id)
        )
        .all()
    )

    total_attempts = len(attempts)

    correct_attempts = sum(
        1
        for attempt in attempts
        if attempt.is_correct
    )

    accuracy = (
        round(
            (correct_attempts / total_attempts) * 100
        )
        if total_attempts > 0
        else 0
    )

    return {
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy": accuracy
    }