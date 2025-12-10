import { useEffect, useState } from "react";
import "./Orders.css";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get("/orders/my");
        setOrders(res.data || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    }
    loadOrders();
  }, []);

  if (!user) return <div className="orders-wrapper">Loading...</div>;

  return (
    <div className="orders-wrapper">
      <h2>My Orders</h2>

      {orders.length === 0 && <p>You have no orders yet.</p>}

      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-header">
              <p className="order-id">Order #{order.id}</p>
              <p className="order-status">{order.status}</p>
            </div>

            <p className="order-total">Total: ${order.total_amount}</p>

            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.variant_id} className="order-item">
                  <img src={item.image_url} alt="" />
                  <div>
                    <p className="item-name">{item.product_name}</p>
                    <p className="item-meta">Size: {item.size} | Color: {item.color}</p>
                    <p className="item-price">${item.price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
