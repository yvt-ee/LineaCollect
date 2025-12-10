import express from "express";
import { pool } from "../config/database.js";

const router = express.Router();

/* -----------------------------
   Base SELECT — unify all fields
----------------------------- */
const baseSelect = `
  SELECT
    p.id,
    p.name,
    p.slug,
    p.category,
    p.main_image,
    p.price_min,
    p.price_max,
    b.name AS brandname
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
`;

/* -----------------------------------
   NEW-IN
----------------------------------- */
router.get("/new-in", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      ${baseSelect}
      WHERE p.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY p.created_at DESC
      `
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ new-in error:", err);
    res.status(500).json({ error: "Failed to fetch new-in products" });
  }
});

/* -----------------------------------
   BEST-SELLERS
----------------------------------- */
router.get("/best-sellers", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      ${baseSelect}
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY p.id, b.name
      ORDER BY COALESCE(SUM(oi.quantity), 0) DESC
      LIMIT 10
      `
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ best-sellers error:", err);
    res.status(500).json({ error: "Failed to fetch best-sellers" });
  }
});

/* -----------------------------------
   NORMAL CATEGORY
----------------------------------- */
router.get("/:category", async (req, res) => {
  let category = req.params.category.toLowerCase().trim();
  const singular = category.endsWith("s")
    ? category.slice(0, -1)
    : category;

  try {
    const { rows } = await pool.query(
      `
      ${baseSelect}
      WHERE LOWER(TRIM(p.category)) = $1
         OR LOWER(TRIM(p.category)) = $2
         OR LOWER(TRIM(p.category)) LIKE $3
         OR LOWER(TRIM(p.category)) LIKE $4
      ORDER BY p.id DESC
      `,
      [
        category,
        singular,
        singular + "%",
        category + "%",
      ]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ category error:", err);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

export default router;
