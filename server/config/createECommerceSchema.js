// createECommerceSchema.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function createECommerceSchema() {
  try {
    console.log("🧨 Dropping old schema objects...");

    // Drop trigger safely
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_price_range') THEN
          DROP TRIGGER trg_update_price_range ON product_variants;
        END IF;
      EXCEPTION WHEN undefined_table THEN NULL;
      END $$;
    `);

    // Drop tables in dependency order
    await pool.query(`
      DROP VIEW IF EXISTS product_summary CASCADE;

      DROP TABLE IF EXISTS
        inventory_reservations,
        payments,
        wishlist_items,
        refresh_tokens,
        inventory_logs,
        order_items,
        orders,
        cart_items,
        product_images,
        product_variants,
        product_option_values,
        product_options,
        promotion_products,
        promotions,
        products,
        brands,
        reviews,
        user_addresses,
        users
      CASCADE;

      DROP FUNCTION IF EXISTS update_product_price_range() CASCADE;
    `);

    console.log("🛠 Creating enhanced schema...");

    // USERS
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // REFRESH TOKENS (session-based auth)
    await pool.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ADDRESSES
    await pool.query(`
      CREATE TABLE user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        phone VARCHAR(50),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);



    // BRANDS
    await pool.query(`
      CREATE TABLE brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // PRODUCTS
    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        main_image TEXT,
        price_min DECIMAL(10,2),
        price_max DECIMAL(10,2),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // PRODUCT OPTIONS (e.g. Metal, Length)
    await pool.query(`
      CREATE TABLE product_options (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL
      );
    `);

    // OPTION VALUES (e.g. Gold, Silver)
    await pool.query(`
      CREATE TABLE product_option_values (
        id SERIAL PRIMARY KEY,
        option_id INT REFERENCES product_options(id) ON DELETE CASCADE,
        value VARCHAR(50) NOT NULL
      );
    `);

    // VARIANTS
    await pool.query(`
      CREATE TABLE product_variants (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100) UNIQUE,
        price DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        stock INT DEFAULT 0,
        color VARCHAR(50),
        size VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // PRODUCT IMAGES
    await pool.query(`
      CREATE TABLE product_images (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        color VARCHAR(50),
        image_url TEXT NOT NULL,
        media_type VARCHAR(20) DEFAULT 'image',
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // MAIN IMAGE TRIGGER FUNCTION
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_product_main_image()
      RETURNS TRIGGER AS $$
      DECLARE
        firstImage TEXT;
      BEGIN
        SELECT image_url INTO firstImage
        FROM product_images
        WHERE product_id = NEW.product_id
        ORDER BY id ASC
        LIMIT 1;

        UPDATE products
        SET main_image = firstImage
        WHERE id = NEW.product_id
          AND (main_image IS NULL OR main_image = '');

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      CREATE TRIGGER trg_set_product_main_image
      AFTER INSERT ON product_images
      FOR EACH ROW EXECUTE FUNCTION set_product_main_image();
    `);


    // CART
    await pool.query(`
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        variant_id INT REFERENCES product_variants(id) ON DELETE CASCADE,
        quantity INT DEFAULT 1,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, variant_id)
      );
    `);

    // ORDERS
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        address_id INT REFERENCES user_addresses(id),
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ORDER ITEMS
    await pool.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        variant_id INT REFERENCES product_variants(id),
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0
      );
    `);

    // PAYMENTS
    await pool.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        provider VARCHAR(50),
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // INVENTORY LOG
    await pool.query(`
      CREATE TABLE inventory_logs (
        id SERIAL PRIMARY KEY,
        variant_id INT REFERENCES product_variants(id),
        change_amount INT NOT NULL,
        reason VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // INVENTORY RESERVATION (for checkout)
    await pool.query(`
      CREATE TABLE inventory_reservations (
        id SERIAL PRIMARY KEY,
        variant_id INT REFERENCES product_variants(id),
        user_id INT REFERENCES users(id),
        quantity INT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // WISHLIST
    await pool.query(`
      CREATE TABLE wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
    `);

    // REVIEWS
    await pool.query(`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // PROMOTIONS
    await pool.query(`
      CREATE TABLE promotions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        discount DECIMAL(10,2) NOT NULL,
        starts_at TIMESTAMP NOT NULL,
        ends_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // PROMOTION MAPPING
    await pool.query(`
      CREATE TABLE promotion_products (
        id SERIAL PRIMARY KEY,
        promotion_id INT REFERENCES promotions(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // PRICE RANGE TRIGGER
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_product_price_range()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE products
        SET price_min = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id),
            price_max = (SELECT MAX(price) FROM product_variants WHERE product_id = NEW.product_id),
            updated_at = NOW()
        WHERE id = NEW.product_id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      CREATE TRIGGER trg_update_price_range
      AFTER INSERT OR UPDATE ON product_variants
      FOR EACH ROW EXECUTE FUNCTION update_product_price_range();
    `);

    // INDEXES
    await pool.query(`
      CREATE INDEX idx_products_category ON products(category);
      CREATE INDEX idx_variants_product_id ON product_variants(product_id);
      CREATE INDEX idx_orders_user ON orders(user_id);
      CREATE INDEX idx_cart_user ON cart_items(user_id);
    `);

    // SUMMARY VIEW
    await pool.query(`
      CREATE VIEW product_summary AS
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.slug,
        b.name AS brand_name,
        p.category,
        p.price_min,
        p.price_max,
        p.main_image,
        COUNT(v.id) AS variant_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants v ON v.product_id = p.id
      GROUP BY p.id, b.name;
    `);

    console.log("🎉 Schema created successfully!");

  } catch (err) {
    console.error("⚠️ Error creating schema:", err);
  } finally {
    await pool.end();
    console.log("🔚 Connection closed.");
  }
}

createECommerceSchema();
