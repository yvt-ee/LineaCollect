// seedDatabase.js — FULL MODE
import { pool } from "./database.js";
import seed from "../data/seed.js";

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("🌱 Starting FULL seed...");
    await client.query("BEGIN");

    const {
      users,
      refreshTokens,
      userAddresses,
      brands,
      products,
      reviews,
      wishlist,
      promotions,
      promotionProducts,
      inventoryLogs,
      inventoryReservations
    } = seed;

    // =======================================================
    // USERS
    // =======================================================
    const userIdByEmail = new Map();
    for (const u of users) {
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [u.name, u.email, u.password_hash, u.role, u.is_active ?? true]
      );
      userIdByEmail.set(u.email, rows[0].id);
    }

    // =======================================================
    // REFRESH TOKENS
    // =======================================================
    for (const rt of refreshTokens) {
      const userId = userIdByEmail.get(rt.user_email);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, rt.token, rt.device_info, rt.ip_address, rt.expires_at]
      );
    }

    // =======================================================
    // ADDRESSES
    // =======================================================
    for (const addr of userAddresses) {
      const uid = userIdByEmail.get(addr.user_email);

      await client.query(
        `
        INSERT INTO user_addresses (
          user_id,
          first_name,
          last_name,
          address_line1,
          address_line2,
          phone,
          city,
          state,
          postal_code,
          country,
          is_default
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          uid,
          addr.first_name || null,
          addr.last_name || null,
          addr.address_line1,
          addr.address_line2 || null,
          addr.phone || null,
          addr.city,
          addr.state || null,
          addr.postal_code || null,
          addr.country,
          addr.is_default ?? false
        ]
      );
    }

    
    // =======================================================
    // BRANDS
    // =======================================================
    const brandIdByName = new Map();
    for (const b of brands) {
      const { rows } = await client.query(
        `INSERT INTO brands (name, description, is_active)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [b.name, b.description, b.is_active ?? true]
      );
      brandIdByName.set(b.name, rows[0].id);
    }

    // =======================================================
    // PRODUCTS + OPTIONS + VARIANTS + COLOR IMAGES
    // =======================================================
    const productIdBySlug = new Map();
    const variantIdBySKU = new Map();

    for (const p of products) {
      const brandId = brandIdByName.get(p.brandName);

      const { rows: prodRows } = await client.query(
        `INSERT INTO products (name, slug, brand_id, category, description, main_image)
         VALUES ($1, $2, $3, $4, $5, NULL)
         RETURNING id`,
        [p.name, p.slug, brandId, p.category, p.description]
      );

      const productId = prodRows[0].id;
      productIdBySlug.set(p.slug, productId);

      // -----------------------------
      // PRODUCT OPTIONS
      // -----------------------------
      const optionIdByName = new Map();
      for (const [optionName, values] of Object.entries(p.options || {})) {
        const { rows } = await client.query(
          `INSERT INTO product_options (product_id, name)
           VALUES ($1, $2)
           RETURNING id`,
          [productId, optionName]
        );
        optionIdByName.set(optionName, rows[0].id);

        // option VALUES
        for (const val of values) {
          await client.query(
            `INSERT INTO product_option_values (option_id, value)
             VALUES ($1, $2)`,
            [rows[0].id, val]
          );
        }
      }

      // -----------------------------
      // VARIANTS
      // -----------------------------
      for (const v of p.variants) {
        const { rows: varRows } = await client.query(
          `INSERT INTO product_variants
            (product_id, sku, price, discount, stock, color, size)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            productId,
            v.sku,
            v.price,
            v.discount || 0,
            v.stock || 0,
            v.color || null,
            v.size || null
          ]
        );

        const variantId = varRows[0].id;
        variantIdBySKU.set(v.sku, variantId);
      }

      // -----------------------------
      // COLOR → IMAGES  (product_images)
      // -----------------------------
      for (const [color, imgs] of Object.entries(p.colorImages || {})) {
        for (const url of imgs) {
          await client.query(
            `INSERT INTO product_images (product_id, color, image_url)
             VALUES ($1, $2, $3)`,
            [productId, color, url]
          );
        }
      }
    }

    // =======================================================
    // REVIEWS
    // =======================================================
    for (const r of reviews) {
      const pid = productIdBySlug.get(r.product_slug);
      const uid = userIdByEmail.get(r.user_email);

      await client.query(
        `INSERT INTO reviews (product_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)`,
        [pid, uid, r.rating, r.comment]
      );
    }

    // =======================================================
    // WISHLIST
    // =======================================================
    for (const w of wishlist) {
      const pid = productIdBySlug.get(w.product_slug);
      const uid = userIdByEmail.get(w.user_email);

      await client.query(
        `INSERT INTO wishlist_items (user_id, product_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [uid, pid]
      );
    }

    // =======================================================
    // PROMOTIONS
    // =======================================================
    const promoIdByName = new Map();
    for (const promo of promotions) {
      const { rows } = await client.query(
        `INSERT INTO promotions (name, discount, starts_at, ends_at, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          promo.name,
          promo.discount,
          promo.starts_at,
          promo.ends_at,
          promo.is_active ?? true
        ]
      );
      promoIdByName.set(promo.name, rows[0].id);
    }

    // PROMOTION → PRODUCTS
    for (const pp of promotionProducts) {
      const promoId = promoIdByName.get(pp.promotion_name);
      const productId = productIdBySlug.get(pp.product_slug);

      await client.query(
        `INSERT INTO promotion_products (promotion_id, product_id)
         VALUES ($1, $2)`,
        [promoId, productId]
      );
    }

    // =======================================================
    // INVENTORY LOGS
    // =======================================================
    for (const log of inventoryLogs) {
      const variantId = variantIdBySKU.get(log.variant_sku);
      await client.query(
        `INSERT INTO inventory_logs (variant_id, change_amount, reason)
         VALUES ($1, $2, $3)`,
        [variantId, log.change_amount, log.reason]
      );
    }

    // =======================================================
    // INVENTORY RESERVATIONS
    // =======================================================
    for (const r of inventoryReservations) {
      const variantId = variantIdBySKU.get(r.variant_sku);
      const userId = userIdByEmail.get(r.user_email);

      await client.query(
        `INSERT INTO inventory_reservations (variant_id, user_id, quantity, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [variantId, userId, r.quantity, r.expires_at]
      );
    }

    await client.query("COMMIT");
    console.log("🎉 FULL seed completed successfully!");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed error:", err);
  } finally {
    client.release();
    await pool.end();
    console.log("🔚 DB connection closed.");
  }
}

seedDatabase();
