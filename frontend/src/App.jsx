import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Leaderboard from "./pages/Leaderboard";
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
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
        <Route path="/leaderboard" element={<Leaderboard />} />

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
        <Route path="/admin/create-quiz" element={<CreateQuiz />} />
        <Route path="/admin/questions" element={<CreateQuestion />} />
        <Route path="/admin/tokens" element={<GenerateToken />} />
        <Route path="/admin/live-monitor" element={<LiveMonitor />} />
        <Route path="/admin/leaderboard" element={<LeaderboardAdmin />} />
        <Route path="/admin/participants" element={<Participants/>} />
      </Routes>
    </BrowserRouter>
  );
}
