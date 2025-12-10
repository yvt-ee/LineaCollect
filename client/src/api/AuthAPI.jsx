// src/api/AuthAPI.jsx
import api from "./axiosInstance";

const AuthAPI = {
  /* -----------------------------
     REGISTER
  ----------------------------- */
  register: (name, email, password) =>
    api.post("/auth/register", { name, email, password }),

  /* -----------------------------
     LOGIN
     后端返回 accessToken
     refreshToken 写入 HttpOnly cookie
  ----------------------------- */
  login: (email, password) =>
    api.post("/auth/login", { email, password }),

  /* -----------------------------
     REFRESH ACCESS TOKEN
  ----------------------------- */
  refresh: () => api.post("/auth/refresh"),

  /* -----------------------------
     LOGOUT
  ----------------------------- */
  logout: () => api.post("/auth/logout"),

  /* -----------------------------
     CURRENT USER
     (requires accessToken)
  ----------------------------- */
  getMe: () => api.get("/auth/me"),

  /* -----------------------------
     CHANGE PASSWORD — Step 1
     Request verification code
  ----------------------------- */
  requestPasswordChange: (new_password) =>
    api.post("/auth/change-password/request", { new_password }),

  /* -----------------------------
     CHANGE PASSWORD — Step 2
     Confirm code and update password
  ----------------------------- */
  confirmPasswordChange: (code) =>
    api.post("/auth/change-password/confirm", { code }),
};

export default AuthAPI;
