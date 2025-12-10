import { useState } from "react";
import api from "../../api/axiosInstance";
import "./Modal.css";

export default function PasswordModal({ onClose }) {
  const [step, setStep] = useState("request"); 
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  /* ==============================
      STEP 1 — SEND CODE
  ============================== */
  async function sendCode() {
    setStatus("");

    if (!newPassword || !confirm) {
      return setStatus("Please fill in both password fields.");
    }

    if (newPassword !== confirm) {
      return setStatus("Passwords do not match.");
    }

    try {
      await api.post("/auth/change-password/request", {
        new_password: newPassword,
      });

      setStatus("✔ A verification code has been sent to your email.");
      setStep("verify");
    } catch (err) {
      console.error(err);
      setStatus("Failed to send verification code.");
    }
  }

  /* ==============================
      STEP 2 — CONFIRM & CHANGE
  ============================== */
  async function confirmPasswordChange(e) {
    e.preventDefault();
    setStatus("");

    if (!code.trim()) {
      return setStatus("Please enter the code sent to your email.");
    }

    try {
      // ❗ 后端 confirm endpoint ONLY requires { code }
      await api.post("/auth/change-password/confirm", {
        code: code.trim(),
      });

      setStatus("✔ Password updated successfully!");

      setTimeout(() => {
        onClose();
      }, 800);

    } catch (err) {
      console.error(err);
      setStatus("❌ Incorrect or expired code.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Change Password</h2>

        {/* =======================
             STEP 1 — ENTER NEW PW
        ======================= */}
        {step === "request" && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {status && <p className="modal-status">{status}</p>}

            <div className="modal-actions">
              <button className="primary-btn" type="button" onClick={sendCode}>
                Send Code
              </button>

              <button className="secondary-btn" type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* =======================
             STEP 2 — VERIFY CODE
        ======================= */}
        {step === "verify" && (
          <form onSubmit={confirmPasswordChange}>
            <input
              type="text"
              placeholder="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, ""))}
              required
            />

            {status && <p className="modal-status">{status}</p>}

            <div className="modal-actions">
              <button className="primary-btn" type="submit">
                Confirm Change
              </button>

              <button className="secondary-btn" type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
