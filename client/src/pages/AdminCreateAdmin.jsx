import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export default function AdminCreateAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleCreate() {
    setMsg("");

    try {
      const res = await axiosInstance.post("/admin/create", { email, password });
      setMsg("✅ Admin created successfully!");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to create admin.");
    }
  }

  return (
    <div className="admin-create-container">
      <h2>Create New Admin</h2>

      <input
        type="email"
        placeholder="Admin Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleCreate}>Create Admin</button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
