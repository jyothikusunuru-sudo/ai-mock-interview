import { useNavigate, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Mic,
  BarChart3,
  Sparkles,
  PlayCircle,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-[#242424] text-white flex flex-col">

      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold">
          InterviewAI
        </h1>

        <p className="text-xs text-gray-400 mt-1">
          AI-Powered Interview Platform
        </p>
      </div>

      <nav className="flex-1 px-4">

        <p className="text-xs text-gray-400 uppercase px-3 mb-4">
          Main Menu
        </p>

        <div className="space-y-2">

          <button
            onClick={() => navigate("/")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate("/interview-setup")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/interview-setup" ||
              location.pathname === "/interview"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Mic size={20} />
            <span>Interviews</span>
          </button>

          <button
            onClick={() => navigate("/analysis")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/analysis"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <BarChart3 size={20} />
            <span>Analysis</span>
          </button>

          <button
            onClick={() => navigate("/ai-insights")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/ai-insights"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Sparkles size={20} />
            <span>AI Insights</span>
          </button>

          <button
            onClick={() => navigate("/practice")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/practice"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <PlayCircle size={20} />
            <span>Practice</span>
          </button>

          <button
            onClick={() => navigate("/reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/reports"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <FileText size={20} />
            <span>Reports</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              location.pathname === "/settings"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>

        </div>
      </nav>

      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;