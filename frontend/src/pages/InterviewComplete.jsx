import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getLatestInterviewResult } from "../utils/interviewUtils";

function InterviewComplete() {
  const location = useLocation();
  const navigate = useNavigate();

  const [savedResult, setSavedResult] = useState(null);

  // ==========================================
  // LOAD SAVED INTERVIEW RESULT
  // ==========================================

  useEffect(() => {
    const storedResult = getLatestInterviewResult();

    if (storedResult) {
      setSavedResult(storedResult);
    }
  }, []);

  // ==========================================
  // REDIRECT IF NO RESULT EXISTS
  // ==========================================

  useEffect(() => {
    if (!location.state && !savedResult) {
      navigate("/");
    }
  }, [
    location.state,
    savedResult,
    navigate,
  ]);

  // ==========================================
  // GET RESULT
  // ==========================================

  const result =
    location.state ||
    savedResult ||
    {};

  const {
    answers = [],
    role,
    experience,
    interviewType,
    difficulty,
    totalQuestions = 0,
    completedAt,
  } = result;

  // ==========================================
  // CALCULATE REAL SCORES
  // ==========================================

  const scores = useMemo(() => {
    if (!answers || answers.length === 0) {
      return {
        technical: 0,
        communication: 0,
        relevance: 0,
        clarity: 0,
        overall: 0,
      };
    }

    const validAnswers = answers.filter(
      (item) =>
        typeof item.technicalScore === "number" ||
        typeof item.communicationScore === "number" ||
        typeof item.relevanceScore === "number" ||
        typeof item.clarityScore === "number" ||
        typeof item.overallScore === "number"
    );

    if (validAnswers.length === 0) {
      return {
        technical: 0,
        communication: 0,
        relevance: 0,
        clarity: 0,
        overall: 0,
      };
    }

    const getAverage = (field) => {
      const values = validAnswers
        .map((item) => item[field])
        .filter(
          (value) =>
            typeof value === "number"
        );

      if (values.length === 0) {
        return 0;
      }

      const total = values.reduce(
        (sum, value) => sum + value,
        0
      );

      return total / values.length;
    };

    return {
      technical: getAverage(
        "technicalScore"
      ),

      communication: getAverage(
        "communicationScore"
      ),

      relevance: getAverage(
        "relevanceScore"
      ),

      clarity: getAverage(
        "clarityScore"
      ),

      overall: getAverage(
        "overallScore"
      ),
    };
  }, [answers]);

  // ==========================================
  // CONVERT SCORE TO PERCENTAGE
  // ==========================================

  const toPercentage = (score) => {
    return Math.round(
      (score / 10) * 100
    );
  };

  const technicalPercentage =
    toPercentage(scores.technical);

  const communicationPercentage =
    toPercentage(scores.communication);

  const relevancePercentage =
    toPercentage(scores.relevance);

  const clarityPercentage =
    toPercentage(scores.clarity);

  const overallPercentage =
    toPercentage(scores.overall);

  // ==========================================
  // PERFORMANCE MESSAGE
  // ==========================================

  const getPerformanceMessage = () => {
    if (overallPercentage >= 80) {
      return {
        text: "Excellent performance",
        className: "text-green-600",
      };
    }

    if (overallPercentage >= 60) {
      return {
        text: "Good performance",
        className: "text-blue-600",
      };
    }

    if (overallPercentage >= 40) {
      return {
        text: "Needs improvement",
        className: "text-yellow-600",
      };
    }

    return {
      text: "Needs significant improvement",
      className: "text-red-600",
    };
  };

  const performance =
    getPerformanceMessage();

  // ==========================================
  // UI
  // ==========================================

  return (
    <div>

      {/* ====================================== */}
      {/* PAGE HEADING */}
      {/* ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Interview Completed 🎉
        </h1>

        <p className="text-gray-500 mt-2">
          Great job! Here's your AI-powered
          interview performance.
        </p>

      </div>


      {/* ====================================== */}
      {/* INTERVIEW INFORMATION */}
      {/* ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          Interview Details
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {totalQuestions} question
          {totalQuestions !== 1
            ? "s"
            : ""}{" "}
          completed
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-5">

          {/* ROLE */}

          <div>
            <p className="text-sm text-gray-500">
              Role
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {role || "Not available"}
            </p>
          </div>


          {/* EXPERIENCE */}

          <div>
            <p className="text-sm text-gray-500">
              Experience
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {experience || "Not available"}
            </p>
          </div>


          {/* TYPE */}

          <div>
            <p className="text-sm text-gray-500">
              Type
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {interviewType || "Not available"}
            </p>
          </div>


          {/* DIFFICULTY */}

          <div>
            <p className="text-sm text-gray-500">
              Difficulty
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {difficulty || "Not available"}
            </p>
          </div>

        </div>


        {/* COMPLETED TIME */}

        {completedAt && (
          <div className="mt-5 pt-5 border-t border-gray-100">

            <p className="text-sm text-gray-500">
              Completed At
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {new Date(
                completedAt
              ).toLocaleString()}
            </p>

          </div>
        )}

      </div>


      {/* ====================================== */}
      {/* SCORE CARDS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

        {/* OVERALL */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Overall Score
          </p>

          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {overallPercentage}%
          </h2>

          <p
            className={`text-sm mt-2 ${performance.className}`}
          >
            {performance.text}
          </p>

        </div>


        {/* TECHNICAL */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Technical Score
          </p>

          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {technicalPercentage}%
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Technical accuracy across answers
          </p>

        </div>


        {/* COMMUNICATION */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Communication
          </p>

          <h2 className="text-4xl font-bold text-blue-600 mt-3">
            {communicationPercentage}%
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Communication quality across answers
          </p>

        </div>

      </div>


      {/* ====================================== */}
      {/* DETAILED SCORE BREAKDOWN */}
      {/* ====================================== */}

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          Detailed Score Breakdown
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Average scores generated by AI across
          your interview answers.
        </p>


        <div className="space-y-6 mt-6">

          {/* TECHNICAL */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <span className="text-sm font-medium text-gray-700">
                Technical Accuracy
              </span>

              <span className="text-sm font-semibold text-blue-600">
                {technicalPercentage}%
              </span>

            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${technicalPercentage}%`,
                }}
              />

            </div>

          </div>


          {/* COMMUNICATION */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <span className="text-sm font-medium text-gray-700">
                Communication
              </span>

              <span className="text-sm font-semibold text-blue-600">
                {communicationPercentage}%
              </span>

            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${communicationPercentage}%`,
                }}
              />

            </div>

          </div>


          {/* RELEVANCE */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <span className="text-sm font-medium text-gray-700">
                Relevance
              </span>

              <span className="text-sm font-semibold text-blue-600">
                {relevancePercentage}%
              </span>

            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${relevancePercentage}%`,
                }}
              />

            </div>

          </div>


          {/* CLARITY */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <span className="text-sm font-medium text-gray-700">
                Clarity
              </span>

              <span className="text-sm font-semibold text-blue-600">
                {clarityPercentage}%
              </span>

            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${clarityPercentage}%`,
                }}
              />

            </div>

          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* SUBMITTED ANSWERS + AI EVALUATION */}
      {/* ====================================== */}

      <div className="mt-8">

        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Your Answers & AI Evaluation
        </h2>

        <div className="space-y-5">

          {answers.length > 0 ? (

            answers.map(
              (item, index) => (

                <div
                  key={
                    item.answerId ||
                    index
                  }
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                >

                  {/* QUESTION */}

                  <div className="flex items-start gap-3">

                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1">

                      <p className="text-xs text-blue-600 font-medium mb-2">
                        Question {index + 1}
                      </p>

                      <h3 className="font-semibold text-gray-800 leading-relaxed">
                        {item.question}
                      </h3>


                      {/* ANSWER */}

                      <div className="mt-5">

                        <p className="text-sm font-medium text-gray-700">
                          Your Answer
                        </p>

                        <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-4">

                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {item.answer ||
                              "No answer provided."}
                          </p>

                        </div>

                      </div>


                      {/* AI SCORES */}

                      {typeof item.overallScore ===
                        "number" && (

                        <div className="mt-5">

                          <p className="text-sm font-medium text-gray-700 mb-3">
                            AI Evaluation
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500">
                                Technical
                              </p>

                              <p className="text-lg font-bold text-blue-600 mt-1">
                                {item.technicalScore}/10
                              </p>
                            </div>


                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500">
                                Communication
                              </p>

                              <p className="text-lg font-bold text-blue-600 mt-1">
                                {item.communicationScore}/10
                              </p>
                            </div>


                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500">
                                Relevance
                              </p>

                              <p className="text-lg font-bold text-blue-600 mt-1">
                                {item.relevanceScore}/10
                              </p>
                            </div>


                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500">
                                Clarity
                              </p>

                              <p className="text-lg font-bold text-blue-600 mt-1">
                                {item.clarityScore}/10
                              </p>
                            </div>


                            <div className="bg-green-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500">
                                Overall
                              </p>

                              <p className="text-lg font-bold text-green-600 mt-1">
                                {item.overallScore}/10
                              </p>
                            </div>

                          </div>


                          {/* FEEDBACK */}

                          {item.feedback && (
                            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">

                              <p className="text-sm font-medium text-gray-700">
                                AI Feedback
                              </p>

                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {item.feedback}
                              </p>

                            </div>
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              )
            )

          ) : (

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

              <p className="text-gray-500">
                No answers were submitted.
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ====================================== */}
      {/* AI SUMMARY */}
      {/* ====================================== */}

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          AI Performance Summary
        </h2>

        {answers.some(
          (item) =>
            typeof item.overallScore ===
            "number"
        ) ? (

          <p className="text-gray-600 mt-4 leading-relaxed">

            Your interview received an overall
            score of{" "}

            <span className="font-semibold text-blue-600">
              {overallPercentage}%
            </span>

            . The score is based on AI evaluation
            of technical accuracy, communication,
            relevance, clarity, and overall
            performance across your answers.

            Review the individual feedback above
            to identify areas where you can improve.

          </p>

        ) : (

          <p className="text-gray-600 mt-4 leading-relaxed">
            AI evaluation data is not available
            for this interview yet.
          </p>

        )}

      </div>


      {/* ====================================== */}
      {/* ACTIONS */}
      {/* ====================================== */}

      <div className="mt-8 flex flex-wrap gap-4">

        <button
          onClick={() =>
            navigate(
              `/analysis?interviewId=${result.interviewId}`
            )
          }
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          View Detailed Analysis →
        </button>


        <button
          onClick={() =>
            navigate("/interview-setup")
          }
          className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Practice Again
        </button>


        <button
          onClick={() =>
            navigate("/")
          }
          className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default InterviewComplete;