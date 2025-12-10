import "./Modal.css";
import api from "../../api/axiosInstance";
import { useState } from "react";

export default function AddressModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/addresses", form);
      const updated = await api.get("/addresses");

      onSaved(updated.data);
      onClose();
    } catch (err) {
      console.error("❌ Add address failed:", err);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Add Address</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
          />


          <input
            type="text"
            name="address_line1"
            placeholder="Address Line 1"
            value={form.address_line1}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="address_line2"
            placeholder="Address Line 2 (optional)"
            value={form.address_line2}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />
          
          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
          />

          <input
            type="text"
            name="postal_code"
            placeholder="Postal Code"
            value={form.postal_code}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="country"
            placeholder="Country"
            value={form.country}
            onChange={handleChange}
            required
          />

          <button type="submit" className="primary-btn">Save</button>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
