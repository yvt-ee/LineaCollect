import { useState } from "react";
import api from "../../api/axiosInstance";
import "./Modal.css";

export default function ProfileModal({ user, onClose }) {
  const [name, setName] = useState(user.name || "");
  const [status, setStatus] = useState("");

  async function handleSave(e) {
    e.preventDefault();

    try {
      await api.put("/auth/profile", { name });

      setStatus("Saved!");

      // Refresh UI after save
      setTimeout(() => {
        window.location.reload();
      }, 400);

    } catch (err) {
      console.error("Profile update failed:", err);
      setStatus("Failed to update profile.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Edit Profile</h3>

        <form onSubmit={handleSave}>
          {/* NAME */}
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {status && <p className="modal-status">{status}</p>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary-btn">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
