from database import SessionLocal

from practice_models import PracticeQuestion


questions = [

    # ==========================================
    # TECHNICAL - EASY
    # ==========================================

    {
        "category": "Technical",
        "difficulty": "Easy",
        "question": "What is the difference between a list and a tuple in Python?",
        "answer": "A list is mutable, meaning its elements can be changed after creation. A tuple is immutable, so its elements cannot be changed after creation."
    },

    {
        "category": "Technical",
        "difficulty": "Easy",
        "question": "What is a primary key in a database?",
        "answer": "A primary key uniquely identifies each row in a database table. It must contain unique values and cannot contain NULL values."
    },

    {
        "category": "Technical",
        "difficulty": "Easy",
        "question": "What is an API?",
        "answer": "An API is an interface that allows different software applications to communicate with each other using defined requests and responses."
    },

    {
        "category": "Technical",
        "difficulty": "Easy",
        "question": "What is HTTP?",
        "answer": "HTTP is a protocol used for communication between clients and servers on the web."
    },

    {
        "category": "Technical",
        "difficulty": "Easy",
        "question": "What is the difference between GET and POST?",
        "answer": "GET is generally used to retrieve data, while POST is generally used to send data to the server."
    },


    # ==========================================
    # TECHNICAL - MEDIUM
    # ==========================================

    {
        "category": "Technical",
        "difficulty": "Medium",
        "question": "Explain the difference between authentication and authorization.",
        "answer": "Authentication verifies who the user is, while authorization determines what an authenticated user is allowed to access."
    },

    {
        "category": "Technical",
        "difficulty": "Medium",
        "question": "What is a database JOIN?",
        "answer": "A JOIN combines rows from two or more tables based on a related column."
    },

    {
        "category": "Technical",
        "difficulty": "Medium",
        "question": "What is the difference between PUT and PATCH?",
        "answer": "PUT is generally used to replace an entire resource, while PATCH is generally used to partially update a resource."
    },

    {
        "category": "Technical",
        "difficulty": "Medium",
        "question": "What is middleware in a backend application?",
        "answer": "Middleware is code that runs between receiving a request and sending a response. It can handle authentication, logging, validation, and errors."
    },

    {
        "category": "Technical",
        "difficulty": "Medium",
        "question": "What is JWT authentication?",
        "answer": "JWT authentication uses a signed token containing claims about a user. The client sends the token with requests so the server can verify the user's identity."
    },


    # ==========================================
    # TECHNICAL - HARD
    # ==========================================

    {
        "category": "Technical",
        "difficulty": "Hard",
        "question": "How would you design a scalable REST API?",
        "answer": "A scalable REST API should use clear resource-based endpoints, authentication, validation, pagination, caching where appropriate, database indexing, monitoring, and horizontal scaling."
    },

    {
        "category": "Technical",
        "difficulty": "Hard",
        "question": "What is database indexing and what are its trade-offs?",
        "answer": "An index improves query performance but consumes storage and can slow INSERT, UPDATE, and DELETE operations."
    },

    {
        "category": "Technical",
        "difficulty": "Hard",
        "question": "Explain synchronous and asynchronous programming.",
        "answer": "Synchronous operations execute sequentially and may block until completion. Asynchronous programming allows other work to continue while waiting for operations such as I/O."
    },


    # ==========================================
    # BEHAVIORAL - EASY
    # ==========================================

    {
        "category": "Behavioral",
        "difficulty": "Easy",
        "question": "Tell me about yourself.",
        "answer": "Give a concise introduction covering your education, relevant skills, projects, and the type of role you are looking for."
    },

    {
        "category": "Behavioral",
        "difficulty": "Easy",
        "question": "What are your strengths?",
        "answer": "Choose two or three genuine strengths and support each with a short example."
    },

    {
        "category": "Behavioral",
        "difficulty": "Easy",
        "question": "What is one area you are trying to improve?",
        "answer": "Mention a genuine improvement area and explain the concrete steps you are taking to improve it."
    },


    # ==========================================
    # BEHAVIORAL - MEDIUM
    # ==========================================

    {
        "category": "Behavioral",
        "difficulty": "Medium",
        "question": "Tell me about a challenging project you worked on.",
        "answer": "Use the STAR structure: Situation, Task, Action, and Result."
    },

    {
        "category": "Behavioral",
        "difficulty": "Medium",
        "question": "Tell me about a time you made a mistake.",
        "answer": "Explain the situation honestly, what you learned, and how you changed your approach afterward."
    },

    {
        "category": "Behavioral",
        "difficulty": "Medium",
        "question": "How do you handle tight deadlines?",
        "answer": "Explain how you prioritize tasks, break work into smaller pieces, communicate risks, and focus on important deliverables."
    },


    # ==========================================
    # BEHAVIORAL - HARD
    # ==========================================

    {
        "category": "Behavioral",
        "difficulty": "Hard",
        "question": "Tell me about a time you failed and what you learned from it.",
        "answer": "Describe a genuine failure, explain your responsibility, what you learned, and the specific change you made afterward."
    },

    {
        "category": "Behavioral",
        "difficulty": "Hard",
        "question": "Describe a difficult technical decision you made.",
        "answer": "Explain the alternatives, constraints, reasoning behind your decision, implementation, and result."
    },


    # ==========================================
    # QUICK QUESTIONS - EASY
    # ==========================================

    {
        "category": "Quick Questions",
        "difficulty": "Easy",
        "question": "What is Python?",
        "answer": "Python is a high-level, general-purpose programming language known for readable syntax and a large ecosystem."
    },

    {
        "category": "Quick Questions",
        "difficulty": "Easy",
        "question": "What is SQL?",
        "answer": "SQL is a language used to query, manipulate, and manage data in relational databases."
    },

    {
        "category": "Quick Questions",
        "difficulty": "Easy",
        "question": "What is Git?",
        "answer": "Git is a distributed version control system used to track changes in source code."
    },

    {
        "category": "Quick Questions",
        "difficulty": "Easy",
        "question": "What is JSON?",
        "answer": "JSON is a lightweight text-based format commonly used to exchange structured data between applications."
    },


    # ==========================================
    # QUICK QUESTIONS - MEDIUM
    # ==========================================

    {
        "category": "Quick Questions",
        "difficulty": "Medium",
        "question": "What is the difference between SQL and NoSQL?",
        "answer": "SQL databases generally use structured tables and relational schemas, while NoSQL databases use models such as documents, key-value pairs, graphs, or wide-column structures."
    },

    {
        "category": "Quick Questions",
        "difficulty": "Medium",
        "question": "What is REST?",
        "answer": "REST is an architectural style for designing networked applications around resources and standard HTTP methods."
    },

    {
        "category": "Quick Questions",
        "difficulty": "Medium",
        "question": "What is a foreign key?",
        "answer": "A foreign key references a key in another table and helps establish relationships between tables."
    },


    # ==========================================
    # QUICK QUESTIONS - HARD
    # ==========================================

    {
        "category": "Quick Questions",
        "difficulty": "Hard",
        "question": "What happens when you enter a URL in a browser?",
        "answer": "The browser resolves the domain through DNS, establishes a connection, sends an HTTP request, receives the response, and renders the returned resources."
    },

    {
        "category": "Quick Questions",
        "difficulty": "Hard",
        "question": "What is caching?",
        "answer": "Caching stores frequently accessed data closer to where it is needed so future requests can be served faster."
    }
]


def seed_questions():

    db = SessionLocal()

    try:

        existing_count = (
            db.query(PracticeQuestion).count()
        )

        if existing_count > 0:
            print(
                f"Practice questions already exist: {existing_count}"
            )
            return

        for item in questions:

            question = PracticeQuestion(
                category=item["category"],
                difficulty=item["difficulty"],
                question=item["question"],
                answer=item["answer"]
            )

            db.add(question)

        db.commit()

        print(
            f"Successfully inserted {len(questions)} practice questions."
        )

    finally:
        db.close()


if __name__ == "__main__":
    seed_questions()