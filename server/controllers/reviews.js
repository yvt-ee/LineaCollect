// controllers/reviews.js
import { pool } from "../config/database.js";

/* ============================================================
   🔹 Utility — Mask Email (u****@domain.com)
   ============================================================ */
function maskEmail(email) {
  if (!email) return "Anonymous";
  const [name, domain] = email.split("@");
  return name[0] + "****@" + domain;
}

/* ============================================================
   📌 Get reviews for one product
   GET /reviews/product/:productId
   ============================================================ */
export async function getReviewsByProduct(req, res) {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        r.id,
        r.product_id,
        r.user_id,
        u.email AS user_email,
        r.rating,
        r.comment,
        r.created_at
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      `,
      [productId]
    );

    const formatted = result.rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user: maskEmail(r.user_email),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Error getReviewsByProduct:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

/* ============================================================
   ✍️ Create review
   POST /reviews
   body: { product_id, rating, comment }
   Requires login OR anonymous allowed
   ============================================================ */
export async function createReview(req, res) {
  try {
    const userId = req.user?.id || null;
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: "product_id and rating required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be 1–5" });
    }

    // product check
    const exists = await pool.query(`SELECT id FROM products WHERE id = $1`, [
      product_id,
    ]);
    if (exists.rowCount === 0)
      return res.status(404).json({ error: "Product not found" });

    const { rows } = await pool.query(
      `
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [product_id, userId, rating, comment || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("❌ Error createReview:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
}

/* ============================================================
   ✏️ Update review
   PUT /reviews/:reviewId
   ============================================================ */
export async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;
    const { rating, comment } = req.body;

    if (!rating) return res.status(400).json({ error: "rating required" });

    const check = await pool.query(
      `SELECT user_id FROM reviews WHERE id = $1`,
      [reviewId]
    );

    if (check.rowCount === 0)
      return res.status(404).json({ error: "Review not found" });

    if (check.rows[0].user_id !== userId)
      return res.status(403).json({ error: "Not your review" });

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET rating = $1, comment = $2
      WHERE id = $3
      RETURNING *
      `,
      [rating, comment || null, reviewId]
    );

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("❌ Error updateReview:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
}

/* ============================================================
   ❌ Delete review
   DELETE /reviews/:reviewId
   ============================================================ */
export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    const check = await pool.query(
      `SELECT user_id FROM reviews WHERE id = $1`,
      [reviewId]
    );

    if (check.rowCount === 0)
      return res.status(404).json({ error: "Review not found" });

    if (check.rows[0].user_id !== userId)
      return res.status(403).json({ error: "Not your review" });

    await pool.query(`DELETE FROM reviews WHERE id = $1`, [reviewId]);

    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    console.error("❌ Error deleteReview:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
}
