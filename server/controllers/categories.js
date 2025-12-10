// controllers/categories.js
import { pool } from "../config/database.js";

/* Helper — unify the output format */
function normalize(row) {
  return {
    id: row.id,
    name: row.name,
    brandname: row.brand_name,
    category: row.category,
    price: row.price,
    slug: row.slug,
    main_image: row.main_image,
  };
}

const CategoriesController = {
  async getByCategory(req, res) {
    const { categoryName } = req.params;

    try {
      const normalized = categoryName.toLowerCase().trim();

      let rows = [];

      /* ========================================================
                      ⭐ NEW IN
      ======================================================== */
      if (normalized === "new-in") {
        const q = `
          SELECT *
          FROM products
          WHERE created_at >= NOW() - INTERVAL '30 days'
          ORDER BY created_at DESC
        `;
        const { rows: r } = await pool.query(q);
        return res.json(r.map(normalize));
      }

      /* ========================================================
                      ⭐ BEST SELLERS
      ======================================================== */
      if (normalized === "best-sellers") {
        const q = `
          SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS total_sold
          FROM products p
          LEFT JOIN order_items oi ON oi.product_id = p.id
          GROUP BY p.id
          ORDER BY total_sold DESC
          LIMIT 10
        `;
        const { rows: r } = await pool.query(q);
        return res.json(r.map(normalize));
      }

      /* ========================================================
                      ⭐ NORMAL CATEGORY
         支持模糊搜索 + 单数/复数 + 大小写匹配
      ======================================================== */
      const singular = normalized.endsWith("s")
        ? normalized.slice(0, -1)
        : normalized;

      const q = `
        SELECT *
        FROM products
        WHERE LOWER(TRIM(category)) = $1
           OR LOWER(TRIM(category)) = $2
           OR LOWER(TRIM(category)) LIKE $3
           OR LOWER(TRIM(category)) LIKE $4
        ORDER BY id ASC
      `;

      const params = [
        normalized,
        singular,
        singular + "%",   // earring → earrings
        normalized + "%", // earrings → earring
      ];

      const { rows: r } = await pool.query(q, params);
      return res.json(r.map(normalize));

    } catch (err) {
      console.error("❌ Category error:", err);
      res.status(500).json({ error: "Failed to load category products" });
    }
  },
};

export default CategoriesController;
