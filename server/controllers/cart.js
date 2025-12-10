// controllers/cart.js
import { pool } from "../config/database.js";

/* ============================================================
   🛒 GET USER CART — clean + efficient response
   ============================================================ */
export const getCart = async (req, res) => {
  try {
    // ⭐ 未登录用户 ⇒ 返回空数组（前端用 localStorage）
    if (!req.user) {
      return res.json({ items: [] });
    }

    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT 
        c.id AS cart_item_id,
        c.quantity,

        -- Variant info
        v.id AS variant_id,
        v.sku,
        v.color,
        v.size,
        v.price,
        v.discount,
        v.stock,

        -- Product info
        p.id AS product_id,
        p.name AS product_name,
        p.slug,
        p.category,
        p.main_image AS product_image,
        p.price_min,
        p.price_max,

        -- Brand
        b.name AS brand_name,

        -- Images (grouped by color)
        (
          SELECT json_agg(image_url)
          FROM product_images
          WHERE product_id = p.id AND color = v.color
        ) AS variant_images

      FROM cart_items c
      JOIN product_variants v ON v.id = c.variant_id
      JOIN products p ON p.id = v.product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE c.user_id = $1
      ORDER BY c.id ASC
      `,
      [userId]
    );

    res.status(200).json({ items: rows });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* ============================================================
   ➕ ADD TO CART — supports guest cart
   ============================================================ */
export const addToCart = async (req, res) => {
  try {
    const user = req.user;
    const { variant_id, quantity } = req.body;

    if (!variant_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid variant or quantity" });
    }

    /* -----------------------------
       ⭐ 1) 未登录用户（guest）
       前端 localStorage 保存购物车
    ----------------------------- */
    if (!user) {
      return res.json({
        guest: true,
        message: "Guest user — please store item in localStorage",
      });
    }

    /* -----------------------------
       ⭐ 2) 已登录用户（写入 DB）
    ----------------------------- */
    const userId = user.id;

    const variantRes = await pool.query(
      `SELECT stock FROM product_variants WHERE id = $1`,
      [variant_id]
    );

    if (variantRes.rowCount === 0) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const stock = variantRes.rows[0].stock;
    const safeQty = Math.min(quantity, stock);

    // Check existing item
    const existing = await pool.query(
      `SELECT id, quantity FROM cart_items WHERE user_id = $1 AND variant_id = $2`,
      [userId, variant_id]
    );

    if (existing.rowCount > 0) {
      const currQty = existing.rows[0].quantity;
      const newQty = Math.min(currQty + safeQty, stock);

      await pool.query(
        `UPDATE cart_items SET quantity = $1 WHERE id = $2`,
        [newQty, existing.rows[0].id]
      );

      return res.json({
        message: "Quantity updated",
        quantity: newQty,
        stockLimited: newQty < currQty + safeQty,
      });
    }

    // Insert new item
    await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity)
       VALUES ($1, $2, $3)`,
      [userId, variant_id, safeQty]
    );

    res.status(201).json({
      message: "Item added to cart",
      quantity: safeQty,
      stockLimited: safeQty < quantity,
    });
  } catch (err) {
    console.error("❌ Error adding to cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* ============================================================
   🔄 UPDATE CART ITEM (login only)
   ============================================================ */
export const updateCartItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Login required" });
    }

    const userId = req.user.id;
    const cartItemId = Number(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const itemRes = await pool.query(
      `
      SELECT c.variant_id, v.stock
      FROM cart_items c
      JOIN product_variants v ON v.id = c.variant_id
      WHERE c.id = $1 AND c.user_id = $2
      `,
      [cartItemId, userId]
    );

    if (itemRes.rowCount === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const stock = itemRes.rows[0].stock;
    const finalQty = Math.min(quantity, stock);

    await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3`,
      [finalQty, cartItemId, userId]
    );

    res.json({
      message: "Quantity updated",
      quantity: finalQty,
      stockLimited: finalQty < quantity,
    });
  } catch (err) {
    console.error("❌ Error updating cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* ============================================================
   ❌ DELETE CART ITEM (login only)
   ============================================================ */
export const deleteCartItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Login required" });
    }

    const userId = req.user.id;
    const cartItemId = Number(req.params.id);

    const { rowCount } = await pool.query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`,
      [cartItemId, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("❌ Error removing item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
