import api from "./axiosInstance";

const AdminAPI = {
  // -----------------------------
  // 📦 Products
  // -----------------------------
  Products: {
    getAll: () => api.get("/products/admin/all"),

    getOne: (id) => api.get(`/products/${id}/admin`),

    create: (formData) =>
      api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    update: (id, formData) =>
      api.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),

    delete: (id) => api.delete(`/products/${id}`),
  },

  // -----------------------------
  // 🏷 Brands
  // -----------------------------
  Brands: {
    getAll: () => api.get("/brands"),
  },

  // -----------------------------
  // 🗂 Categories
  // -----------------------------
  Categories: {
    getAll: () => api.get("/categories"),
  },

  // -----------------------------
  // 🖼 Images
  // -----------------------------
  Images: {
    delete: (imageId) => api.delete(`/images/${imageId}`),
    setMain: (productId, imageId) =>
      api.put(`/products/${productId}/image/${imageId}/main`),
  },

  // -----------------------------
  // 🧩 Variants
  // -----------------------------
  Variants: {
    add: (productId, data) =>
      api.post(`/products/${productId}/variants`, data),

    update: (variantId, data) =>
      api.put(`/variants/${variantId}`, data),

    delete: (variantId) =>
      api.delete(`/variants/${variantId}`),
  },
};

export default AdminAPI;
