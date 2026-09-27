import { Bell, User } from "lucide-react";
import { useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const pageTitles = {
    "/": {
      title: "AI Mock Interview",
      subtitle: "Practice. Improve. Succeed.",
    },
    "/interview-setup": {
      title: "Interview Setup",
      subtitle: "Customize your AI interview.",
    },
    "/interview": {
      title: "AI Interview",
      subtitle: "Answer questions and showcase your skills.",
    },
    "/interview-complete": {
      title: "Interview Completed",
      subtitle: "Review your interview performance.",
    },
    "/analysis": {
      title: "Interview Analysis",
      subtitle: "Understand your strengths and improvement areas.",
    },
    "/practice": {
      title: "Practice",
      subtitle: "Improve your interview skills.",
    },
    "/reports": {
      title: "Interview Reports",
      subtitle: "Review your previous interview performance.",
    },
    "/settings": {
      title: "Settings",
      subtitle: "Manage your account and preferences.",
    },
    "/ai-insights": {
      title: "AI Insights",
      subtitle: "Get personalized interview recommendations.",
    },
  };

  const currentPage = pageTitles[location.pathname] || {
    title: "AI Mock Interview",
    subtitle: "Practice. Improve. Succeed.",
  };

  const storedUser = localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">

      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {currentPage.title}
        </h2>

        <p className="text-sm text-gray-500">
          {currentPage.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-6">

        <button className="relative text-gray-600 hover:text-gray-900 transition">
          <Bell size={21} />

          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full">
          </span>
        </button>

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User size={20} />
          </div>

          <div>

            <p className="text-sm font-medium text-gray-800">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-gray-500">
              {user?.email || "Candidate"}
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;