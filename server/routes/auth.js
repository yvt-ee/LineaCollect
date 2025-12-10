import express from "express";
import { register, login, refresh, me } from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// ⭐ 当前用户（必须带 access token）
router.get("/me", authenticate, me);

// logout
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

export default router;
