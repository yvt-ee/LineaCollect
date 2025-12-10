// controllers/orders.js
import { pool } from "../config/database.js";

/* ============================================================
   📦 Get all orders for current user
   includes: order info + items
   ============================================================ */
export const getOrders = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        o.id AS order_id,
        o.user_id,
        o.total_amount,
        o.status,
        o.payment_status,
        o.created_at,
        json_agg(
          json_build_object(
            'variant_id', v.id,
            'product_name', p.name,
            'brand_name', b.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'discount', oi.discount,
            'main_image', v.main_image,
            'color', v.color,
            'size', v.size,
            'sku', v.sku
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product_variants v ON oi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


/* ============================================================
   🛍 Create an order (checkout)
   body: { items: [{ variant_id, quantity }], address_id }
   ============================================================ */
export const createOrder = async (req, res) => {
  const userId = req.user?.id;
  const { items, address_id } = req.body || {};

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid order payload" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ------------------------------------------------------------
       1️⃣ Validate items + calculate total
    ------------------------------------------------------------ */
    let totalAmount = 0;

    for (const item of items) {
      const { rows, rowCount } = await client.query(
        `SELECT price, discount, stock FROM product_variants WHERE id = $1 FOR UPDATE`,
        [item.variant_id]
      );
      if (rowCount === 0) throw new Error(`Invalid variant ${item.variant_id}`);

      const { price, discount, stock } = rows[0];

      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variant_id}`);
      }

      totalAmount += (price - (discount || 0)) * item.quantity;
    }

    /* ------------------------------------------------------------
       2️⃣ Create order
    ------------------------------------------------------------ */
    const { rows: orderRows } = await client.query(
      `
      INSERT INTO orders (user_id, address_id, total_amount, status, payment_status)
      VALUES ($1, $2, $3, 'pending', 'unpaid')
      RETURNING id
      `,
      [userId, address_id || null, totalAmount]
    );

    const orderId = orderRows[0].id;

    /* ------------------------------------------------------------
       3️⃣ Insert each item into order_items AND deduct stock
    ------------------------------------------------------------ */
    for (const item of items) {
      // Fetch variant info again
      const { rows } = await client.query(
        `SELECT price, discount, stock FROM product_variants WHERE id = $1`,
        [item.variant_id]
      );

      const { price, discount, stock } = rows[0];
      const newStock = stock - item.quantity;

      // Insert order item
      await client.query(
        `
        INSERT INTO order_items (order_id, variant_id, quantity, price, discount)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [orderId, item.variant_id, item.quantity, price, discount]
      );

      // Deduct stock
      await client.query(
        `
        UPDATE product_variants
        SET stock = $1
        WHERE id = $2
        `,
        [newStock, item.variant_id]
      );

      // Insert inventory log
      await client.query(
        `
        INSERT INTO inventory_logs (variant_id, change_amount, reason)
        VALUES ($1, $2, $3)
        `,
        [item.variant_id, -item.quantity, `Order #${orderId}`]
      );
    }

    /* ------------------------------------------------------------
       4️⃣ Commit
    ------------------------------------------------------------ */
    await client.query("COMMIT");

    res.status(201).json({
      message: "✅ Order created successfully",
      order_id: orderId,
      total_amount: totalAmount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating order:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  } finally {
    client.release();
  }
};
