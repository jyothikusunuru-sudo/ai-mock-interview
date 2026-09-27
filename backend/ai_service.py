from google import genai
from dotenv import load_dotenv
import json


# ========================================
# LOAD ENVIRONMENT VARIABLES
# ========================================

load_dotenv()


# ========================================
# GEMINI CLIENT
# ========================================

client = genai.Client()


# ========================================
# GEMINI MODEL
# ========================================

MODEL_NAME = "gemini-3.5-flash-lite"


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

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
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

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    text = response.text.strip()

    return text


# ========================================
# GENERATE PRACTICE QUESTIONS
# ========================================

def generate_practice_questions(
    category,
    difficulty,
    total_questions=5
):

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
- Do not add ```json or ```.

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

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    text = response.text.strip()

    # Remove Markdown code fences if Gemini accidentally adds them
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

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