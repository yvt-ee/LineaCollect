// controllers/users.js
import { pool } from "../config/database.js";

/* ============================================================
   👤 GET CURRENT USER PROFILE
   ============================================================ */
export const getCurrentUser = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   🛡 ADMIN: GET ALL USERS
   ============================================================ */
export const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active 
       FROM users
       ORDER BY id`
    );

    res.status(200).json({ users: rows });
  } catch (err) {
    console.error("❌ Error fetching all users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
