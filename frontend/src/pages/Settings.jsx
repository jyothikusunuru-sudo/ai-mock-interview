import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Settings() {

  // ==========================================
  // PROFILE
  // ==========================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // ==========================================
  // PREFERENCES
  // ==========================================

  const [aiFeedback, setAiFeedback] = useState(true);
  const [interviewTimer, setInterviewTimer] = useState(true);

  // ==========================================
  // UI STATE
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // TOKEN
  // ==========================================

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  const loadProfile = async () => {

    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    try {

      const response = await fetch(
        `${API_URL}/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        throw new Error(
          "Failed to load profile."
        );
      }

      const data = await response.json();

      setName(data.name || "");
      setEmail(data.email || "");

    } catch (err) {

      console.error(
        "Profile loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load profile."
      );

    } finally {

      setLoading(false);
    }
  };

  // ==========================================
  // LOAD SAVED PREFERENCES
  // ==========================================

  const loadPreferences = () => {

    const savedAiFeedback =
      localStorage.getItem(
        "aiFeedback"
      );

    const savedInterviewTimer =
      localStorage.getItem(
        "interviewTimer"
      );

    if (savedAiFeedback !== null) {

      setAiFeedback(
        savedAiFeedback === "true"
      );
    }

    if (savedInterviewTimer !== null) {

      setInterviewTimer(
        savedInterviewTimer === "true"
      );
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    loadProfile();
    loadPreferences();

  }, []);

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const handleSave = async () => {

    setSaving(true);
    setMessage("");
    setError("");

    try {

      // --------------------------------------
      // SAVE PREFERENCES
      // --------------------------------------

      localStorage.setItem(
        "aiFeedback",
        String(aiFeedback)
      );

      localStorage.setItem(
        "interviewTimer",
        String(interviewTimer)
      );

      // --------------------------------------
      // SAVE USER INFORMATION LOCALLY
      // --------------------------------------

      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {

        try {

          const user =
            JSON.parse(storedUser);

          user.name = name;
          user.email = email;

          localStorage.setItem(
            "user",
            JSON.stringify(user)
          );

        } catch (err) {

          console.error(
            "User localStorage update error:",
            err
          );
        }
      }

      setMessage(
        "Settings saved successfully!"
      );

    } catch (err) {

      console.error(
        "Settings save error:",
        err
      );

      setError(
        "Failed to save settings."
      );

    } finally {

      setSaving(false);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {

    return (
      <div className="flex items-center justify-center py-20">

        <div className="text-center">

          <Loader2
            size={40}
            className="animate-spin text-blue-600 mx-auto"
          />

          <p className="text-gray-500 mt-4">
            Loading your settings...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div>

      {/* ======================================
          PAGE HEADING
      ====================================== */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Settings
        </h1>

        <p className="text-gray-500 mt-2">
          Manage your account and interview
          preferences.
        </p>

      </div>


      {/* ======================================
          SUCCESS MESSAGE
      ====================================== */}

      {message && (

        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">

          <div className="flex items-center gap-2 text-green-700">

            <CheckCircle size={20} />

            <p className="font-medium">
              {message}
            </p>

          </div>

        </div>

      )}


      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (

        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <p className="text-red-700 font-medium">
            {error}
          </p>

        </div>

      )}


      {/* ======================================
          PROFILE SETTINGS
      ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          Profile
        </h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* NAME */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          {/* EMAIL */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed"
            />

            <p className="text-xs text-gray-400 mt-2">
              Email cannot be changed here.
            </p>

          </div>

        </div>

      </div>


      {/* ======================================
          INTERVIEW PREFERENCES
      ====================================== */}

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-800">
          Interview Preferences
        </h2>

        <div className="mt-6 space-y-5">

          {/* AI FEEDBACK */}

          <div className="flex items-center justify-between gap-6">

            <div>

              <p className="font-medium text-gray-800">
                AI Feedback
              </p>

              <p className="text-sm text-gray-500">
                Receive detailed AI feedback after
                every interview.
              </p>

            </div>

            <input
              type="checkbox"
              checked={aiFeedback}
              onChange={(e) =>
                setAiFeedback(
                  e.target.checked
                )
              }
              className="w-5 h-5 cursor-pointer"
            />

          </div>


          {/* INTERVIEW TIMER */}

          <div className="flex items-center justify-between gap-6">

            <div>

              <p className="font-medium text-gray-800">
                Interview Timer
              </p>

              <p className="text-sm text-gray-500">
                Show a timer while answering
                questions.
              </p>

            </div>

            <input
              type="checkbox"
              checked={interviewTimer}
              onChange={(e) =>
                setInterviewTimer(
                  e.target.checked
                )
              }
              className="w-5 h-5 cursor-pointer"
            />

          </div>

        </div>

      </div>


      {/* ======================================
          SAVE BUTTON
      ====================================== */}

      <div className="mt-8">

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
        >

          {saving ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Saving...

            </>
          ) : (
            "Save Changes"
          )}

        </button>

      </div>

    </div>
  );
}

export default Settings;