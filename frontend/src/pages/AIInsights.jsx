import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function AIInsights() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD LATEST COMPLETED INTERVIEW
  // ==========================================

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login");
          return;
        }

        // --------------------------------------
        // GET ALL INTERVIEWS
        // --------------------------------------

        const interviewsResponse = await fetch(
          "http://127.0.0.1:8000/interviews",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const interviewsData = await interviewsResponse.json();

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

        const allInterviews = Array.isArray(interviewsData)
          ? interviewsData
          : [];

        setInterviews(allInterviews);

        // --------------------------------------
        // FIND LATEST COMPLETED INTERVIEW
        // --------------------------------------

        const completedInterviews = allInterviews.filter(
          (interview) =>
            interview.overall_score !== null &&
            interview.overall_score !== undefined
        );

        if (completedInterviews.length === 0) {
          setReport(null);
          return;
        }

        const latestCompleted =
          completedInterviews[0];

        // --------------------------------------
        // GET REPORT
        // --------------------------------------

        const reportResponse = await fetch(
          `http://127.0.0.1:8000/interviews/${latestCompleted.id}/report`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const reportData = await reportResponse.json();

        if (!reportResponse.ok) {
          throw new Error(
            reportData.detail ||
              "Failed to load interview report."
          );
        }

        setReport(reportData);
      } catch (err) {
        console.error(
          "Error loading AI insights:",
          err
        );

        setError(
          err.message ||
            "Unable to load AI insights."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [navigate]);

  // ==========================================
  // EXTRACT REPORT DATA
  // ==========================================

  const interview = report?.interview || report;

  const answers = Array.isArray(report?.answers)
    ? report.answers
    : [];

  // ==========================================
  // CALCULATE SCORES
  // ==========================================

  const scores = useMemo(() => {
    if (!answers.length) {
      return {
        technical: 0,
        communication: 0,
        relevance: 0,
        clarity: 0,
        overall: Number(
          interview?.overall_score || 0
        ),
      };
    }

    const getAverage = (field) => {
      const values = answers
        .map((item) => {
          const evaluation =
            item.evaluation || item;

          return Number(
            evaluation?.[field]
          );
        })
        .filter((value) =>
          Number.isFinite(value)
        );

      if (values.length === 0) {
        return 0;
      }

      return (
        values.reduce(
          (sum, value) => sum + value,
          0
        ) / values.length
      );
    };

    return {
      technical: getAverage(
        "technical_score"
      ),
      communication: getAverage(
        "communication_score"
      ),
      relevance: getAverage(
        "relevance_score"
      ),
      clarity: getAverage(
        "clarity_score"
      ),
      overall: Number(
        interview?.overall_score || 0
      ),
    };
  }, [answers, interview]);

  // ==========================================
  // CONVERT 0-10 SCORE TO PERCENTAGE
  // ==========================================

  const percentage = (score) => {
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore)) {
      return 0;
    }

    if (numericScore > 10) {
      return Math.round(numericScore);
    }

    return Math.round(numericScore * 10);
  };

  const technicalPercentage = percentage(
    scores.technical
  );

  const communicationPercentage = percentage(
    scores.communication
  );

  const relevancePercentage = percentage(
    scores.relevance
  );

  const clarityPercentage = percentage(
    scores.clarity
  );

  const overallPercentage = percentage(
    scores.overall
  );

  // ==========================================
  // FIND STRENGTHS
  // ==========================================

  const strengths = useMemo(() => {
    const result = [];

    if (technicalPercentage >= 70) {
      result.push(
        "Good technical understanding"
      );
    }

    if (relevancePercentage >= 70) {
      result.push(
        "Answers were relevant to the questions"
      );
    }

    if (communicationPercentage >= 70) {
      result.push(
        "Good communication during answers"
      );
    }

    if (clarityPercentage >= 70) {
      result.push(
        "Clear and understandable explanations"
      );
    }

    if (result.length === 0) {
      result.push(
        "You attempted all interview questions"
      );

      if (relevancePercentage >= 50) {
        result.push(
          "Your answers generally addressed the questions"
        );
      }

      if (technicalPercentage >= 50) {
        result.push(
          "You demonstrated some technical understanding"
        );
      }
    }

    return result.slice(0, 4);
  }, [
    technicalPercentage,
    communicationPercentage,
    relevancePercentage,
    clarityPercentage,
  ]);

  // ==========================================
  // FIND FOCUS AREAS
  // ==========================================

  const focusAreas = useMemo(() => {
    const result = [];

    if (technicalPercentage < 70) {
      result.push(
        "Strengthen your technical concepts"
      );
    }

    if (communicationPercentage < 70) {
      result.push(
        "Improve communication while answering"
      );
    }

    if (relevancePercentage < 70) {
      result.push(
        "Keep answers more directly focused on the question"
      );
    }

    if (clarityPercentage < 70) {
      result.push(
        "Improve explanation clarity and answer structure"
      );
    }

    if (result.length === 0) {
      result.push(
        "Continue practicing with more challenging questions"
      );

      result.push(
        "Add practical examples to your answers"
      );
    }

    return result.slice(0, 4);
  }, [
    technicalPercentage,
    communicationPercentage,
    relevancePercentage,
    clarityPercentage,
  ]);

  // ==========================================
  // RECOMMENDED PRACTICE
  // ==========================================

  const recommendations = useMemo(() => {
    const areas = [];

    if (technicalPercentage < 70) {
      areas.push({
        title: "Technical Fundamentals",
        description:
          "Practice core concepts related to your selected job role.",
      });
    }

    if (communicationPercentage < 70) {
      areas.push({
        title: "Communication",
        description:
          "Practice structured, concise, and professional interview answers.",
      });
    }

    if (clarityPercentage < 70) {
      areas.push({
        title: "Answer Structure",
        description:
          "Practice explaining answers step-by-step with clear examples.",
      });
    }

    if (relevancePercentage < 70) {
      areas.push({
        title: "Question Relevance",
        description:
          "Practice identifying the key requirement of each interview question.",
      });
    }

    // --------------------------------------
    // Fallback recommendations
    // --------------------------------------

    if (areas.length === 0) {
      areas.push(
        {
          title: "Backend APIs",
          description:
            "REST APIs, HTTP methods, authentication",
        },
        {
          title: "SQL",
          description:
            "Joins, grouping, subqueries, optimization",
        },
        {
          title: "Behavioral Questions",
          description:
            "Structured answers using practical examples",
        }
      );
    }

    return areas.slice(0, 3);
  }, [
    technicalPercentage,
    communicationPercentage,
    relevancePercentage,
    clarityPercentage,
  ]);

  // ==========================================
  // MAIN MESSAGE
  // ==========================================

  const progressMessage = useMemo(() => {
    if (overallPercentage >= 80) {
      return "Your interview performance is strong. Continue practicing with more challenging questions and maintain structured answers.";
    }

    if (overallPercentage >= 60) {
      return "Your interview performance shows a good foundation. Focus on your weaker areas and continue practicing structured answers.";
    }

    return "Your interview results show several areas to improve. Focus on technical understanding, communication, and clear answer structure.";
  }, [overallPercentage]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto">
          </div>

          <p className="text-gray-500 mt-4">
            Analyzing your interview performance...
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
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">

        <h2 className="text-xl font-semibold text-red-600">
          Unable to Load AI Insights
        </h2>

        <p className="text-gray-500 mt-2">
          {error}
        </p>

        <button
          onClick={() =>
            window.location.reload()
          }
          className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>

      </div>
    );
  }

  // ==========================================
  // NO COMPLETED INTERVIEW
  // ==========================================

  if (!report) {
    return (
      <div>

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            AI Insights ✨
          </h1>

          <p className="text-gray-500 mt-2">
            Personalized insights based on your interview
            performance.
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">

          <div className="text-5xl">
            ✨
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mt-5">
            Complete an interview first
          </h2>

          <p className="text-gray-500 mt-2">
            Complete your first AI mock interview to
            receive personalized insights.
          </p>

          <button
            onClick={() =>
              navigate("/interview-setup")
            }
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Start Interview →
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div>

      {/* ======================================
          PAGE HEADING
      ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          AI Insights ✨
        </h1>

        <p className="text-gray-500 mt-2">
          Personalized insights based on your interview
          performance.
        </p>

      </div>


      {/* ======================================
          MAIN INSIGHT
      ====================================== */}

      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-sm">

        <div className="flex items-start gap-4">

          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
            ✨
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              Your Interview Performance
            </h2>

            <p className="text-blue-100 mt-2 leading-relaxed">
              {progressMessage}
            </p>

          </div>

        </div>

      </div>


      {/* ======================================
          SCORE SUMMARY
      ====================================== */}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Overall
          </p>

          <p className="text-2xl font-bold text-blue-600 mt-1">
            {overallPercentage}%
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Technical
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {technicalPercentage}%
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Communication
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {communicationPercentage}%
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Relevance
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {relevancePercentage}%
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Clarity
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {clarityPercentage}%
          </p>
        </div>

      </div>


      {/* ======================================
          INSIGHTS
      ====================================== */}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* STRENGTHS */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              💪
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              Your Strengths
            </h2>

          </div>

          <ul className="mt-5 space-y-3 text-gray-600">

            {strengths.map(
              (strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="text-green-600 font-semibold">
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


        {/* FOCUS AREAS */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              🎯
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              Focus Areas
            </h2>

          </div>

          <ul className="mt-5 space-y-3 text-gray-600">

            {focusAreas.map(
              (area, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="text-orange-600 font-semibold">
                    →
                  </span>

                  <span>
                    {area}
                  </span>
                </li>
              )
            )}

          </ul>

        </div>

      </div>


      {/* ======================================
          RECOMMENDED PRACTICE
      ====================================== */}

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          Recommended Practice
        </h2>

        <p className="text-gray-500 mt-2">
          Based on your latest interview performance,
          focus on these areas:
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

          {recommendations.map(
            (recommendation, index) => (

              <div
                key={index}
                className="border border-gray-200 rounded-xl p-5"
              >

                <p className="text-sm text-gray-500">
                  Priority {index + 1}
                </p>

                <h3 className="font-semibold text-gray-800 mt-1">
                  {recommendation.title}
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  {recommendation.description}
                </p>

              </div>

            )
          )}

        </div>

      </div>


      {/* ======================================
          VIEW LATEST ANALYSIS
      ====================================== */}

      {interview?.id && (
        <div className="mt-8 flex justify-center">

          <button
            onClick={() =>
              navigate(
                `/analysis?interviewId=${interview.id}`
              )
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Detailed Analysis →
          </button>

        </div>
      )}

    </div>
  );
}

export default AIInsights;