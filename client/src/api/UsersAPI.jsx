// src/api/UsersAPI.jsx
import api from "./axiosInstance";

/* ============================================================
   AUTH / USERS API
   ============================================================ */
const Auth = {
  register: (data) => api.post("/auth/register", data),

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    // 保存 token
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }

    // ⭐ 返回 user 对象本身，而不是 res.data
    return res.data.user;
  },


  logout: () => {
    localStorage.removeItem("accessToken");
    return api.post("/auth/logout");
  },

  me: () => api.get("/auth/me"),
};

/* ============================================================
   ADDRESSES API
   ============================================================ */
const Addresses = {
  getAll: () => api.get("/addresses"),
  add: (data) => api.post("/addresses", data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.put(`/addresses/${id}/default`),
};

/* ============================================================
   EXPORT: ONE UNIFIED API
   ============================================================ */
const UsersAPI = {
  Auth,
  Addresses,
};

export default UsersAPI;   // ← 修复
