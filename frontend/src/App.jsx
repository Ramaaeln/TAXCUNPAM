import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Login = lazy(() => import("./pages/Login"));
const Quiz = lazy(() => import("./pages/Quiz"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const CreateQuiz = lazy(() => import("./pages/admin/CreateQuiz"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CreateQuestion = lazy(() => import("./pages/admin/CreateQuestion"));
const GenerateToken = lazy(() => import("./pages/admin/GenerateToken"));
const LiveMonitor = lazy(() => import("./pages/admin/LiveMonitor"));
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import GuestAdminRoute from "./components/GuestAdminRoute";
const LeaderboardAdmin = lazy(() => import("./pages/admin/LeaderboardAdmin"));
const Participants = lazy(() => import("./pages/admin/Participants"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ReviewAnswers = lazy(() => import("./pages/admin/ReviewAnswers"));
const RecoveryAdmin = lazy(() => import("./pages/admin/RecoveryAdmin"));
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

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center" role="status">Memuat halaman...</div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}