import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

import { supabase } from "./lib/supabase.js";



import tokenLoginRoute from "./auth/token-login.js";
import participantLoginRoute from "./participant/login.js";
import adminLoginRoute from "./admin/login.js";
import generateTokenRoute from "./admin/generate-token.js";
import createQuizRoute from "./admin/create-quiz.js";
import createQuestionRoute from "./admin/create-question.js";
import getQuizzesRoute from "./admin/get-quizzes.js";
import questionRoute from "./quiz/questions.js";
import autosaveRoute from "./quiz/autosave.js";
import submitRoute from "./quiz/submit.js";
import violationRoute from "./quiz/violation.js";
import quizInfoRoute from "./quiz/info.js";
import leaderboardRoute from "./leaderboard/index.js";
import recoverRoute from "./quiz/recover.js";
import heartbeatRoute from "./quiz/heartbeat.js";
import liveMonitorRoute from "./admin/live-monitor.js";
import resultRoute from "./quiz/result.js";
import dashboardStats from "./admin/dashboard-stats.js";
import getQuestionsRoute from "./admin/get-questions.js";
import deleteQuestion from "./admin/delete-question.js";
import updateQuestion from "./admin/update-question.js";

const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, 
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL.filter(Boolean),
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests",
  },
});

app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts",
  },
});

app.use("/api/admin/login", loginLimiter);
app.use("/api/auth/token-login", loginLimiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase.from("quizzes").select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.use("/api/auth/token-login", tokenLoginRoute);
app.use("/api/participant/login", participantLoginRoute);
app.use("/api/admin/login", adminLoginRoute);

app.use("/api/admin/generate-token", generateTokenRoute);
app.use("/api/admin/create-quiz", createQuizRoute);
app.use("/api/admin/create-question", createQuestionRoute);
app.use("/api/admin/quizzes", getQuizzesRoute);
app.use("/api/admin/live-monitor", liveMonitorRoute);
app.use("/api/admin/dashboard-stats", dashboardStats);
app.use("/api/admin/questions",getQuestionsRoute,);
app.use("/api/admin/delete-question",deleteQuestion);
app.use("/api/admin/update-question",updateQuestion);

app.use("/api/quiz/questions", questionRoute);
app.use("/api/quiz/autosave", autosaveRoute);
app.use("/api/quiz/submit", submitRoute);
app.use("/api/quiz/violation", violationRoute);
app.use("/api/quiz/info", quizInfoRoute);
app.use("/api/quiz/heartbeat", heartbeatRoute);
app.use("/api/quiz/recover", recoverRoute);
app.use("/api/quiz/result", resultRoute);

app.use("/api/leaderboard", leaderboardRoute);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
