import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function Analysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const interviewId = searchParams.get("interviewId");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH INTERVIEW REPORT
  // ==========================================

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login");
          return;
        }

        let selectedInterviewId = interviewId;

        // ==========================================
        // IF NO ID IN URL, FIND LATEST COMPLETED
        // ==========================================

        if (!selectedInterviewId) {
          const interviewsResponse = await fetch(
            "http://127.0.0.1:8000/interviews",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const interviewsData =
            await interviewsResponse.json();

          if (!interviewsResponse.ok) {
            if (interviewsResponse.status === 401) {
              localStorage.removeItem("access_token");
              localStorage.removeItem("user");
              navigate("/login");
              return;
            }

            throw new Error(
              interviewsData.detail ||
                "Failed to load interviews."
            );
          }

          const interviews = Array.isArray(interviewsData)
            ? interviewsData
            : interviewsData?.interviews || [];

          // Only completed interviews
          const completedInterviews =
            interviews.filter(
              (item) =>
                item.overall_score !== null &&
                item.overall_score !== undefined
            );

          if (completedInterviews.length === 0) {
            throw new Error(
              "No completed interviews are available yet."
            );
          }

          // Get latest completed interview
          const latestInterview = [
            ...completedInterviews,
          ].sort((a, b) => {
            if (a.created_at && b.created_at) {
              return (
                new Date(b.created_at) -
                new Date(a.created_at)
              );
            }

            return b.id - a.id;
          })[0];

          selectedInterviewId =
            latestInterview.id;
        }

        // ==========================================
        // FETCH SELECTED INTERVIEW REPORT
        // ==========================================

        const response = await fetch(
          `http://127.0.0.1:8000/interviews/${selectedInterviewId}/report`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            navigate("/login");
            return;
          }

          throw new Error(
            data.detail ||
              "Failed to load interview report."
          );
        }

        setReport(data);
      } catch (err) {
        console.error(
          "Error fetching report:",
          err
        );

        setError(
          err.message ||
            "Unable to load interview report."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId, navigate]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Interview Analysis
          </h1>

          <p className="text-gray-500 mt-2">
            Loading your interview report...
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-gray-500">
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Interview Analysis
          </h1>

          <p className="text-gray-500 mt-2">
            Detailed analysis of your interview
            performance.
          </p>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-10 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Unable to Load Report
          </h2>

          <p className="text-red-500 mt-3">
            {error}
          </p>

          <button
            onClick={() => navigate("/reports")}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // REPORT DATA
  // ==========================================

  const interview =
    report?.interview || report;

  const answers =
    report?.answers || [];

  // ==========================================
  // CALCULATE AVERAGE
  // ==========================================

  const getAverage = (field) => {
    const values = answers
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

  const technicalScore =
    getAverage("technical_score");

  const communicationScore =
    getAverage("communication_score");

  const relevanceScore =
    getAverage("relevance_score");

  const clarityScore =
    getAverage("clarity_score");

  const overallScore =
    typeof interview?.overall_score ===
    "number"
      ? interview.overall_score
      : getAverage("overall_score");

  // ==========================================
  // SCORE TO PERCENTAGE
  // ==========================================

  const toPercentage = (score) => {
    if (
      typeof score !== "number" ||
      !Number.isFinite(score)
    ) {
      return 0;
    }

    if (score > 10) {
      return Math.round(score);
    }

    return Math.round(score * 10);
  };

  const technical =
    toPercentage(technicalScore);

  const communication =
    toPercentage(communicationScore);

  const relevance =
    toPercentage(relevanceScore);

  const clarity =
    toPercentage(clarityScore);

  const overall =
    toPercentage(overallScore);

  // ==========================================
  // STRENGTHS
  // ==========================================

  const strengths = [];

  if (technical >= 70) {
    strengths.push(
      "Good understanding of technical concepts."
    );
  }

  if (communication >= 70) {
    strengths.push(
      "Good communication while answering."
    );
  }

  if (relevance >= 70) {
    strengths.push(
      "Answers were relevant to the questions."
    );
  }

  if (clarity >= 70) {
    strengths.push(
      "Answers were clear and understandable."
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Continue practicing regularly to improve interview performance."
    );
  }

  // ==========================================
  // AREAS TO IMPROVE
  // ==========================================

  const improvements = [];

  if (technical < 70) {
    improvements.push(
      "Strengthen your technical concepts."
    );
  }

  if (communication < 70) {
    improvements.push(
      "Improve communication while explaining answers."
    );
  }

  if (relevance < 70) {
    improvements.push(
      "Keep answers more directly related to the question."
    );
  }

  if (clarity < 70) {
    improvements.push(
      "Improve explanation clarity and answer structure."
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "Continue practicing to maintain your current performance."
    );
  }

  // ==========================================
  // RECOMMENDATION
  // ==========================================

  let recommendation;

  if (overall >= 80) {
    recommendation =
      "Your overall performance is strong. Continue practicing with different interview questions and focus on giving structured answers with practical examples.";
  } else if (overall >= 60) {
    recommendation =
      "Your performance is good, but there is room for improvement. Focus on technical depth, clear explanations, and practical examples.";
  } else if (overall >= 40) {
    recommendation =
      "Keep practicing regularly. Focus on understanding core concepts and explaining your answers in a simple and structured way.";
  } else {
    recommendation =
      "Start with the fundamentals and practice answering simple interview questions. Gradually increase the difficulty as your skills improve.";
  }

  return (
    <div>

      {/* ====================================== */}
      {/* PAGE HEADING */}
      {/* ====================================== */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Interview Analysis
        </h1>

        <p className="text-gray-500 mt-2">
          Detailed analysis of your AI-evaluated
          interview performance.
        </p>
      </div>

      {/* ====================================== */}
      {/* INTERVIEW DETAILS */}
      {/* ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          Interview Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-5">

          <div>
            <p className="text-sm text-gray-500">
              Role
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {interview?.role ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Experience
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {interview?.experience ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Type
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {interview?.interview_type ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Difficulty
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {interview?.difficulty ||
                "Not available"}
            </p>
          </div>

        </div>

      </div>

      {/* ====================================== */}
      {/* OVERALL PERFORMANCE */}
      {/* ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mt-8">

        <div className="flex flex-col md:flex-row items-center justify-between gap-8">

          <div>

            <p className="text-sm text-gray-500">
              Overall Performance
            </p>

            <h2 className="text-5xl font-bold text-blue-600 mt-2">
              {overall}%
            </h2>

            <p className="text-gray-500 mt-3">
              Based on AI evaluation across{" "}
              {answers.length}{" "}
              question
              {answers.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          <div className="w-28 h-28 rounded-full border-8 border-blue-600 flex items-center justify-center">

            <span className="text-2xl font-bold text-gray-800">
              {overall}
            </span>

          </div>

        </div>

      </div>

      {/* ====================================== */}
      {/* PERFORMANCE BREAKDOWN */}
      {/* ====================================== */}

      <div className="mt-8">

        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Performance Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {[
            {
              name: "Technical Knowledge",
              value: technical,
            },
            {
              name: "Communication",
              value: communication,
            },
            {
              name: "Relevance",
              value: relevance,
            },
            {
              name: "Clarity",
              value: clarity,
            },
          ].map((item) => (

            <div
              key={item.name}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >

              <div className="flex items-center justify-between">

                <p className="text-sm text-gray-500">
                  {item.name}
                </p>

                <span className="text-lg font-bold text-blue-600">
                  {item.value}%
                </span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">

                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${item.value}%`,
                  }}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* ====================================== */}
      {/* STRENGTHS + IMPROVEMENTS */}
      {/* ====================================== */}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-800">
            💪 Strengths
          </h2>

          <ul className="mt-4 space-y-3 text-gray-600">

            {strengths.map(
              (strength, index) => (

                <li
                  key={index}
                  className="flex gap-3"
                >

                  <span className="text-green-600 font-bold">
                    ✓
                  </span>

                  <span>
                    {strength}
                  </span>

                </li>

              )
            )}

          </ul>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-800">
            🎯 Areas to Improve
          </h2>

          <ul className="mt-4 space-y-3 text-gray-600">

            {improvements.map(
              (improvement, index) => (

                <li
                  key={index}
                  className="flex gap-3"
                >

                  <span className="text-blue-600 font-bold">
                    →
                  </span>

                  <span>
                    {improvement}
                  </span>

                </li>

              )
            )}

          </ul>

        </div>

      </div>

      {/* ====================================== */}
      {/* QUESTION ANALYSIS */}
      {/* ====================================== */}

      <div className="mt-8">

        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Question-by-Question Analysis
        </h2>

        <div className="space-y-5">

          {answers.length > 0 ? (

            answers.map(
              (item, index) => {

                const questionScore =
                  toPercentage(
                    item.overall_score
                  );

                return (

                  <div
                    key={
                      item.answer_id ||
                      index
                    }
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-start gap-3">

                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>

                        <div>

                          <p className="text-xs text-blue-600 font-medium">
                            Question {index + 1}
                          </p>

                          <h3 className="font-semibold text-gray-800 mt-1 leading-relaxed">
                            {item.question}
                          </h3>

                        </div>

                      </div>

                      <div className="text-right flex-shrink-0">

                        <p className="text-2xl font-bold text-blue-600">
                          {questionScore}%
                        </p>

                        <p className="text-xs text-gray-500">
                          Overall
                        </p>

                      </div>

                    </div>

                    {/* ANSWER */}

                    <div className="mt-5 bg-gray-50 rounded-xl p-4">

                      <p className="text-xs font-medium text-gray-500">
                        Your Answer
                      </p>

                      <p className="text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">
                        {item.answer ||
                          "No answer provided."}
                      </p>

                    </div>

                    {/* SCORE DETAILS */}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">

                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">
                          Technical
                        </p>

                        <p className="font-bold text-blue-600 mt-1">
                          {item.technical_score}/10
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">
                          Communication
                        </p>

                        <p className="font-bold text-blue-600 mt-1">
                          {item.communication_score}/10
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">
                          Relevance
                        </p>

                        <p className="font-bold text-blue-600 mt-1">
                          {item.relevance_score}/10
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">
                          Clarity
                        </p>

                        <p className="font-bold text-blue-600 mt-1">
                          {item.clarity_score}/10
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">
                          Overall
                        </p>

                        <p className="font-bold text-green-600 mt-1">
                          {item.overall_score}/10
                        </p>
                      </div>

                    </div>

                    {/* AI FEEDBACK */}

                    {item.feedback && (

                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">

                        <p className="text-sm font-medium text-blue-800">
                          AI Feedback
                        </p>

                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          {item.feedback}
                        </p>

                      </div>

                    )}

                  </div>

                );
              }
            )

          ) : (

            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">

              <p className="text-gray-500">
                No answer evaluations are available
                for this interview yet.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* ====================================== */}
      {/* AI RECOMMENDATION */}
      {/* ====================================== */}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-8">

        <h2 className="text-xl font-semibold text-blue-800">
          ✨ AI Recommendation
        </h2>

        <p className="text-gray-700 mt-3 leading-relaxed">
          {recommendation}
        </p>

      </div>

      {/* ====================================== */}
      {/* ACTIONS */}
      {/* ====================================== */}

      <div className="mt-8 flex flex-wrap gap-4">

        <button
          onClick={() =>
            navigate("/reports")
          }
          className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          ← Back to Reports
        </button>

        <button
          onClick={() =>
            navigate("/interview-setup")
          }
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Practice Again →
        </button>

        <button
          onClick={() =>
            navigate("/")
          }
          className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Dashboard
        </button>

      </div>

    </div>
  );
}

export default Analysis;