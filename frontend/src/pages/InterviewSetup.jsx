import { useState } from "react";
import { useNavigate } from "react-router-dom";

function InterviewSetup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const handleStartInterview = async () => {
    if (!role || !experience || !interviewType || !difficulty) {
      alert("Please select all interview options.");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        alert("Please login again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/interviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: role,
            experience: experience,
            interview_type: interviewType,
            difficulty: difficulty,
            total_questions: 5,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to create interview.");
        return;
      }

      navigate("/interview", {
        state: {
          role,
          experience,
          interviewType,
          difficulty,
          interviewId: data.interview_id,
        },
      });

    } catch (error) {
      console.error("Error creating interview:", error);
      alert("Unable to connect to the backend.");
    }
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Setup Your Interview
        </h1>

        <p className="text-gray-500 mt-2">
          Customize your interview before you begin.
        </p>
      </div>

      {/* Setup Card */}
      <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        {/* Job Role */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a role</option>

            <option value="Python Backend Developer">
              Python Backend Developer
            </option>

            <option value="JavaScript Backend Developer">
              JavaScript Backend Developer
            </option>

            <option value="Full Stack Developer">
              Full Stack Developer
            </option>

            <option value="Software Engineer">
              Software Engineer
            </option>

            <option value="Data Analyst">
              Data Analyst
            </option>
          </select>
        </div>

        {/* Experience */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>

          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select experience level</option>

            <option value="Fresher">
              Fresher
            </option>

            <option value="0-2 Years">
              0–2 Years
            </option>

            <option value="2-5 Years">
              2–5 Years
            </option>

            <option value="5+ Years">
              5+ Years
            </option>
          </select>
        </div>

        {/* Interview Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interview Type
          </label>

          <select
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select interview type</option>

            <option value="Technical">
              Technical
            </option>

            <option value="Behavioral">
              Behavioral
            </option>

            <option value="Mixed">
              Mixed
            </option>
          </select>
        </div>

        {/* Difficulty */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select difficulty</option>

            <option value="Easy">
              Easy
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Hard">
              Hard
            </option>
          </select>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartInterview}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Start AI Interview →
        </button>

      </div>
    </div>
  );
}

export default InterviewSetup;