// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axiosInstance";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/* ============================================================
   ⭐ Global logout handler that axiosInstance will trigger
============================================================ */
let externalLogout = null;
export function registerExternalLogout(fn) {
  externalLogout = fn;
}

/* ============================================================
   ⭐ Auth Provider
============================================================ */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  // Load user on initial mount
  useEffect(() => {
    if (!accessToken) return;

    API.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("accessToken");
      });
  }, [accessToken]);

  /* -------------------------------
     LOGIN
  -------------------------------- */
  async function login(email, password) {
    const res = await API.post("/auth/login", { email, password });

    const token = res.data.accessToken;
    localStorage.setItem("accessToken", token);
    setAccessToken(token);
    setUser(res.data.user);

    return res.data.user;
  }

  /* -------------------------------
     REGISTER
  -------------------------------- */
  async function register(name, email, password) {
    const res = await API.post("/auth/register", {
      name,
      email,
      password,
    });

    const token = res.data.accessToken;
    localStorage.setItem("accessToken", token);
    setAccessToken(token);
    setUser(res.data.user);
  }

  /* -------------------------------
     LOGOUT  (axiosInstance will call this)
  -------------------------------- */
  function logout() {
    console.log("🔴 AuthContext.logout() triggered");

    API.post("/auth/logout").catch(() => {});
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUser(null);
  }

  /* ----------------------------------
     🔗 Register logout so axios can call it
  ---------------------------------- */
  useEffect(() => {
    registerExternalLogout(logout);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
