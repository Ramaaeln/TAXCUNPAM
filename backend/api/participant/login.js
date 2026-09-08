import express from "express";
import tokenLoginRoute from "../auth/token-login.js";

const router = express.Router();

// Forward participant login to standard auth/token-login handler
router.post("/", tokenLoginRoute);

export default router;