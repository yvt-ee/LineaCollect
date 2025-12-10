// routes/uploads.js
import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
import { s3 } from "../config/s3.js"; // v3 S3 client

dotenv.config();

const router = express.Router();
const bucketName = process.env.AWS_S3_BUCKET;

/* ============================================
   📸 Multer + S3 configuration
   ============================================ */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    // acl: "public-read",
    key: (req, file, cb) => {
      const timestamp = Date.now();
      const cleanName = file.originalname.replace(/\s+/g, "_");
      cb(null, `uploads/${timestamp}-${cleanName}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/* ============================================
   ☝️ Single image upload
   ============================================ */
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file || !req.file.location) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  return res.status(200).json({
    message: "Upload successful",
    imageUrl: req.file.location,
  });
});

/* ============================================
   📁 Multiple image upload (optional)
   ============================================ */
router.post("/multiple", upload.array("images", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No images uploaded" });
  }

  const imageUrls = req.files.map((f) => f.location);

  return res.status(200).json({
    message: "Multiple uploads successful",
    imageUrls,
  });
});

export default router;
