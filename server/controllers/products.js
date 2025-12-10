// controllers/products.js
import { pool } from "../config/database.js";
import slugify from "slugify";

/* ============================================================
   🟩 CREATE PRODUCT — 上传一次 = 一个颜色
   ============================================================ */
export const createProduct = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let {
      name,
      brandName,    // <<< 前端传这个
      category,
      description,
      price_min,
      price_max,
      color,
      variants,
      options
    } = req.body;

    if (!name || !brandName || !category || !description || !price_min) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ------------------------------
    // 1️⃣ 规范化 brandName
    // ------------------------------
    brandName = brandName.trim();

    // ------------------------------
    // 2️⃣ 检查品牌是否存在
    // ------------------------------
    let brandRes = await client.query(
      `SELECT id FROM brands WHERE LOWER(name)=LOWER($1) LIMIT 1`,
      [brandName]
    );

    let brand_id;

    if (brandRes.rowCount === 0) {
      // 插入新品牌
      const newBrand = await client.query(
        `INSERT INTO brands (name) VALUES ($1) RETURNING id`,
        [brandName]
      );
      brand_id = newBrand.rows[0].id;
      console.log("✨ New brand added:", brandName);
    } else {
      // 已存在
      brand_id = brandRes.rows[0].id;
    }

    // ------------------------------
    // 3️⃣ 生成 slug
    // ------------------------------
    const slug = slugify(name, { lower: true, strict: true });
    const images = req.files?.map((f) => f.location) || [];
    const mainImage = images[0] || null;

    // ------------------------------
    // 4️⃣ 创建 Product 主表
    // ------------------------------
    const productRes = await client.query(
      `INSERT INTO products (name, slug, brand_id, category, description, main_image, price_min, price_max)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        name,
        slug,
        brand_id,             // <<< 自动生成的 brand_id
        category,
        description,
        mainImage,
        price_min,
        price_max || price_min
      ]
    );

    const productId = productRes.rows[0].id;

    // ------------------------------
    // 5️⃣ 创建 Product Options
    // ------------------------------
    if (options && Object.keys(options).length > 0) {
      for (const [optName, optValues] of Object.entries(options)) {
        const optionRes = await client.query(
          `INSERT INTO product_options (product_id, name)
           VALUES ($1,$2)
           RETURNING id`,
          [productId, optName]
        );

        const optionId = optionRes.rows[0]?.id;
        if (!optionId) continue;

        for (const v of optValues) {
          await client.query(
            `INSERT INTO product_option_values (option_id, value)
             VALUES ($1,$2)`,
            [optionId, v]
          );
        }
      }
    }

    // ------------------------------
    // 6️⃣ 创建 Variants（sizes）
    // ------------------------------
    const parsedVariants = JSON.parse(variants);

    for (const v of parsedVariants) {
      await client.query(
        `INSERT INTO product_variants (product_id, sku, price, stock, color, size)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          productId,
          v.sku,
          v.price,
          v.stock || 0,
          color,
          v.size
        ]
      );
    }

    // ------------------------------
    // 7️⃣ 插入 Color Image
    // ------------------------------
    for (const img of images) {
      await client.query(
        `INSERT INTO product_images (product_id, color, image_url)
         VALUES ($1,$2,$3)`,
        [productId, color, img]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Product created",
      productId,
      brand_id,
      created_brand: brandRes.rowCount === 0
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ createProduct error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};


/* ============================================================
   🟦 GET ALL PRODUCTS
   ============================================================ */
export const getAllProducts = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id, p.name, p.slug,
        b.name AS brandname,
        p.category,
        p.price_min,
        p.price_max,
        p.main_image
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.is_active = TRUE
      ORDER BY p.id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ getAllProducts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   🟨 GET PRODUCT BY ID
   ============================================================ */
export const getProductById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid product id" });

  try {
    const productRes = await pool.query(
      `
      SELECT p.*, b.name AS brandname
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.id = $1
      `,
      [id]
    );

    if (productRes.rowCount === 0)
      return res.status(404).json({ error: "Product not found" });

    const optionsRes = await pool.query(
      `
      SELECT o.id AS option_id, o.name AS option_name, v.id AS value_id, v.value
      FROM product_options o
      LEFT JOIN product_option_values v ON v.option_id = o.id
      WHERE o.product_id = $1
      ORDER BY o.id
      `,
      [id]
    );

    const variantsRes = await pool.query(
      `
      SELECT *
      FROM product_variants
      WHERE product_id = $1
      ORDER BY id
      `,
      [id]
    );

    const imagesRes = await pool.query(
      `
      SELECT i.image_url
      FROM product_images i
      JOIN product_variants v ON v.id = i.variant_id
      WHERE v.product_id = $1
      ORDER BY i.id
      `,
      [id]
    );

    res.json({
      product: productRes.rows[0],
      options: optionsRes.rows,
      variants: variantsRes.rows,
      images: imagesRes.rows.map((r) => r.image_url),
    });
  } catch (err) {
    console.error("❌ getProductById error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   🟧 UPDATE PRODUCT
   ============================================================ */
export const updateProduct = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const id = Number(req.params.id);
    const { name, brand_id, category, description, price_min, price_max } =
      req.body;

    const images = req.files?.map((f) => f.location) || [];

    await client.query(
      `
      UPDATE products
      SET name=$1, brand_id=$2, category=$3, description=$4,
          price_min=$5, price_max=$6, updated_at=NOW()
      WHERE id=$7
      `,
      [name, brand_id, category, description, price_min, price_max, id]
    );

    if (images.length > 0) {
      await client.query(`UPDATE products SET main_image=$1 WHERE id=$2`, [
        images[0],
        id,
      ]);

      const vRes = await client.query(
        `SELECT id FROM product_variants WHERE product_id=$1 ORDER BY id LIMIT 1`,
        [id]
      );

      if (vRes.rowCount > 0) {
        const variantId = vRes.rows[0].id;

        await client.query(`DELETE FROM product_images WHERE variant_id=$1`, [
          variantId,
        ]);

        for (const img of images) {
          await client.query(
            `INSERT INTO product_images (variant_id, image_url)
             VALUES ($1,$2)`,
            [variantId, img]
          );
        }
      }
    }

    await client.query("COMMIT");

    res.json({ message: "✅ Product updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ updateProduct:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

/* ============================================================
   🟥 DELETE PRODUCT
   ============================================================ */
export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query(`DELETE FROM products WHERE id=$1`, [id]);

    res.json({ message: "✅ Product deleted" });
  } catch (err) {
    console.error("❌ deleteProduct:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   🟦 GET ALL BRANDS
   ============================================================ */
export const getAllBrands = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name FROM brands ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ getAllBrands:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ============================================================
   🟪 GET ALL CATEGORIES
   ============================================================ */
export const getAllCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category FROM products`
    );
    res.json(rows.map((r) => r.category));
  } catch (err) {
    console.error("❌ getAllCategories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getProductBySlugOrId = async (req, res) => {
  const key = req.params.slugOrId;
  const isNumeric = /^\d+$/.test(key);

  try {
    /* ---------------------------------------
       1️⃣ Get product by id OR slug
    --------------------------------------- */
    const productQuery = isNumeric
      ? `
        SELECT p.*, b.name AS brand_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.id = $1
      `
      : `
        SELECT p.*, b.name AS brand_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.slug = $1
      `;

    const productRes = await pool.query(productQuery, [key]);
    if (productRes.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productRes.rows[0];

    /* ---------------------------------------
       2️⃣ Fetch variants
    --------------------------------------- */
    const variantsRes = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id`,
      [product.id]
    );

    const variants = variantsRes.rows;

    /* ---------------------------------------
       3️⃣ Fetch images grouped by COLOR
       (NOT by variant)
    --------------------------------------- */
    const colorImgRes = await pool.query(
      `SELECT color, image_url
       FROM product_images
       WHERE product_id = $1
       ORDER BY id`,
      [product.id]
    );

    const colorImages = {};
    colorImgRes.rows.forEach(r => {
      if (!colorImages[r.color]) colorImages[r.color] = [];
      colorImages[r.color].push(r.image_url);
    });

    /* ---------------------------------------
       4️⃣ Attach images to variants by color
    --------------------------------------- */
    const variantsWithImages = variants.map(v => ({
      ...v,
      images: colorImages[v.color] || []   // ⭐ 根据颜色取图
    }));

    /* ---------------------------------------
       5️⃣ Fetch options (normalize)
    --------------------------------------- */
    const optionsRes = await pool.query(
      `
      SELECT o.name AS option_name, v.value
      FROM product_options o
      LEFT JOIN product_option_values v ON v.option_id = o.id
      WHERE o.product_id = $1
      ORDER BY o.id
      `,
      [product.id]
    );

    const optionObj = {};
    optionsRes.rows.forEach(row => {
      if (!row.option_name) return;

      const key = row.option_name.trim().toLowerCase();
      const normalized =
        key === "color"
          ? "Color"
          : key === "size"
          ? "Size"
          : key.charAt(0).toUpperCase() + key.slice(1);

      if (!optionObj[normalized]) optionObj[normalized] = [];
      if (row.value) optionObj[normalized].push(row.value);
    });

    /* ---------------------------------------
       6️⃣ Set main image if missing
    --------------------------------------- */
    if (!product.main_image) {
      const firstColor = Object.keys(colorImages)[0];
      if (firstColor) {
        product.main_image = colorImages[firstColor][0];
      }
    }

    /* ---------------------------------------
       7️⃣ Final response
    --------------------------------------- */
    return res.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand_name: product.brand_name,
        description: product.description,
        category: product.category,
        main_image: product.main_image,
        price_min: product.price_min,
        price_max: product.price_max,
        options: optionObj,
        colorImages,          // ⭐ 前端切换颜色用这个
        variants: variantsWithImages
      }
    });

  } catch (err) {
    console.error("❌ getProductBySlugOrId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};




/* ============================================================
   ⭐ DEFAULT EXPORT — FIXES ALL YOUR ROUTER ERRORS
   ============================================================ */
export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllBrands,
  getAllCategories,
  getProductBySlugOrId
};
