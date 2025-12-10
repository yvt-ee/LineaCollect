// src/api/CategoriesAPI.jsx
import api from "./axiosInstance";

const API_BASE = "/categories";

/* ----------------------------------------------------
   Normalize category names: “Best Sellers” → “best-sellers”
---------------------------------------------------- */
function formatCategory(cat = "") {
  return encodeURIComponent(
    cat.trim().toLowerCase().replace(/\s+/g, "-")
  );
}

/* ----------------------------------------------------
   Dispatcher:
   New In / Best Sellers / Sale / Normal Category
---------------------------------------------------- */
export async function fetchProductsByCategory(category) {
  if (!category) throw new Error("Category required");

  const c = formatCategory(category);
  return request(`${API_BASE}/${c}`, `Failed to fetch category "${category}"`);
}

/* ----------------------------------------------------
   New In
---------------------------------------------------- */
export async function fetchNewIn() {
  return request(`${API_BASE}/new-in`, "Failed to fetch new-in products");
}

/* ----------------------------------------------------
   Best Sellers
---------------------------------------------------- */
export async function fetchBestSellers() {
  return request(`${API_BASE}/best-sellers`, "Failed to fetch best-sellers");
}

/* ----------------------------------------------------
   Sale
---------------------------------------------------- */
export async function fetchSale() {
  return request(`${API_BASE}/sale`, "Failed to fetch sale products");
}

/* ----------------------------------------------------
   Unified request helper (axios)
---------------------------------------------------- */
async function request(url, errorMessage) {
  try {
    const res = await api.get(url);
    return res.data;
  } catch (err) {
    console.error(`❌ ${errorMessage}:`, err);
    throw new Error(errorMessage);
  }
}
