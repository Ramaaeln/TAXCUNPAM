import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";

export async function verifyParticipant(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil sessionId baik dalam format camelCase maupun snake_case
    const sessionId = decoded.sessionId || decoded.session_id;
    const attemptId = decoded.attemptId || decoded.attempt_id;
    const quizId = decoded.quizId || decoded.quiz_id;
    if (decoded.role !== "participant" || !sessionId || !attemptId || !quizId) {
      return res.status(401).json({ success: false, message: "Invalid participant token" });
    }

    // Verifikasi keaktifan session di database
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("participant_sessions")
        .select("is_active, attempt_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessionError) return res.status(503).json({ success: false, message: "Session verification unavailable. Please retry." });
      if (!session || session.attempt_id !== attemptId) {
        return res.status(401).json({ success: false, message: "Invalid participant session" });
      }

      // Pengecualian khusus: Izinkan akses ke endpoint /quiz/result meskipun session sudah non-aktif
      const isResultEndpoint = req.originalUrl.includes("/quiz/result");

      if (!isResultEndpoint && (!session || !session.is_active)) {
        return res.status(401).json({
          success: false,
          message: "Sesi Anda telah diakhiri atau digantikan di perangkat lain.",
        });
      }
    }

    // Standardisasi req.user agar selalu menyediakan data yang konsisten
    req.user = {
      ...decoded,
      sessionId: sessionId,
      attemptId,
      quizId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau telah kadaluwarsa",
    });
  }
}

export function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}
