import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";
import compression from "compression";

import { pathToFileURL } from "node:url";

// Import Auth & Admin Routes
import tokenLoginRoute from "./auth/token-login.js";
import participantLoginRoute from "./participant/login.js";
import adminLoginRoute from "./admin/login.js";
import generateTokenRoute from "./admin/generate-token.js";
import resetSessionRoute from "./admin/reset-session.js";
import createQuizRoute from "./admin/create-quiz.js";
import createQuestionRoute from "./admin/create-question.js";
import getQuizzesRoute from "./admin/get-quizzes.js";
import liveMonitorRoute from "./admin/live-monitor.js";
import dashboardStats from "./admin/dashboard-stats.js";
import getQuestionsRoute from "./admin/get-questions.js";
import deleteQuestion from "./admin/delete-question.js";
import updateQuestion from "./admin/update-question.js";
import reviewAnswersRoute from "./admin/review-answers.js";

// Import Quiz & Leaderboard Routes
import questionRoute from "./quiz/questions.js";
import autosaveRoute from "./quiz/autosave.js";
import submitRoute from "./quiz/submit.js";
import violationRoute from "./quiz/violation.js";
import quizInfoRoute from "./quiz/info.js";
import heartbeatRoute from "./quiz/heartbeat.js";
import recoverRoute from "./quiz/recover.js";
import resultRoute from "./quiz/result.js";
import leaderboardRoute from "./leaderboard/index.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, 
  }),
);

// PEMBERSIHAN / NORMALISASI CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin === o.replace(/\/$/, ""))) {
        callback(null, true);
      } else {
        const error = new Error("Origin not allowed");
        error.status = 403;
        callback(error);
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer /, "");
      const claims = jwt.verify(token, process.env.JWT_SECRET);
      if (claims.role === "participant" && claims.sessionId) return `participant:${claims.sessionId}`;
      if (claims.role === "admin" && claims.id) return `admin:${claims.id}`;
    } catch { /* Unauthenticated traffic shares an IP-based limit. */ }
    return ipKeyGenerator(req.ip);
  },
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari IP ini, silakan coba beberapa saat lagi.",
  },
});

app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login, coba lagi dalam 10 menit.",
  },
});

app.use("/api/admin/login", loginLimiter);
app.use("/api/auth/token-login", loginLimiter);
app.use("/api/participant/login", loginLimiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
  });
});

// AUTH ROUTES
app.use("/api/auth/token-login", tokenLoginRoute);
app.use("/api/participant/login", participantLoginRoute);
app.use("/api/admin/login", adminLoginRoute);

// ADMIN ROUTES
app.use("/api/admin/generate-token", generateTokenRoute);
app.use("/api/admin/reset-session", resetSessionRoute);
app.use("/api/admin/create-quiz", createQuizRoute);
app.use("/api/admin/create-question", createQuestionRoute);
app.use("/api/admin/quizzes", getQuizzesRoute);
app.use("/api/admin/live-monitor", liveMonitorRoute);
app.use("/api/admin/dashboard-stats", dashboardStats);
app.use("/api/admin/questions", getQuestionsRoute);
app.use("/api/admin/delete-question", deleteQuestion);
app.use("/api/admin/update-question", updateQuestion);
app.use("/api/admin/review-answers", reviewAnswersRoute);

// QUIZ ROUTES
app.use("/api/quiz/questions", questionRoute);
app.use("/api/quiz/autosave", autosaveRoute);
app.use("/api/quiz/submit", submitRoute);
app.use("/api/quiz/violation", violationRoute);
app.use("/api/quiz/info", quizInfoRoute);
app.use("/api/quiz/heartbeat", heartbeatRoute);
app.use("/api/quiz/recover", recoverRoute);
app.use("/api/quiz/result", resultRoute);

// LEADERBOARD ROUTES
app.use("/api/leaderboard", leaderboardRoute);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (!err.status || err.status >= 500) console.error("GLOBAL ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

const PORT = process.env.PORT || 3000;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
