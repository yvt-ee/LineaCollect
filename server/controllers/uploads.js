// routes/uploads.js
import express from "express";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/**
 * 📤 Upload multiple images to S3
 * Route: POST /api/uploads
 * Field name: images[]
 */
router.post("/", upload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const files = req.files.map((file) => ({
      url: file.location,
      key: file.key,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return res.status(200).json({
      message: "✅ Uploaded successfully",
      count: files.length,
      files,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
