// src/utils/axiosInstance.jsx
import axios from "axios";
import { registerExternalLogout } from "../context/AuthContext";

console.log("📡 API BASE =", import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
  withCredentials: true, // ⭐ needed to send refreshToken cookie
});

/* ======================================================
   1) Attach accessToken
====================================================== */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

/* ======================================================
   2) Refresh Token Logic
====================================================== */

let refreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,

  async (error) => {
    const original = error.config;

    // Only handle 401
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // If another refresh request is already running
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      refreshing = true;

      try {
        console.log("🔄 Refresh token START...");
        const resp = await api.post("/auth/refresh");

        const newToken = resp.data.accessToken;
        console.log("🔑 Refresh success → new token");

        localStorage.setItem("accessToken", newToken);

        // Resolve queued requests
        queue.forEach((cb) => cb(newToken));
        queue = [];
        refreshing = false;

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        console.error("❌ Refresh failed → logging out");

        queue = [];
        refreshing = false;

        // ⭐ IMPORTANT：同步触发 AuthContext.logout()
        registerExternalLogout();
        localStorage.removeItem("accessToken");

        window.location.href = "/login";

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
