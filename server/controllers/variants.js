// controllers/variants.js
import { pool } from "../config/database.js";

/**
 * =========================================================
 * 🟦 Get ALL variants for a product
 * GET /api/products/:productId/variants
 * Includes:
 *   - variants
 *   - variant images
 *   - product options & values (e.g., Color / Size)
 * =========================================================
 */
export const getVariantsByProduct = async (req, res) => {
  const productId = Number(req.params.productId);
  if (!productId) return res.status(400).json({ error: "Invalid product id" });

  try {
    // 1️⃣ Fetch variants
    const variantsRes = await pool.query(
      `
      SELECT 
        v.id AS variant_id,
        v.product_id,
        v.sku,
        v.color,
        v.size,
        v.price,
        v.discount,
        v.stock,
        v.main_image
      FROM product_variants v
      WHERE v.product_id = $1
      ORDER BY v.id ASC
      `,
      [productId]
    );

    // 2️⃣ Fetch images for all variants
    const imagesRes = await pool.query(
      `
      SELECT 
        i.variant_id,
        i.image_url
      FROM product_images i
      JOIN product_variants v ON v.id = i.variant_id
      WHERE v.product_id = $1
      ORDER BY i.id ASC
      `,
      [productId]
    );

    // Group images by variant
    const imagesMap = {};
    imagesRes.rows.forEach((img) => {
      if (!imagesMap[img.variant_id]) imagesMap[img.variant_id] = [];
      imagesMap[img.variant_id].push(img.image_url);
    });

    // 3️⃣ Fetch product options (Color, Size, etc.)
    const optionsRes = await pool.query(
      `
      SELECT 
        o.id AS option_id,
        o.name AS option_name,
        (
          SELECT json_agg(value ORDER BY value ASC)
          FROM product_option_values
          WHERE option_id = o.id
        ) AS values
      FROM product_options o
      WHERE o.product_id = $1
      ORDER BY o.id ASC
      `,
      [productId]
    );

    const productOptions = optionsRes.rows;

    // 4️⃣ Final merge
    const enrichedVariants = variantsRes.rows.map((v) => ({
      ...v,
      images: imagesMap[v.variant_id] || [],
      options: productOptions, // same for all variants of same product
    }));

    res.status(200).json(enrichedVariants);
  } catch (err) {
    console.error("❌ Error fetching variants:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * =========================================================
 * 🟪 Get a single variant (full details)
 * GET /api/variants/:variantId
 * Includes:
 *   - variant
 *   - product
 *   - brand
 *   - variant images
 *   - product options & values
 * =========================================================
 */
export const getVariantById = async (req, res) => {
  const variantId = Number(req.params.variantId);
  if (!variantId) return res.status(400).json({ error: "Invalid variant id" });

  try {
    // 1️⃣ Variant + product + brand
    const variantRes = await pool.query(
      `
      SELECT 
        v.id AS variant_id,
        v.product_id,
        v.sku,
        v.color,
        v.size,
        v.price,
        v.discount,
        v.stock,
        v.main_image,

        p.name AS product_name,
        p.slug,
        p.category,
        p.description,
        b.name AS brand_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE v.id = $1
      `,
      [variantId]
    );

    if (variantRes.rowCount === 0)
      return res.status(404).json({ error: "Variant not found" });

    const variant = variantRes.rows[0];

    // 2️⃣ Fetch variant images
    const imagesRes = await pool.query(
      `
      SELECT image_url 
      FROM product_images 
      WHERE variant_id = $1
      ORDER BY id ASC
      `,
      [variantId]
    );

    variant.images = imagesRes.rows.map((r) => r.image_url);

    // 3️⃣ Fetch product options + values
    const optionsRes = await pool.query(
      `
      SELECT 
        o.id AS option_id,
        o.name AS option_name,
        (
          SELECT json_agg(value ORDER BY value ASC)
          FROM product_option_values
          WHERE option_id = o.id
        ) AS values
      FROM product_options o
      WHERE o.product_id = $1
      ORDER BY o.id ASC
      `,
      [variant.product_id]
    );

    variant.options = optionsRes.rows;

    res.status(200).json(variant);
  } catch (err) {
    console.error("❌ Error fetching variant:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
