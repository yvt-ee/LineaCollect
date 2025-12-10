// middleware/auth.js
import "../config/dotenv.js"; // 必须最先加载
import jwt from "jsonwebtoken";

// -------------------------------------------------
// 🔐 DEBUG（保证环境变量正常加载）
// -------------------------------------------------
console.log("🔐 AUTH MIDDLEWARE — JWT_SECRET:", process.env.JWT_SECRET);

// -------------------------------------------------
// 🔐 CONSTANTS
// -------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ FATAL ERROR: Missing JWT_SECRET in .env");
  process.exit(1);
}

// -------------------------------------------------
// 🧩 EXTRACT TOKEN FROM Authorization HEADER
// -------------------------------------------------
function getToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth) return null;

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

// -------------------------------------------------
// 🔥 STRONG AUTH — Access token required
// -------------------------------------------------
export function authenticate(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  try {
    // decode {id, email, role}
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Invalid access token:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// -------------------------------------------------
// 🟦 OPTIONAL AUTH — Token exists → decode; else skip
// -------------------------------------------------
export function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.warn("⚠️ Ignored invalid optional token:", err.message);
  }

  next();
}

// -------------------------------------------------
// 🔥 ADMIN ONLY — Must be logged in & role === "admin"
// -------------------------------------------------
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
