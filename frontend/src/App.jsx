import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import AdminLogin from "./pages/admin/AdminLogin";
import CreateQuiz from "./pages/admin/CreateQuiz";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateQuestion from "./pages/admin/CreateQuestion";
import GenerateToken from "./pages/admin/GenerateToken";
import LiveMonitor from "./pages/admin/LiveMonitor";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import GuestAdminRoute from "./components/GuestAdminRoute";
import LeaderboardAdmin from "./pages/admin/LeaderboardAdmin";
import Participants from "./pages/admin/Participants";
import NotFound from "./pages/NotFound";
import ReviewAnswers from "./pages/admin/ReviewAnswers";
import RecoveryAdmin from "./pages/admin/RecoveryAdmin";
import ScrollToTop from "./components/ScrollTop"; // 1. Import komponen ScrollToTop

function ProtectedQuizRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  const quizId = localStorage.getItem("quizId");
  const isFinished = sessionStorage.getItem("quizAutoSubmitted");

  if (!token || !quizId || isFinished === "true") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 2. Diletakkan di sini agar melayang di atas semua halaman */}
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/quiz"
          element={
            <ProtectedQuizRoute>
              <Quiz />
            </ProtectedQuizRoute>
          }
        />

        <Route path="/result" element={<Navigate to="/" replace />} />

        <Route
          path="/utcbt-internal"
          element={
            <GuestAdminRoute>
              <AdminLogin />
            </GuestAdminRoute>
          }
        />

        <Route
          path="/utcbt-internal/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/create-quiz"
          element={
            <ProtectedAdminRoute>
              <CreateQuiz />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/questions"
          element={
            <ProtectedAdminRoute>
              <CreateQuestion />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/tokens"
          element={
            <ProtectedAdminRoute>
              <GenerateToken />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/recovery"
          element={
            <ProtectedAdminRoute>
              <RecoveryAdmin />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/live-monitor"
          element={
            <ProtectedAdminRoute>
              <LiveMonitor />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/leaderboard"
          element={
            <ProtectedAdminRoute>
              <LeaderboardAdmin />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/participants"
          element={
            <ProtectedAdminRoute>
              <Participants />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/utcbt-internal/review-answers/:attemptId"
          element={
            <ProtectedAdminRoute>
              <ReviewAnswers />
            </ProtectedAdminRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}