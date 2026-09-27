import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      console.log("Forgot Password Response:", data);

      if (!response.ok) {
        alert(data.detail || "Unable to process request");
        return;
      }

      alert(
        data.message ||
        "Password reset link generated successfully"
      );

      if (data.reset_token) {
        navigate(
          `/reset-password?token=${encodeURIComponent(
            data.reset_token
          )}`
        );
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);

      alert(
        "Unable to connect to the backend. Check whether FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        {/* Header */}
        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Forgot Password?
          </h1>

          <p className="text-gray-500 mt-2">
            Enter your registered email to reset your password
          </p>

        </div>

        {/* Form */}
        <form onSubmit={handleForgotPassword}>

          {/* Email */}
          <div className="mb-6">

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Send Reset Link"}
          </button>

        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-blue-600 font-medium hover:text-blue-800"
          >
            ← Back to Login
          </button>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;