import express from "express";
import { pool } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   🛍 CREATE ORDER (user must be logged in)
============================================================ */
router.post("/", authenticate, async (req, res) => {
  const user_id = req.user.id; // 🔒 never trust body
  const { address_id, payment_method, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Items are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate address
    if (address_id) {
      const a = await client.query(
        `SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [address_id, user_id]
      );
      if (a.rowCount === 0) throw new Error("Invalid address_id for this user");
    }

    // Validate items + stock
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const { variant_id, quantity } = item;

      const { rows, rowCount } = await client.query(
        `SELECT id, price, discount, stock FROM product_variants WHERE id = $1 FOR UPDATE`,
        [variant_id]
      );
      if (rowCount === 0) throw new Error(`Variant ${variant_id} not found`);

      const v = rows[0];

      if (v.stock < quantity)
        throw new Error(
          `Insufficient stock for variant ${variant_id} (have ${v.stock}, need ${quantity})`
        );

      const unitPrice = Math.max(Number(v.price) - Number(v.discount || 0), 0);
      totalAmount += unitPrice * quantity;

      orderItemsData.push({ variant_id, quantity, unitPrice });
    }

    // Create order
    const orderRes = await client.query(
      `
      INSERT INTO orders (user_id, address_id, total_amount, status, payment_status)
      VALUES ($1, $2, $3, 'pending', 'unpaid')
      RETURNING *
      `,
      [user_id, address_id || null, totalAmount]
    );

    const order = orderRes.rows[0];

    // Insert items + deduct stock
    for (const item of orderItemsData) {
      await client.query(
        `
        INSERT INTO order_items (order_id, variant_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        `,
        [order.id, item.variant_id, item.quantity, item.unitPrice]
      );

      await client.query(
        `UPDATE product_variants SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.variant_id]
      );

      await client.query(
        `INSERT INTO inventory_logs (variant_id, change_amount, reason)
         VALUES ($1, $2, 'order')`,
        [item.variant_id, -item.quantity]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Order created", order });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* ============================================================
   🔍 GET logged-in user's orders
============================================================ */
router.get("/me", authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   🔍 GET SINGLE ORDER
============================================================ */
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const orderRes = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );
    if (orderRes.rowCount === 0)
      return res.status(404).json({ error: "Order not found" });

    const order = orderRes.rows[0];

    // 🔒 Prevent seeing others' orders
    if (order.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not allowed" });
    }

    const itemsRes = await pool.query(
      `
      SELECT oi.*, v.color, v.size, v.sku, v.main_image,
             p.name AS product_name, b.name AS brand_name
      FROM order_items oi
      JOIN product_variants v ON v.id = oi.variant_id
      JOIN products p ON p.id = v.product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE oi.order_id = $1
      `,
      [id]
    );

    res.json({ ...order, items: itemsRes.rows });

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   🛠 UPDATE ORDER STATUS (Admin Only)
============================================================ */
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["pending", "paid", "shipped", "completed", "cancelled"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const { rows, rowCount } = await pool.query(
      `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (!rowCount) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Status updated", order: rows[0] });

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
