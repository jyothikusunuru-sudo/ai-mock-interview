import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

function Reports() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH INTERVIEWS
  // ==========================================

  const fetchInterviews = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token");

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
        throw new Error(
          data.detail ||
            "Failed to fetch interviews"
        );
      }

      setInterviews(data);

    } catch (error) {
      console.error(
        "Error fetching interviews:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // ==========================================
  // SUMMARY CALCULATIONS
  // ==========================================

  const completedInterviews =
    interviews.filter(
      (interview) =>
        typeof interview.overall_score ===
        "number"
    );

  const totalInterviews =
    interviews.length;

  const averageScore = useMemo(() => {
    if (
      completedInterviews.length === 0
    ) {
      return 0;
    }

    const total =
      completedInterviews.reduce(
        (sum, interview) =>
          sum +
          Number(
            interview.overall_score || 0
          ),
        0
      );

    return Math.round(
      total /
        completedInterviews.length
    );
  }, [completedInterviews]);

  const bestScore = useMemo(() => {
    if (
      completedInterviews.length === 0
    ) {
      return 0;
    }

    return Math.max(
      ...completedInterviews.map(
        (interview) =>
          Number(
            interview.overall_score || 0
          )
      )
    );
  }, [completedInterviews]);

  // ==========================================
  // DATE FORMATTER
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // STATUS
  // ==========================================

  const getStatus = (interview) => {
    if (
      typeof interview.overall_score ===
      "number"
    ) {
      return {
        text: "Completed",
        className:
          "bg-green-50 text-green-600",
      };
    }

    return {
      text: "In Progress",
      className:
        "bg-yellow-50 text-yellow-600",
    };
  };

  // ==========================================
  // VIEW REPORT
  // ==========================================

  const handleViewReport = (interviewId) => {
    navigate(`/analysis?interviewId=${interviewId}`);
  };

  return (
    <div>

      {/* ====================================== */}
      {/* PAGE HEADING */}
      {/* ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Interview Reports
        </h1>

        <p className="text-gray-500 mt-2">
          Review your previous interview
          performance and reports.
        </p>

      </div>


      {/* ====================================== */}
      {/* SUMMARY */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* TOTAL */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Interviews
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {totalInterviews}
              </h2>

            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={22} />
            </div>

          </div>

        </div>


        {/* AVERAGE */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Average Score
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {averageScore}%
          </h2>

          <p className="text-xs text-gray-500 mt-2">
            Across completed interviews
          </p>

        </div>


        {/* BEST */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Best Score
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {bestScore}%
          </h2>

          <p className="text-xs text-gray-500 mt-2">
            Highest completed interview
          </p>

        </div>

      </div>


      {/* ====================================== */}
      {/* REPORTS HEADER */}
      {/* ====================================== */}

      <div className="mt-10 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold text-gray-800">
            Recent Reports
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Your interview history
          </p>

        </div>

        <button
          onClick={fetchInterviews}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>


      {/* ====================================== */}
      {/* LOADING */}
      {/* ====================================== */}

      {loading && (

        <div className="mt-5 bg-white border border-gray-200 rounded-xl p-8 text-center">

          <p className="text-gray-500">
            Loading interview reports...
          </p>

        </div>

      )}


      {/* ====================================== */}
      {/* EMPTY STATE */}
      {/* ====================================== */}

      {!loading &&
        interviews.length === 0 && (

          <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">

            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={28} />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-5">
              No Interview Reports Yet
            </h3>

            <p className="text-gray-500 mt-2">
              Complete your first AI mock
              interview to generate a report.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/interview-setup"
                )
              }
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start Interview →
            </button>

          </div>
        )}


      {/* ====================================== */}
      {/* REPORT LIST */}
      {/* ====================================== */}

      {!loading &&
        interviews.length > 0 && (

          <div className="mt-5 space-y-4">

            {interviews.map(
              (interview) => {

                const status =
                  getStatus(
                    interview
                  );

                return (

                  <div
                    key={interview.id}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* LEFT */}

                      <div className="flex items-start gap-4">

                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <FileText
                            size={22}
                          />
                        </div>

                        <div>

                          <h3 className="font-semibold text-lg text-gray-800">
                            {interview.role ||
                              "Interview"}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {interview.interview_type ||
                              "Unknown Type"}{" "}
                            •{" "}
                            {interview.difficulty ||
                              "Unknown Difficulty"}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(
                              interview.created_at ||
                                interview.createdAt
                            )}
                          </p>

                        </div>

                      </div>


                      {/* RIGHT */}

                      <div className="flex flex-wrap items-center gap-5">

                        {/* SCORE */}

                        <div className="text-right">

                          <p className="text-xs text-gray-500">
                            Overall Score
                          </p>

                          <p className="text-2xl font-bold text-blue-600">
                            {typeof interview.overall_score ===
                            "number"
                              ? `${Math.round(
                                  interview.overall_score
                                )}%`
                              : "--"}
                          </p>

                        </div>


                        {/* STATUS */}

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>


                        {/* VIEW */}

                        <button
                          onClick={() =>
                            handleViewReport(interview.id)
                          }
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          View Report
                          <ArrowRight
                            size={16}
                          />
                        </button>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>
        )}


      {/* ====================================== */}
      {/* START NEW INTERVIEW */}
      {/* ====================================== */}

      {!loading &&
        interviews.length > 0 && (

          <div className="mt-8 bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <h2 className="text-2xl font-bold">
                Ready for another interview?
              </h2>

              <p className="text-blue-100 mt-2">
                Practice again and improve your
                interview performance.
              </p>

            </div>

            <button
              onClick={() =>
                navigate(
                  "/interview-setup"
                )
              }
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Start Interview →
            </button>

          </div>

        )}

    </div>
  );
}

export default Reports;