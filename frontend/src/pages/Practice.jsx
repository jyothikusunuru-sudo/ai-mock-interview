import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Trophy,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Practice() {
  // ==========================================
  // PRACTICE SETTINGS
  // ==========================================

  const [practiceType, setPracticeType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Easy");

  // ==========================================
  // QUESTIONS
  // ==========================================

  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // ==========================================
  // UI STATE
  // ==========================================

  const [showAnswer, setShowAnswer] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const [loading, setLoading] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // PRACTICE STATISTICS
  // ==========================================

  const [stats, setStats] = useState({
    total_attempts: 0,
    correct_attempts: 0,
    accuracy: 0,
  });

  // ==========================================
  // AUTH TOKEN
  // ==========================================

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const currentQuestion = questions[questionIndex];

  const totalQuestions = questions.length;

  // ==========================================
  // PROGRESS
  // ==========================================

  const progress = totalQuestions
    ? Math.round(((questionIndex + 1) / totalQuestions) * 100)
    : 0;

  // ==========================================
  // CURRENT SESSION SCORE
  // ==========================================

  const score = useMemo(() => {
    if (correctAnswers === 0 || totalQuestions === 0) {
      return 0;
    }

    return Math.round(
      (correctAnswers / totalQuestions) * 100
    );
  }, [correctAnswers, totalQuestions]);

  // ==========================================
  // LOAD PRACTICE QUESTIONS
  // ==========================================

  const loadQuestions = async (
    type = practiceType,
    level = difficulty
  ) => {
    if (!token) {
      setError("Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // --------------------------------------
      // FIRST: GET EXISTING QUESTIONS
      // --------------------------------------

      const response = await fetch(
        `${API_URL}/practice/questions?category=${encodeURIComponent(
          type
        )}&difficulty=${encodeURIComponent(level)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load practice questions (${response.status})`
        );
      }

      let data = await response.json();

      // --------------------------------------
      // IF QUESTIONS EXIST, USE THEM
      // --------------------------------------

      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);

        setQuestionIndex(0);
        setShowAnswer(false);
        setAnswered(false);
        setCorrectAnswers(0);

        return;
      }

      // --------------------------------------
      // NO QUESTIONS
      // GENERATE USING GEMINI
      // --------------------------------------

      const generateResponse = await fetch(
        `${API_URL}/practice/generate?category=${encodeURIComponent(
          type
        )}&difficulty=${encodeURIComponent(level)}&total_questions=5`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to generate practice questions (${generateResponse.status})`
        );
      }

      const generatedData = await generateResponse.json();

      if (
        !generatedData.questions ||
        !Array.isArray(generatedData.questions)
      ) {
        throw new Error(
          "No practice questions were returned by the server."
        );
      }

      setQuestions(generatedData.questions);

      setQuestionIndex(0);
      setShowAnswer(false);
      setAnswered(false);
      setCorrectAnswers(0);
    } catch (err) {
      console.error("Practice question error:", err);

      setQuestions([]);
      setError(
        err.message ||
          "Something went wrong while loading practice questions."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD PRACTICE STATISTICS
  // ==========================================

  const loadStats = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/practice/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setStats({
        total_attempts: data.total_attempts || 0,
        correct_attempts: data.correct_attempts || 0,
        accuracy: data.accuracy || 0,
      });
    } catch (err) {
      console.error("Failed to load practice stats:", err);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadQuestions("Technical", "Easy");
    loadStats();
  }, []);

  // ==========================================
  // CHANGE PRACTICE TYPE
  // ==========================================

  const handlePracticeTypeChange = (type) => {
    setPracticeType(type);

    setQuestionIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(0);
    setAnswered(false);

    loadQuestions(type, difficulty);
  };

  // ==========================================
  // CHANGE DIFFICULTY
  // ==========================================

  const handleDifficultyChange = (level) => {
    setDifficulty(level);

    setQuestionIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(0);
    setAnswered(false);

    loadQuestions(practiceType, level);
  };

  // ==========================================
  // SAVE PRACTICE ATTEMPT
  // ==========================================

  const saveAttempt = async (questionId, isCorrect) => {
    if (!token || !questionId) {
      return;
    }

    setSavingAttempt(true);

    try {
      const response = await fetch(
        `${API_URL}/practice/attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question_id: questionId,
            is_correct: isCorrect,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to save practice attempt."
        );
      }

      // Refresh overall statistics
      await loadStats();
    } catch (err) {
      console.error("Failed to save practice attempt:", err);
    } finally {
      setSavingAttempt(false);
    }
  };

  // ==========================================
  // SELF CHECK
  // ==========================================

  const handleSelfCheck = async (isCorrect) => {
    if (answered || !currentQuestion) {
      return;
    }

    setAnswered(true);

    if (isCorrect) {
      setCorrectAnswers(
        (previous) => previous + 1
      );
    }

    await saveAttempt(
      currentQuestion.id,
      isCorrect
    );
  };

  // ==========================================
  // NEXT QUESTION
  // ==========================================

  const handleNext = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(
        (previous) => previous + 1
      );

      setShowAnswer(false);
      setAnswered(false);
    }
  };

  // ==========================================
  // RESTART PRACTICE
  // ==========================================

  const handleRestart = () => {
    setQuestionIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(0);
    setAnswered(false);

    loadQuestions(
      practiceType,
      difficulty
    );
  };

  // ==========================================
  // LAST QUESTION
  // ==========================================

  const isLastQuestion =
    totalQuestions > 0 &&
    questionIndex === totalQuestions - 1;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>

      {/* ======================================
          PAGE HEADING
      ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Practice
        </h1>

        <p className="text-gray-500 mt-2">
          Improve your interview skills with
          AI-generated practice questions.
        </p>

      </div>


      {/* ======================================
          PRACTICE TYPE
      ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-800">
          Choose Practice Type
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* TECHNICAL */}

          <button
            onClick={() =>
              handlePracticeTypeChange(
                "Technical"
              )
            }
            disabled={loading}
            className={`text-left p-5 rounded-xl border-2 transition ${
              practiceType === "Technical"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            } ${
              loading
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >

            <div className="text-2xl">
              💻
            </div>

            <h3 className="font-semibold text-gray-800 mt-3">
              Technical Practice
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Programming, backend, databases
              and APIs.
            </p>

          </button>


          {/* BEHAVIORAL */}

          <button
            onClick={() =>
              handlePracticeTypeChange(
                "Behavioral"
              )
            }
            disabled={loading}
            className={`text-left p-5 rounded-xl border-2 transition ${
              practiceType === "Behavioral"
                ? "border-purple-600 bg-purple-50"
                : "border-gray-200 hover:border-purple-300"
            } ${
              loading
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >

            <div className="text-2xl">
              🗣️
            </div>

            <h3 className="font-semibold text-gray-800 mt-3">
              Behavioral Practice
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              HR and behavioral interview
              questions.
            </p>

          </button>


          {/* QUICK QUESTIONS */}

          <button
            onClick={() =>
              handlePracticeTypeChange(
                "Quick Questions"
              )
            }
            disabled={loading}
            className={`text-left p-5 rounded-xl border-2 transition ${
              practiceType === "Quick Questions"
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-green-300"
            } ${
              loading
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >

            <div className="text-2xl">
              ⚡
            </div>

            <h3 className="font-semibold text-gray-800 mt-3">
              Quick Questions
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Short questions for quick
              practice.
            </p>

          </button>

        </div>

      </div>


      {/* ======================================
          DIFFICULTY
      ====================================== */}

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-800">
          Difficulty
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">

          {["Easy", "Medium", "Hard"].map(
            (level) => (

              <button
                key={level}
                onClick={() =>
                  handleDifficultyChange(level)
                }
                disabled={loading}
                className={`px-5 py-2.5 rounded-lg border font-medium transition ${
                  difficulty === level
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                } ${
                  loading
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {level}
              </button>

            )
          )}

        </div>

      </div>


      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Total Attempts
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {stats.total_attempts}
          </p>

        </div>


        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Correct Answers
          </p>

          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.correct_attempts}
          </p>

        </div>


        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Overall Accuracy
          </p>

          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.accuracy}%
          </p>

        </div>

      </div>


      {/* ======================================
          ERROR
      ====================================== */}

      {error && (

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <p className="text-red-700 font-medium">
            {error}
          </p>

          <button
            onClick={() =>
              loadQuestions(
                practiceType,
                difficulty
              )
            }
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Try Again
          </button>

        </div>

      )}


      {/* ======================================
          LOADING
      ====================================== */}

      {loading && (

        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center">

          <Loader2
            size={40}
            className="text-blue-600 animate-spin"
          />

          <p className="mt-4 text-gray-700 font-medium">
            Preparing your practice questions...
          </p>

          <p className="text-sm text-gray-500 mt-1">
            AI is generating questions if needed.
          </p>

        </div>

      )}


      {/* ======================================
          PRACTICE QUESTION
      ====================================== */}

      {!loading &&
        !error &&
        currentQuestion && (

          <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

            {/* HEADER */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <p className="text-sm text-blue-600 font-medium">
                  {practiceType} • {difficulty}
                </p>

                <h2 className="text-xl font-semibold text-gray-800 mt-1">
                  Question {questionIndex + 1} of{" "}
                  {totalQuestions}
                </h2>

              </div>


              <div className="text-right">

                <p className="text-sm text-gray-500">
                  Practice Score
                </p>

                <p className="text-2xl font-bold text-blue-600">
                  {score}%
                </p>

              </div>

            </div>


            {/* PROGRESS */}

            <div className="mt-5">

              <div className="flex justify-between text-xs text-gray-500 mb-2">

                <span>
                  Progress
                </span>

                <span>
                  {progress}%
                </span>

              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>


            {/* QUESTION */}

            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">

              <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </p>

            </div>


            {/* SHOW ANSWER */}

            <div className="mt-6">

              <button
                onClick={() =>
                  setShowAnswer(
                    (previous) => !previous
                  )
                }
                className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
              >

                {showAnswer ? (
                  <>
                    <EyeOff size={18} />
                    Hide Suggested Answer
                  </>
                ) : (
                  <>
                    <Eye size={18} />
                    Show Suggested Answer
                  </>
                )}

              </button>


              {showAnswer && (

                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-5">

                  <p className="text-sm font-semibold text-blue-800">
                    Suggested Answer
                  </p>

                  <p className="text-gray-700 mt-2 leading-relaxed">
                    {currentQuestion.answer}
                  </p>

                </div>

              )}

            </div>


            {/* SELF CHECK */}

            {!answered ? (

              <div className="mt-7">

                <p className="text-sm text-gray-500 mb-3">
                  After comparing your answer with
                  the suggested answer, rate your
                  response:
                </p>

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      handleSelfCheck(true)
                    }
                    disabled={savingAttempt}
                    className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
                  >
                    {savingAttempt
                      ? "Saving..."
                      : "✓ I Got It Right"}
                  </button>


                  <button
                    onClick={() =>
                      handleSelfCheck(false)
                    }
                    disabled={savingAttempt}
                    className="px-5 py-2.5 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
                  >
                    {savingAttempt
                      ? "Saving..."
                      : "I Need More Practice"}
                  </button>

                </div>

              </div>

            ) : (

              <div className="mt-7 bg-green-50 border border-green-200 rounded-xl p-4">

                <div className="flex items-center gap-2 text-green-700 font-semibold">

                  <CheckCircle size={19} />

                  Response recorded.

                </div>

                <p className="text-sm text-green-600 mt-1">

                  Your practice attempt has been
                  saved to your account.

                </p>

              </div>

            )}


            {/* NEXT / FINISH */}

            <div className="mt-7 flex flex-wrap gap-3">

              {answered &&
                !isLastQuestion && (

                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                  >

                    Next Question

                    <ArrowRight size={18} />

                  </button>

                )}


              {answered &&
                isLastQuestion && (

                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                  >

                    <RotateCcw size={18} />

                    Practice Again

                  </button>

                )}

            </div>


            {/* FINISHED MESSAGE */}

            {answered &&
              isLastQuestion && (

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">

                  <div className="flex items-center gap-2">

                    <Trophy
                      size={22}
                      className="text-yellow-600"
                    />

                    <p className="font-semibold text-gray-800">
                      Practice session completed!
                    </p>

                  </div>

                  <p className="text-gray-600 mt-2">

                    You answered{" "}
                    <span className="font-semibold">
                      {correctAnswers}
                    </span>{" "}
                    out of{" "}
                    <span className="font-semibold">
                      {totalQuestions}
                    </span>{" "}
                    correctly.

                  </p>

                  <p className="text-blue-600 font-bold mt-1">
                    Session Score: {score}%
                  </p>

                </div>

              )}

          </div>

        )}


      {/* ======================================
          NO QUESTIONS
      ====================================== */}

      {!loading &&
        !error &&
        !currentQuestion &&
        questions.length === 0 && (

          <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-10 text-center">

            <p className="text-gray-600">
              No practice questions available.
            </p>

            <button
              onClick={() =>
                loadQuestions(
                  practiceType,
                  difficulty
                )
              }
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Generate Questions
            </button>

          </div>

        )}


      {/* ======================================
          PRACTICE TIPS
      ====================================== */}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-8">

        <h2 className="text-xl font-semibold text-blue-800">
          ✨ Practice Tip
        </h2>

        <p className="text-gray-700 mt-3 leading-relaxed">

          Try answering each question out loud
          before checking the suggested answer.
          For behavioral questions, use the STAR
          method: Situation, Task, Action, and
          Result.

        </p>

      </div>

    </div>
  );
}

export default Practice;