import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // normalize email (IMPORTANT)
    email = email.toLowerCase().trim();

    // ==========================================
    // FIND USER
    // ==========================================
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role, username")
      .eq("email", email)
      .eq("role", "admin")
      .maybeSingle(); // 🔥 safer than single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================
    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ==========================================
    // JWT (IMPROVED)
    // ==========================================
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );

    // ==========================================
    // RESPONSE (CLEAN)
    // ==========================================
    return res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;