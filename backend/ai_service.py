
from google import genai
from dotenv import load_dotenv
import json
import os
import time
from google.genai import errors


# ========================================
# LOAD ENVIRONMENT VARIABLES
# ========================================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

MODEL_NAME = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.1-flash-lite",
)


# ========================================
# GEMINI CLIENT
# ========================================

client = (
    genai.Client(api_key=GOOGLE_API_KEY)
    if GOOGLE_API_KEY
    else None
)


class GeminiTemporarilyUnavailable(RuntimeError):
    pass


def require_ai_client():
    if client is None:
        raise RuntimeError(
            "GOOGLE_API_KEY is not configured. "
            "Please set it in backend/.env or the process environment."
        )

    return client


# ========================================
# GEMINI API RETRY HANDLER
# ========================================

def _generate_content_with_retry(ai_client, prompt):

    max_attempts = 4

    for attempt in range(max_attempts):

        try:

            response = ai_client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )

            if not response or not response.text:
                raise RuntimeError(
                    "Gemini returned an empty response."
                )

            return response

        except errors.APIError as exc:

            print("\n========== GEMINI API ERROR ==========")
            print("Model:", MODEL_NAME)
            print("Error code:", exc.code)
            print("Error message:", str(exc))
            print("Attempt:", attempt + 1)
            print("======================================\n")

            # Retry temporary server errors and rate limits.
            if exc.code not in (429, 500, 502, 503, 504):

                raise

            if attempt == max_attempts - 1:

                raise GeminiTemporarilyUnavailable(
                    f"Gemini service is temporarily unavailable "
                    f"after {max_attempts} attempts. "
                    f"Last error code: {exc.code}"
                ) from exc

            wait_time = 2 ** (attempt + 1)

            print(
                f"Retrying Gemini request in {wait_time} seconds..."
            )

            time.sleep(wait_time)

    raise GeminiTemporarilyUnavailable(
        "Gemini request failed."
    )


# ========================================
# GENERATE INTERVIEW QUESTIONS
# ========================================

def generate_interview_questions(
    role,
    experience,
    interview_type,
    difficulty,
    total_questions
):

    ai_client = require_ai_client()

    prompt = f"""
You are an AI interviewer.

Generate exactly {total_questions} interview questions.

Candidate details:

Job Role: {role}
Experience Level: {experience}
Interview Type: {interview_type}
Difficulty: {difficulty}

Requirements:

- Questions must be relevant to the job role.
- Questions must match the candidate's experience level.
- Questions must match the interview type.
- Questions must match the requested difficulty.
- Questions should be different from each other.
- Avoid repeating common questions unnecessarily.
- Return ONLY the questions.
- Put each question on a separate line.
- Do not number the questions.
- Do not add explanations.
"""

    response = _generate_content_with_retry(
        ai_client,
        prompt
    )

    text = response.text.strip()

    questions = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    return questions[:total_questions]


# ========================================
# EVALUATE INTERVIEW ANSWER
# ========================================

def evaluate_interview_answer(
    question,
    answer,
    role,
    interview_type,
    difficulty
):

    ai_client = require_ai_client()

    prompt = f"""
You are an AI interview evaluator.

Evaluate the candidate's answer to the interview question.

Candidate Role:
{role}

Interview Type:
{interview_type}

Difficulty:
{difficulty}

Interview Question:
{question}

Candidate Answer:
{answer}

Evaluate the answer using these five criteria:

1. Technical Accuracy
2. Communication
3. Relevance
4. Clarity
5. Overall Performance

Give each score from 0 to 10.

Then provide concise and useful feedback.

Return ONLY valid JSON in exactly this format:

{{
    "technical_score": 0,
    "communication_score": 0,
    "relevance_score": 0,
    "clarity_score": 0,
    "overall_score": 0,
    "feedback": "Your feedback here"
}}
"""

    response = _generate_content_with_retry(
        ai_client,
        prompt
    )

    text = response.text.strip()

    # Remove Markdown code fences if Gemini adds them.
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "").strip()

    # Validate that Gemini returned valid JSON.
    evaluation = json.loads(text)

    required_fields = [
        "technical_score",
        "communication_score",
        "relevance_score",
        "clarity_score",
        "overall_score",
        "feedback"
    ]

    for field in required_fields:

        if field not in evaluation:
            raise ValueError(
                f"Gemini evaluation is missing field: {field}"
            )

    return json.dumps(evaluation)


# ========================================
# GENERATE PRACTICE QUESTIONS
# ========================================

def generate_practice_questions(
    category,
    difficulty,
    total_questions=5
):

    ai_client = require_ai_client()

    prompt = f"""
You are an AI interview practice assistant.

Generate exactly {total_questions} interview practice questions.

Category:
{category}

Difficulty:
{difficulty}

Requirements:

- Questions must be relevant to the selected category.
- Questions must match the requested difficulty.
- Questions should be useful for interview preparation.
- Questions should be different from each other.
- Each question must have a concise suggested answer.
- Answers should be technically correct and easy to understand.
- For Behavioral questions, answers should be realistic sample answers.
- For Quick Questions, answers should be short and direct.
- Do not include unnecessary explanations.
- Return ONLY valid JSON.
- Do not use Markdown.
- Do not add code fences.

Return exactly this format:

[
    {{
        "question": "Question 1",
        "answer": "Suggested answer 1"
    }},
    {{
        "question": "Question 2",
        "answer": "Suggested answer 2"
    }}
]
"""

    response = _generate_content_with_retry(
        ai_client,
        prompt
    )

    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "").strip()

    questions = json.loads(text)

    return questions[:total_questions]


# ========================================
# TEST AI SERVICES
# ========================================

if __name__ == "__main__":

    # ------------------------------------
    # TEST INTERVIEW EVALUATION
    # ------------------------------------

    result = evaluate_interview_answer(
        question="What is the difference between a list and a tuple in Python?",
        answer=(
            "A list is mutable, so we can change its elements "
            "after creation. A tuple is immutable, so we cannot "
            "change its elements after creation."
        ),
        role="Python Backend Developer",
        interview_type="Technical",
        difficulty="Easy"
    )

    print("\n========================================")
    print("AI INTERVIEW EVALUATION")
    print("========================================")
    print(result)


    # ------------------------------------
    # TEST PRACTICE QUESTION GENERATION
    # ------------------------------------

    practice_questions = generate_practice_questions(
        category="Technical",
        difficulty="Easy",
        total_questions=3
    )

    print("\n========================================")
    print("AI PRACTICE QUESTIONS")
    print("========================================")

    print(json.dumps(
        practice_questions,
        indent=4
    ))
