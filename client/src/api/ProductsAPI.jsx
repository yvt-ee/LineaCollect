// src/services/ProductsAPI.jsx
import api from "./axiosInstance";

console.log("📡 ProductsAPI loaded → using axios with baseURL:", api.defaults.baseURL);

/* ---------------------------------------------------
   GET ALL PRODUCTS
--------------------------------------------------- */
export async function fetchProducts(category) {
  const params = {};
  if (category) params.category = category.toLowerCase();

  const res = await api.get("/products", { params });
  return res.data;
}

/* ---------------------------------------------------
   GET SINGLE PRODUCT
--------------------------------------------------- */
export async function fetchProductById(idOrSlug) {
  const res = await api.get(`/products/${idOrSlug}`);
  return res.data;
}

/* ---------------------------------------------------
   SEARCH PRODUCTS
--------------------------------------------------- */
export async function searchProducts(query) {
  const res = await api.get("/products/search", {
    params: { q: query },
  });
  return res.data;
}

/* ---------------------------------------------------
   CREATE PRODUCT (Admin only)
--------------------------------------------------- */
export async function createProduct(formData) {
  const res = await api.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* ---------------------------------------------------
   UPDATE PRODUCT
--------------------------------------------------- */
export async function updateProduct(idOrSlug, formData) {
  const res = await api.put(`/products/${idOrSlug}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* ---------------------------------------------------
   DELETE PRODUCT
--------------------------------------------------- */
export async function deleteProduct(idOrSlug) {
  const res = await api.delete(`/products/${idOrSlug}`);
  return res.data;
}

/* ---------------------------------------------------
   META: CATEGORIES
--------------------------------------------------- */
export async function fetchCategories() {
  const res = await api.get("/products/meta/categories");
  return res.data;
}

/* ---------------------------------------------------
   META: BRANDS
--------------------------------------------------- */
export async function fetchBrands() {
  const res = await api.get("/products/meta/brands");
  return res.data;
}

/* ---------------------------------------------------
   DEFAULT EXPORT (⭐ 必须加)
--------------------------------------------------- */
export default {
  fetchProducts,
  fetchProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  fetchBrands,
};
