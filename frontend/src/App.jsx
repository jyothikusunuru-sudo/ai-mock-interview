import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import InterviewSetup from "./pages/InterviewSetup";
import Interview from "./pages/Interview";
import InterviewComplete from "./pages/InterviewComplete";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Practice from "./pages/Practice";
import AIInsights from "./pages/AIInsights";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./pages/ResetPassword";



function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      <Sidebar />

      <div className="flex-1 min-w-0">

        <Navbar />

        <main className="p-4 md:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}


function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            PUBLIC PAGES
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />




        {/* =========================
            PROTECTED PAGES
        ========================== */}

        <Route
          path="/"
          element={
            <ProtectedPage>
              <Dashboard />
            </ProtectedPage>
          }
        />

        <Route
          path="/interview-setup"
          element={
            <ProtectedPage>
              <InterviewSetup />
            </ProtectedPage>
          }
        />

        <Route
          path="/interview"
          element={
            <ProtectedPage>
              <Interview />
            </ProtectedPage>
          }
        />

        <Route
          path="/interview-complete"
          element={
            <ProtectedPage>
              <InterviewComplete />
            </ProtectedPage>
          }
        />

        <Route
          path="/analysis"
          element={
            <ProtectedPage>
              <Analysis />
            </ProtectedPage>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedPage>
              <Reports />
            </ProtectedPage>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedPage>
              <Settings />
            </ProtectedPage>
          }
        />

        <Route
          path="/practice"
          element={
            <ProtectedPage>
              <Practice />
            </ProtectedPage>
          }
        />

        <Route
          path="/ai-insights"
          element={
            <ProtectedPage>
              <AIInsights />
            </ProtectedPage>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;