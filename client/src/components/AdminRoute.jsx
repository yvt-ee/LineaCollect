import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  // 未登录 → 去 login
  if (!user) return <Navigate to="/login" replace />;

  // 已登录但不是管理员 → 阻止并回首页
  if (user.role !== "admin") return <Navigate to="/" replace />;

  // 通过验证 → 显示 admin 页面
  return children;
}
