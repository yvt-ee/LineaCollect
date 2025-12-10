// routes/inventory.js
import express from "express";
import { pool } from "../config/database.js";

const router = express.Router();

/* ============================================================
   🔍 GET ALL VARIANTS INVENTORY
   GET /api/inventory/variants?product_id=&low_stock=
   ============================================================ */
router.get("/variants", async (req, res) => {
  const { product_id, low_stock } = req.query;
  const conditions = [];
  const values = [];

  if (product_id) {
    values.push(product_id);
    conditions.push(`v.product_id = $${values.length}`);
  }

  if (low_stock) {
    values.push(Number(low_stock));
    conditions.push(`v.stock <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      v.id AS variant_id,
      v.product_id,
      p.name AS product_name,
      b.name AS brand_name,
      v.color,
      v.size,
      v.sku,
      v.price,
      v.discount,
      v.stock,
      v.main_image,
      p.category,
      p.slug
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    LEFT JOIN brands b ON p.brand_id = b.id
    ${where}
    ORDER BY p.id ASC, v.id ASC
  `;

  try {
    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching variants inventory:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   🔍 GET SINGLE VARIANT INVENTORY
   GET /api/inventory/variants/:id
   ============================================================ */
router.get("/variants/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `
      SELECT
        v.id AS variant_id,
        v.product_id,
        p.name AS product_name,
        b.name AS brand_name,
        v.color,
        v.size,
        v.sku,
        v.price,
        v.discount,
        v.stock,
        v.main_image,
        p.category,
        p.slug
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.id = $1
      `,
      [id]
    );

    if (!rowCount) return res.status(404).json({ error: "Variant not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching variant:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   🔄 PATCH STOCK
   PATCH /api/inventory/variants/:id/stock
   Body: { change: -3 | 5, reason: "restock" }
   ============================================================ */
router.patch("/variants/:id/stock", async (req, res) => {
  const { id } = req.params;
  const { change, reason } = req.body;

  if (change === undefined || isNaN(Number(change))) {
    return res.status(400).json({ error: "'change' (number) is required" });
  }

  const delta = Number(change);
  const reasonText = reason || (delta > 0 ? "restock" : "manual_adjust");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // lock row
    const { rows, rowCount } = await client.query(
      `SELECT stock FROM product_variants WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (!rowCount) throw new Error("Variant not found");

    const currentStock = Number(rows[0].stock);
    const newStock = currentStock + delta;

    if (newStock < 0) throw new Error("Insufficient stock");

    await client.query(
      `UPDATE product_variants SET stock = $1 WHERE id = $2`,
      [newStock, id]
    );

    // NEW SCHEMA: logs only variant_id, change_amount, reason
    await client.query(
      `
      INSERT INTO inventory_logs (variant_id, change_amount, reason)
      VALUES ($1, $2, $3)
      `,
      [id, delta, reasonText]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Stock updated successfully",
      variant_id: Number(id),
      old_stock: currentStock,
      new_stock: newStock
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating stock:", err);
    res.status(400).json({ error: err.message || "Failed to update stock" });
  } finally {
    client.release();
  }
});

/* ============================================================
   📜 GET INVENTORY LOGS
   GET /api/inventory/logs?variant_id=&limit=
   ============================================================ */
router.get("/logs", async (req, res) => {
  const { variant_id, limit } = req.query;
  const values = [];
  let where = "";

  if (variant_id) {
    values.push(variant_id);
    where = `WHERE l.variant_id = $${values.length}`;
  }

  const lim = Math.min(Number(limit) || 50, 200);

  const query = `
    SELECT
      l.id,
      l.variant_id,
      v.product_id,
      p.name AS product_name,
      v.sku,
      v.color,
      v.size,
      l.change_amount,
      l.reason,
      l.created_at
    FROM inventory_logs l
    LEFT JOIN product_variants v ON v.id = l.variant_id
    LEFT JOIN products p ON p.id = v.product_id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT ${lim}
  `;

  try {
    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching inventory logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
