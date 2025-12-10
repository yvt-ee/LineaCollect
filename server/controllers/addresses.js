// controllers/address.js
import { pool } from "../config/database.js";

/* ============================================================
   GET ALL ADDRESSES FOR CURRENT USER
   ============================================================ */
export const getAddresses = async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM user_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, id ASC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ getAddresses error:", err);
    res.status(500).json({ error: "Failed to load addresses" });
  }
};

/* ============================================================
   ADD ADDRESS
   ============================================================ */
export const addAddress = async (req, res) => {
  const userId = req.user.id;
  const {
    first_name,
    last_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    is_default
  } = req.body;

  if (!address_line1 || !city || !country) {
    return res.status(400).json({
      error: "Address line, city, and country are required.",
    });
  }

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // If this is default → unset previous defaults
    if (is_default) {
      await client.query(
        `UPDATE user_addresses 
         SET is_default = FALSE 
         WHERE user_id = $1`,
        [userId]
      );
    }

    const { rows } = await client.query(
      `
      INSERT INTO user_addresses
      (user_id, first_name, last_name, phone,
       address_line1, address_line2,
       city, state, postal_code, country,
       is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        userId,
        first_name || null,
        last_name || null,
        phone || null,
        address_line1,
        address_line2 || null,
        city,
        state || null,
        postal_code || null,
        country,
        is_default || false,
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(rows[0]);

  } catch (err) {
    console.error("❌ addAddress error:", err);
    res.status(500).json({ error: "Failed to add address" });
  }
};

/* ============================================================
   UPDATE ADDRESS
   ============================================================ */
export const updateAddress = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  const {
    first_name,
    last_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    is_default
  } = req.body;

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // If setting new default → remove others as default
    if (is_default) {
      await client.query(
        `UPDATE user_addresses 
         SET is_default = FALSE 
         WHERE user_id = $1`,
        [userId]
      );
    }

    const { rows } = await client.query(
      `
      UPDATE user_addresses
      SET 
        first_name     = $1,
        last_name      = $2,
        phone          = $3,
        address_line1  = $4,
        address_line2  = $5,
        city           = $6,
        state          = $7,
        postal_code    = $8,
        country        = $9,
        is_default     = $10
      WHERE id = $11 AND user_id = $12
      RETURNING *
      `,
      [
        first_name || null,
        last_name || null,
        phone || null,
        address_line1,
        address_line2 || null,
        city,
        state || null,
        postal_code || null,
        country,
        is_default || false,
        id,
        userId
      ]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Address not found" });
    }

    await client.query("COMMIT");

    res.json(rows[0]);

  } catch (err) {
    console.error("❌ updateAddress error:", err);
    res.status(500).json({ error: "Failed to update address" });
  }
};

/* ============================================================
   DELETE ADDRESS
   ============================================================ */
export const deleteAddress = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error("❌ deleteAddress error:", err);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

/* ============================================================
   SET DEFAULT ADDRESS
   ============================================================ */
export const setDefaultAddress = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // Remove old defaults
    await client.query(
      `UPDATE user_addresses 
       SET is_default = FALSE 
       WHERE user_id = $1`,
      [userId]
    );

    // Set new default
    const { rows } = await client.query(
      `
      UPDATE user_addresses
      SET is_default = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, userId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Address not found" });
    }

    await client.query("COMMIT");
    res.json(rows[0]);

  } catch (err) {
    console.error("❌ setDefaultAddress error:", err);
    res.status(500).json({ error: "Failed to set default" });
  }
};
