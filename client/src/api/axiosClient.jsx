// src/aoi/axiosClient.jsx
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL; 
console.log("📡 API Base:", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ================================
// 🔐 Attach accessToken
// ================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ================================
// 🔁 Auto-refresh token
// ================================
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // refresh token (your backend route)
        const refreshRes = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data.accessToken;
        localStorage.setItem("accessToken", newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (e) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
