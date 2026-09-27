import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Mic,
  BarChart3,
  CheckCircle,
  Clock,
  ArrowRight,
  PlayCircle,
  TrendingUp,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH USER INTERVIEWS
  // ==========================================

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://127.0.0.1:8000/interviews",
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
            data.detail || "Failed to load interviews."
          );
        }

        setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [navigate]);

  // ==========================================
  // COMPLETED INTERVIEWS
  // ==========================================

  const completedInterviews = useMemo(() => {
    return interviews.filter(
      (interview) =>
        interview.overall_score !== null &&
        interview.overall_score !== undefined
    );
  }, [interviews]);

  // ==========================================
  // IN-PROGRESS INTERVIEWS
  // ==========================================

  const inProgressInterviews = useMemo(() => {
    return interviews.filter(
      (interview) =>
        interview.overall_score === null ||
        interview.overall_score === undefined
    );
  }, [interviews]);

  // ==========================================
  // AVERAGE SCORE
  // ==========================================

  const averageScore = useMemo(() => {
    if (completedInterviews.length === 0) {
      return 0;
    }

    const total = completedInterviews.reduce(
      (sum, interview) =>
        sum + Number(interview.overall_score || 0),
      0
    );

    return Math.round(
      total / completedInterviews.length
    );
  }, [completedInterviews]);

  // ==========================================
  // BEST SCORE
  // ==========================================

  const bestScore = useMemo(() => {
    if (completedInterviews.length === 0) {
      return 0;
    }

    return Math.max(
      ...completedInterviews.map(
        (interview) =>
          Number(interview.overall_score || 0)
      )
    );
  }, [completedInterviews]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // STATUS
  // ==========================================

  const getStatus = (interview) => {
    if (
      interview.overall_score !== null &&
      interview.overall_score !== undefined
    ) {
      return "Completed";
    }

    return "In Progress";
  };

  // ==========================================
  // SCORE COLOR
  // ==========================================

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "text-green-600";
    }

    if (score >= 60) {
      return "text-blue-600";
    }

    if (score >= 40) {
      return "text-yellow-600";
    }

    return "text-red-600";
  };

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
            Loading dashboard...
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
          Unable to Load Dashboard
        </h2>

        <p className="text-gray-500 mt-2">
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-8">

      {/* ======================================
          WELCOME SECTION
      ====================================== */}

      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome Back 👋
        </h1>

        <p className="text-gray-500 mt-2">
          Track your interview practice and improve
          your performance.
        </p>
      </div>


      {/* ======================================
          STAT CARDS
      ====================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* AVERAGE SCORE */}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Average Score
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {averageScore}%
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <BarChart3 size={24} />
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">
            Based on completed interviews
          </p>

        </div>


        {/* TOTAL INTERVIEWS */}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total Interviews
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {interviews.length}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Mic size={24} />
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">
            All interview attempts
          </p>

        </div>


        {/* COMPLETED */}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Completed
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {completedInterviews.length}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle size={24} />
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">
            Fully evaluated interviews
          </p>

        </div>


        {/* BEST SCORE */}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Best Score
              </p>

              <h2
                className={`text-3xl font-bold mt-2 ${getScoreClass(
                  bestScore
                )}`}
              >
                {bestScore}%
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
              <TrendingUp size={24} />
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">
            Highest completed score
          </p>

        </div>

      </div>


      {/* ======================================
          QUICK ACTIONS
      ====================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* START INTERVIEW */}

        <div className="bg-blue-600 rounded-2xl p-7 text-white">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Mic size={25} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Start a New Interview
              </h2>

              <p className="text-blue-100 text-sm mt-1">
                Practice with an AI-powered mock interview.
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              navigate("/interview-setup")
            }
            className="mt-6 bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2"
          >
            Start Interview
            <ArrowRight size={18} />
          </button>

        </div>


        {/* VIEW REPORTS */}

        <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <BarChart3 size={25} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Review Your Performance
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Explore your previous interview reports.
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              navigate("/reports")
            }
            className="mt-6 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
          >
            View Reports
            <ArrowRight size={18} />
          </button>

        </div>

      </div>


      {/* ======================================
          RECENT INTERVIEWS
      ====================================== */}

      <div>

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Interviews
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your latest interview activity.
            </p>
          </div>

          {interviews.length > 0 && (
            <button
              onClick={() =>
                navigate("/reports")
              }
              className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
            >
              View All
              <ArrowRight size={16} />
            </button>
          )}

        </div>


        {/* NO INTERVIEWS */}

        {interviews.length === 0 ? (

          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">

            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Mic size={26} />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">
              No interviews yet
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Start your first AI mock interview to begin
              tracking your performance.
            </p>

            <button
              onClick={() =>
                navigate("/interview-setup")
              }
              className="mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
            >
              Start Your First Interview
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            {interviews
              .slice(0, 5)
              .map((interview) => {

                const completed =
                  interview.overall_score !== null &&
                  interview.overall_score !== undefined;

                const score = completed
                  ? Number(interview.overall_score)
                  : 0;

                return (
                  <div
                    key={interview.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* INTERVIEW INFO */}

                      <div className="flex items-start gap-4">

                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                            completed
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle size={22} />
                          ) : (
                            <Clock size={22} />
                          )}
                        </div>

                        <div>

                          <h3 className="font-semibold text-gray-800">
                            {interview.role}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {interview.interview_type}
                            {" • "}
                            {interview.difficulty}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(
                              interview.created_at
                            )}
                          </p>

                        </div>

                      </div>


                      {/* SCORE */}

                      <div className="flex items-center gap-8">

                        <div className="text-right">

                          <p className="text-xs text-gray-400">
                            Score
                          </p>

                          <p
                            className={`text-xl font-bold ${
                              completed
                                ? getScoreClass(score)
                                : "text-gray-400"
                            }`}
                          >
                            {completed
                              ? `${score}%`
                              : "--"}
                          </p>

                        </div>


                        {/* STATUS */}

                        <div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                              completed
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >

                            {completed ? (
                              <CheckCircle size={14} />
                            ) : (
                              <Clock size={14} />
                            )}

                            {getStatus(interview)}

                          </span>

                        </div>


                        {/* VIEW REPORT */}

                        {completed && (
                          <button
                            onClick={() =>
                              navigate(
                                `/analysis?interviewId=${interview.id}`
                              )
                            }
                            className="text-blue-600 hover:text-blue-700"
                            title="View detailed analysis"
                          >
                            <ArrowRight size={20} />
                          </button>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}

          </div>

        )}

      </div>


      {/* ======================================
          IN PROGRESS NOTICE
      ====================================== */}

      {inProgressInterviews.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">

          <div className="flex items-start gap-4">

            <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>

            <div>

              <h3 className="font-semibold text-yellow-800">
                {inProgressInterviews.length} interview
                {inProgressInterviews.length !== 1
                  ? "s"
                  : ""}{" "}
                without a completed score
              </h3>

              <p className="text-sm text-yellow-700 mt-1">
                These interviews have not received a final
                AI evaluation score yet.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Dashboard;