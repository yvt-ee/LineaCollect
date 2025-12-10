// routes/products.js
import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { pool } from "../config/database.js";

import ProductsController from "../controllers/products.js";
import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.js";

dotenv.config();
const router = express.Router();

/* ==============================
   🪣 AWS S3 Client（无 ACL）
   ============================== */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ==============================
   📸 Multer: Upload to S3
   ============================== */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    // ❗ 不能加 ACL（你的 bucket 已禁止 ACL）
    key: (req, file, cb) =>
      cb(null, `uploads/${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* =====================================================================
   🟦 ROUTING — 非常重要：顺序必须从“固定的路由”到“动态路由”
   ===================================================================== */

/* ------------------------------
   GET META DATA (Brands & Categories)
   ------------------------------ */
router.get("/meta/brands", ProductsController.getAllBrands);
router.get("/meta/categories", ProductsController.getAllCategories);

/* ------------------------------
   ADMIN: CREATE PRODUCT（方案 B）
   ------------------------------ */
router.post(
  "/",
  authenticate,
  requireAdmin,
  upload.array("images", 20), // 前端传 images[] 对应当前颜色的图片
  ProductsController.createProduct
);

/* ------------------------------
   ADMIN: GET ALL PRODUCTS (Raw)
   ------------------------------ */
router.get("/admin/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, b.name AS brandname
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Admin products error:", err);
    res.status(500).json({ error: "Failed to load admin products" });
  }
});

/* ------------------------------
   PUBLIC: All active products
   ------------------------------ */
router.get("/", ProductsController.getAllProducts);

/* ------------------------------
   ADMIN: UPDATE PRODUCT
   ------------------------------ */
router.put(
  "/:slugOrId",
  authenticate,
  requireAdmin,
  upload.array("images", 20),
  ProductsController.updateProduct
);

/* ------------------------------
   ADMIN: DELETE PRODUCT
   ------------------------------ */
router.delete(
  "/:slugOrId",
  authenticate,
  requireAdmin,
  ProductsController.deleteProduct
);

/* ------------------------------
   PUBLIC: GET BY ID or SLUG (放最后！)
   ------------------------------ */
router.get("/:slugOrId", ProductsController.getProductBySlugOrId);

export default router;
