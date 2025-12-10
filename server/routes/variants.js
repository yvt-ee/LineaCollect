// routes/variants.js
import express from "express";
import {
  getVariantsByProduct,
  getVariantById,
} from "../controllers/variants.js";

const router = express.Router();

/**
 * ----------------------------------------------------
 * ⭐ Get all variants for a product
 * GET /products/:productId/variants
 * ----------------------------------------------------
 */
router.get("/products/:productId/variants", getVariantsByProduct);

/**
 * ----------------------------------------------------
 * ⭐ Get a single variant
 * GET /variants/:variantId
 * ----------------------------------------------------
 */
router.get("/variants/:variantId", getVariantById);

export default router;
