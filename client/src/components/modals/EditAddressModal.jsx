import "./Modal.css";
import api from "../../api/axiosInstance";
import { useState } from "react";

export default function EditAddressModal({ address, onClose, onSaved }) {

  const [form, setForm] = useState(address);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    await api.put(`/addresses/${address.id}`, form);
    const updated = await api.get("/addresses");
    onSaved(updated.data);
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Edit Address</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {Object.keys(form).map((key) =>
            key !== "id" && key !== "is_default" ? (
              <input
                key={key}
                name={key}
                placeholder={key.replace("_", " ").toUpperCase()}
                value={form[key]}
                onChange={handleChange}
              />
            ) : null
          )}

          <button className="primary-btn">Save Changes</button>
          <button className="secondary-btn" onClick={onClose} type="button">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
