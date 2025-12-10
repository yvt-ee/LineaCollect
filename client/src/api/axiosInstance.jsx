import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,
});

// ⭐ 自动附带 accessToken
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⭐ 自动 Refresh Token，但不会无限循环
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // 如果 refresh 本身失败 → 直接退出
    if (original.url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // 401 并且没有 retry 过
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // 如果正在 refresh → 队列等待
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers["Authorization"] = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      // 没有在刷新 → 开始刷新
      isRefreshing = true;

      try {
        const r = await api.post("/auth/refresh");
        const newToken = r.data.accessToken;

        localStorage.setItem("accessToken", newToken);

        // 通知队列继续
        refreshQueue.forEach((p) => p.resolve(newToken));
        refreshQueue = [];
        isRefreshing = false;

        // 重试原请求
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);

      } catch (err) {
        console.error("⛔ Refresh token invalid or expired");

        refreshQueue.forEach((p) =>
          p.reject(err)
        );
        refreshQueue = [];
        isRefreshing = false;

        localStorage.removeItem("accessToken");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
