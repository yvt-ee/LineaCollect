import "./Login.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import cartEvents from "../utils/cartEvents"; // ⭐ 通知 Navbar 更新

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. 登录
      const user = await login(email, password);  
      // await login(email, password);

      console.log("Logged in user:", user);  // ⭐ 放这里（成功登录后立刻打印）

      // 2. 获取 guestCart（如果存在）
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");

      // 3. 如果 guestCart 不为空 → 发送到后端 merge
      if (guestCart.length > 0) {
        await api.post("/cart/merge", { items: guestCart });
        localStorage.removeItem("guestCart");
      }

      // 4. 通知 Navbar 刷新 cart count
      cartEvents.emit("changed");

      // 5. 按角色跳转跳转
      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/account", { replace: true });
      }

    } catch (err) {
      console.error("❌ Login failed:", err);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Incorrect email or password.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>Welcome Back</h2>

        <form onSubmit={handleSubmit} className="auth-form">

          {error && <p className="auth-error">{error}</p>}

          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
