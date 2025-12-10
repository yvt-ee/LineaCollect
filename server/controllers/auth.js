import bcrypt from "bcrypt";
import { pool } from "../config/database.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../config/auth.js";

const SALT_ROUNDS = 10;
const tempPasswordResets = {};

/* ============================================================
   Helper — sanitize user object
============================================================ */
function cleanUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active ?? true,
  };
}

/* ============================================================
   REGISTER
============================================================ */
export const register = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email & password required" });
  }

  try {
    const exists = await pool.query(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);

    if (exists.rowCount > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'user', true)
      RETURNING id, name, email, role, is_active
    `,
      [name || null, email, password_hash]
    );

    const user = cleanUser(rows[0]);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
    `,
      [user.id, refreshToken, req.headers["user-agent"], req.ip]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(201).json({ user, accessToken });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   LOGIN
============================================================ */
export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email & password required" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT id, name, email, password_hash, role, is_active
      FROM users WHERE email = $1
    `,
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const userRow = rows[0];

    if (!userRow.is_active)
      return res.status(403).json({ error: "Account disabled" });

    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const user = cleanUser(userRow);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
    `,
      [user.id, refreshToken, req.headers["user-agent"], req.ip]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({ user, accessToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   REFRESH TOKEN (ROTATION)
============================================================ */
export const refresh = async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const payload = verifyRefreshToken(oldToken);

    const check = await pool.query(
      `SELECT id FROM refresh_tokens WHERE token = $1 AND revoked_at IS NULL`,
      [oldToken]
    );
    if (check.rowCount === 0)
      return res.status(403).json({ error: "Refresh token revoked" });

    const result = await pool.query(
      `SELECT id, name, email, role, is_active FROM users WHERE id = $1`,
      [payload.id]
    );
    const user = cleanUser(result.rows[0]);

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`,
      [oldToken]
    );

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
    `,
      [user.id, newRefreshToken, req.headers["user-agent"], req.ip]
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({ accessToken: newAccessToken, user });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

/* ============================================================
   CHANGE PASSWORD - REQUEST CODE
============================================================ */
export const requestPasswordChange = async (req, res) => {
  const userId = req.user.id;
  const { new_password } = req.body;

  if (!new_password) {
    return res.status(400).json({ error: "New password required" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);

  tempPasswordResets[userId] = {
    code,
    newPasswordHash: newHash,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  const result = await pool.query(
    `SELECT email FROM users WHERE id = $1`,
    [userId]
  );
  console.log(`📧 Password reset code for ${result.rows[0].email}:`, code);

  res.json({ message: "Verification code sent." });
};

/* ============================================================
   CHANGE PASSWORD - CONFIRM CODE
============================================================ */
export const confirmPasswordChange = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;

  const data = tempPasswordResets[userId];

  if (!data) {
    return res.status(400).json({ error: "No pending reset." });
  }

  if (Date.now() > data.expiresAt) {
    delete tempPasswordResets[userId];
    return res.status(400).json({ error: "Code expired." });
  }

  if (data.code !== code) {
    return res.status(400).json({ error: "Invalid code." });
  }

  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2`,
    [data.newPasswordHash, userId]
  );

  delete tempPasswordResets[userId];

  res.json({ message: "Password changed." });
};

/* ============================================================
   GET CURRENT USER
============================================================ */
export const me = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active FROM users WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: rows[0] });

  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to load user" });
  }
};
