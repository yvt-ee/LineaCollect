import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Account.css";
import api from "../api/axiosInstance";

// Modals
import AddressModal from "../components/modals/AddressModal";
import EditAddressModal from "../components/modals/EditAddressModal";
import PasswordModal from "../components/modals/PasswordModal";
import ProfileModal from "../components/modals/ProfileModal"; // ⭐ NEW

export default function Account() {
  const { user, logout } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  /* ====================== LOAD USER DATA ====================== */
  useEffect(() => {
    if (!user) return;

    api.get("/addresses").then((res) => setAddresses(res.data));
    api.get("/orders").then((res) => setOrders(res.data));
  }, [user]);

  /* ====================== DEFAULT ADDRESS ====================== */
  async function setDefaultAddress(id) {
    await api.put(`/addresses/${id}/default`);
    const updated = await api.get("/addresses");
    setAddresses(updated.data);
  }

  async function deleteAddress(id) {
    await api.delete(`/addresses/${id}`);
    const updated = await api.get("/addresses");
    setAddresses(updated.data);
  }

  /* ====================== NOT LOGGED IN → SHOW CREATE ACCOUNT ====================== */
  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2>Welcome</h2>
          <p className="auth-subtitle">Log in to your account or create a new one.</p>

          <div className="auth-btn-row">
            <a href="/login" className="auth-btn primary">Login</a>
            <a href="/register" className="auth-btn secondary">Create Account</a>
          </div>
        </div>
      </div>
    );
  }

/* ====================== LOGGED IN ====================== */
return (
  <div className="account-container">
    
    {/* ========== PROFILE ========== */}
    <section className="account-section">
      <h2>Profile</h2>

      <div className="profile-card">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>

        <div className="profile-actions">
          <button 
            className="primary-btn"
            onClick={() => setShowProfileModal(true)}
          >
            Edit Profile
          </button>

          <button 
            className="secondary-btn" 
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
        </div>
      </div>
    </section>


    {/* ========== ADDRESSES ========== */}
    <section className="account-section">
      <h2>Saved Addresses</h2>

      <button className="primary-btn" onClick={() => setShowAddModal(true)}>
        + Add Address
      </button>

      <div className="address-grid">
        {addresses.map((a) => (
          <div key={a.id} className="address-card">
            
            {/* Name */}
            <p><strong>{a.first_name} {a.last_name}</strong></p>

            {/* Address lines */}
            <p>{a.address_line1}</p>
            {a.address_line2 && <p>{a.address_line2}</p>}

            {/* Phone (optional) */}
            {a.phone && <p>{a.phone}</p>}

            {/* City / State / Zip */}
            <p>{a.city}, {a.state} {a.postal_code}</p>

            {/* Country */}
            <p>{a.country}</p>

            {a.is_default && <span className="badge-default">Default</span>}

            <div className="address-actions">
              <button onClick={() => setShowEditModal(a)}>Edit</button>

              {!a.is_default && (
                <button onClick={() => setDefaultAddress(a.id)}>
                  Set Default
                </button>
              )}

              <button onClick={() => deleteAddress(a.id)} className="danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

      {/* ========== ORDER HISTORY ========== */}
      <section className="account-section">
        <h2>Order History</h2>

        {orders.length === 0 && <p>No orders yet.</p>}

        <div className="order-list">
          {orders.map((o) => (
            <div key={o.id} className="order-card">
              <div className="order-header">
                <strong>Order #{o.id}</strong>
                <span>{new Date(o.created_at).toLocaleDateString()}</span>
              </div>

              <p>Status: {o.status}</p>
              <p>Total: ${o.total_amount}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== LOGOUT BUTTON ========== */}
      <button className="logout-btn" onClick={logout}>
        Logout
      </button>

      {/* ========== MODALS ========== */}
      {showAddModal && (
        <AddressModal
          onClose={() => setShowAddModal(false)}
          onSaved={setAddresses}
        />
      )}

      {showEditModal && (
        <EditAddressModal
          address={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSaved={setAddresses}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
