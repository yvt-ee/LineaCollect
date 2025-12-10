// src/api/ProductImagesAPI.jsx
import api from "./axiosInstance";

/* ============================================================
   📸 Upload images → /api/uploads
   formData must contain: images[]
============================================================ */
export async function uploadImages(formData) {
  try {
    const res = await api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data; // { message, files: [...] }
  } catch (err) {
    console.error("❌ Upload images error:", err);
    throw new Error("Failed to upload images");
  }
}

/* ============================================================
   🖼️ Get all images for a product
   Uses: GET /api/products/:id
============================================================ */
export async function fetchProductImages(productId) {
  try {
    const res = await api.get(`/products/${productId}`);
    return res.data.images || [];
  } catch (err) {
    console.error(`❌ Failed to fetch images for product ${productId}:`, err);
    throw new Error("Failed to fetch product images");
  }
}

/* ============================================================
   🗑️ Delete an image (if supported by backend)
   POST /api/uploads/delete
============================================================ */
export async function deleteImage(imageUrl) {
  try {
    const res = await api.post("/uploads/delete", { imageUrl });
    return res.data;
  } catch (err) {
    console.error("❌ Delete image error:", err);
    throw new Error("Failed to delete image");
  }
}
