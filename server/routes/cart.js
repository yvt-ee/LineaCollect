// routes/cart.js
import express from "express";
import { pool } from "../config/database.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   ⭐ 使用 optionalAuth → 不登录也允许访问
============================================================ */
router.use(optionalAuth);

/* ============================================================
   🛒 GET CURRENT USER CART
   GET /api/cart
============================================================ */
router.get("/", async (req, res) => {
  // 未登录用户 → 返回 guest:true
  if (!req.user) {
    return res.json({
      guest: true,
      items: []
    });
  }


  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        c.quantity,
        v.id AS variant_id,
        v.price,
        v.color,
        v.size,
        v.product_id
      FROM cart_items c
      JOIN product_variants v ON v.id = c.variant_id
      WHERE c.user_id = $1

      `,
      [userId]
    );

    res.json({ items: rows });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   ➕ ADD TO CART — supports guest cart
   ============================================================ */
router.post("/add", async (req, res) => {
  const { variantId, quantity } = req.body;

  if (!variantId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid variantId or quantity" });
  }

  /* -----------------------------
     ⭐ 1) Guest user (not logged in)
  ----------------------------- */
  if (!req.user) {
    return res.json({
      guest: true,
      message: "Guest user — store item in localStorage",
    });
  }

  /* -----------------------------
     ⭐ 2) Logged-in user: DB write
  ----------------------------- */
  const userId = req.user.id;

  try {
    const vRes = await pool.query(
      `SELECT stock FROM product_variants WHERE id = $1`,
      [variantId]
    );

    if (vRes.rowCount === 0) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const stock = vRes.rows[0].stock;
    const safeQty = Math.min(quantity, stock);

    const exists = await pool.query(
      `SELECT id, quantity FROM cart_items WHERE user_id = $1 AND variant_id = $2`,
      [userId, variantId]
    );

    if (exists.rowCount > 0) {
      const currQty = exists.rows[0].quantity;
      const newQty = Math.min(currQty + safeQty, stock);

      await pool.query(
        `UPDATE cart_items SET quantity = $1 WHERE id = $2`,
        [newQty, exists.rows[0].id]
      );

      return res.json({
        message: "Quantity updated",
        quantity: newQty,
      });
    }

    // ➕ Insert new item
    await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity)
       VALUES ($1, $2, $3)`,
      [userId, variantId, safeQty]
    );

    res.status(201).json({
      message: "Item added",
      quantity: safeQty,
    });
  } catch (err) {
    console.error("❌ Error adding cart item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


/* ============================================================
   ❌ REMOVE ITEM（必须登录）
============================================================ */
router.delete("/remove/:variantId", authenticate, async (req, res) => {
  const userId = req.user.id;
  const variantId = Number(req.params.variantId);

  try {
    const del = await pool.query(
      `DELETE FROM cart_items
       WHERE user_id = $1 AND variant_id = $2`,
      [userId, variantId]
    );

    if (del.rowCount === 0)
      return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Item removed" });
  } catch (err) {
    console.error("❌ Error removing item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   Merge ITEM（登录后）
============================================================ */
router.post("/merge", authenticate, async (req, res) => {
  const { items } = req.body; // guestCart

  for (const item of items) {
    await pool.query(
      `
      INSERT INTO cart_items (user_id, variant_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, variant_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      `,
      [req.user.id, item.variant_id, item.quantity]
    );
  }

  res.json({ success: true });
});


/* ============================================================
   Change Variant
============================================================ */
  router.put("/change-variant", authenticate, async (req, res) => {
    const userId = req.user.id;
    const { oldVariantId, newVariantId } = req.body;

    if (!oldVariantId || !newVariantId) {
      return res.status(400).json({ error: "Missing variant IDs" });
    }

    try {
      // 1. 找旧的购物车行
      const oldItem = await pool.query(
        `SELECT quantity FROM cart_items 
        WHERE user_id = $1 AND variant_id = $2`,
        [userId, oldVariantId]
      );

      if (oldItem.rowCount === 0)
        return res.status(404).json({ error: "Item not found" });

      const quantity = oldItem.rows[0].quantity;

      // 2. 删除旧 variant
      await pool.query(
        `DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2`,
        [userId, oldVariantId]
      );

      // 3. 检查新 variant 是否已经在购物车里
      const existing = await pool.query(
        `SELECT id, quantity FROM cart_items 
        WHERE user_id = $1 AND variant_id = $2`,
        [userId, newVariantId]
      );

      if (existing.rowCount > 0) {
        // ✔ 已经存在 → 数量叠加
        await pool.query(
          `UPDATE cart_items
          SET quantity = quantity + $1
          WHERE id = $2`,
          [quantity, existing.rows[0].id]
        );

        return res.json({ message: "Variant changed and merged" });
      }

      // 4. 新 variant 插入
      await pool.query(
        `INSERT INTO cart_items (user_id, variant_id, quantity)
        VALUES ($1, $2, $3)`,
        [userId, newVariantId, quantity]
      );

      res.json({ message: "Variant changed" });
    } catch (err) {
      console.error("❌ change-variant error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });


/* ============================================================
   Update Quantity
   PUT /api/cart/update
============================================================ */
router.put("/update", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { variantId, quantity } = req.body;

  if (!variantId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM cart_items WHERE user_id = $1 AND variant_id = $2`,
      [userId, variantId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND variant_id = $3`,
      [quantity, userId, variantId]
    );

    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error("❌ Error updating quantity:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
