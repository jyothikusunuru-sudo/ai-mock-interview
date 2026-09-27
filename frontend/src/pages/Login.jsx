import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      console.log("LOGIN RESPONSE:", response.status, data);

      if (!response.ok) {
        alert(data.detail || "Login failed");
        return;
      }

      // Save login information
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data));

      alert("Login successful!");

      // Go to dashboard
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the backend.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to continue your interview practice
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

        </form>

        {/* Register */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-blue-600 font-medium hover:text-blue-800"
          >
            Create Account
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;