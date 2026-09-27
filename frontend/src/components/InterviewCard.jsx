import { useNavigate } from "react-router-dom";
import { Mic, ArrowRight } from "lucide-react";

function InterviewCard({ role, type, score, status }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mic size={22} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {role}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {type}
            </p>
          </div>

        </div>

        <div className="text-right">

          <p className="text-2xl font-bold text-blue-600">
            {score}%
          </p>

          <span className="inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-green-600">
            {status}
          </span>

        </div>

      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">

        <button
          onClick={() => navigate("/analysis")}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          View Analysis
          <ArrowRight size={16} />
        </button>

      </div>

    </div>
  );
}

export default InterviewCard;