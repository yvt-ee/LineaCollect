// controllers/inventory.js
import { pool } from "../config/database.js";

/* ============================================================
   📦 GET ALL INVENTORY
   ============================================================ */
export const getInventory = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        v.id AS variant_id,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name,
        v.color,
        v.size,
        v.sku,
        v.stock,
        v.price,
        v.discount,
        p.category,
        p.main_image
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY b.name, p.name, v.color, v.size
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   🔍 GET SINGLE VARIANT INVENTORY
   ============================================================ */
export const getVariantInventory = async (req, res) => {
  const { variantId } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `
      SELECT 
        v.id AS variant_id,
        v.stock,
        v.price,
        v.discount,
        v.sku,
        v.color,
        v.size,
        p.id AS product_id,
        p.name AS product_name,
        b.name AS brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.id = $1
      `,
      [variantId]
    );

    if (rowCount === 0) return res.status(404).json({ error: "Variant not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("❌ Error fetching variant inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   ➕ UPDATE STOCK (ADD / SUBTRACT)
   schema uses: change_amount + reason only
   ============================================================ */
export const updateStock = async (req, res) => {
  const { variant_id, change_amount, reason } = req.body || {};

  if (!variant_id || !change_amount || isNaN(change_amount)) {
    return res.status(400).json({
      error: "variant_id and numeric change_amount are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Lock variant row
    const { rows, rowCount } = await client.query(
      `SELECT stock FROM product_variants WHERE id = $1 FOR UPDATE`,
      [variant_id]
    );

    if (rowCount === 0) {
      throw new Error("Variant not found");
    }

    const currentStock = rows[0].stock;

    // Prevent negative stock
    const newStock = Math.max(0, currentStock + Number(change_amount));

    // 2️⃣ Update variant stock
    await client.query(
      `UPDATE product_variants SET stock = $1 WHERE id = $2`,
      [newStock, variant_id]
    );

    // 3️⃣ Insert inventory log
    await client.query(
      `
      INSERT INTO inventory_logs (variant_id, change_amount, reason)
      VALUES ($1, $2, $3)
      `,
      [variant_id, change_amount, reason || "Manual update"]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "✅ Inventory updated successfully",
      variant_id,
      previous_stock: currentStock,
      new_stock: newStock,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating stock:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  } finally {
    client.release();
  }
};

/* ============================================================
   📜 GET INVENTORY LOGS
   ============================================================ */
export const getInventoryLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        l.id,
        l.variant_id,
        v.sku,
        l.change_amount,
        l.reason,
        l.created_at
      FROM inventory_logs l
      JOIN product_variants v ON v.id = l.variant_id
      ORDER BY l.created_at DESC
      LIMIT 50
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error fetching inventory logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
