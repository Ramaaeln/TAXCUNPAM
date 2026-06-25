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
          path="/admin"
          element={
            <GuestAdminRoute>
              <AdminLogin />
            </GuestAdminRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/create-quiz"
          element={
            <ProtectedAdminRoute>
              <CreateQuiz />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedAdminRoute>
              <CreateQuestion />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/tokens"
          element={
            <ProtectedAdminRoute>
              <GenerateToken />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/live-monitor"
          element={
            <ProtectedAdminRoute>
              <LiveMonitor />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/leaderboard"
          element={
            <ProtectedAdminRoute>
              <LeaderboardAdmin />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/participants"
          element={
            <ProtectedAdminRoute>
              <Participants />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/review-answers/:attemptId"
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
