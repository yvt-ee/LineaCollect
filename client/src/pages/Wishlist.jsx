import { useEffect, useState } from "react";
import "./Wishlist.css";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // Load wishlist
  useEffect(() => {
    async function loadWishlist() {
      try {
        const res = await api.get("/wishlist/my");
        setItems(res.data || []);
      } catch (err) {
        console.error("Failed to load wishlist", err);
      }
    }
    loadWishlist();
  }, []);

  async function removeItem(productId) {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } catch (err) {
      console.error(err);
      alert("Failed to remove item.");
    }
  }

  if (!user) return <div className="wishlist-wrapper">Loading...</div>;

  return (
    <div className="wishlist-wrapper">
      <h2>My Wishlist</h2>

      {items.length === 0 && <p>Your wishlist is empty.</p>}

      <div className="wishlist-grid">
        {items.map((item) => (
          <div key={item.product_id} className="wishlist-card">
            <Link to={`/products/${item.slug}`}>
              <img src={item.main_image} alt={item.name} />
            </Link>

            <div className="wishlist-info">
              <Link to={`/products/${item.slug}`} className="wishlist-name">
                {item.name}
              </Link>

              <p className="wishlist-brand">{item.brand_name}</p>

              <button
                className="remove-btn"
                onClick={() => removeItem(item.product_id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
