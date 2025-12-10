import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "./Products.css";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    try {
      const res = await axiosInstance.get("/products");
      const list = res.data || [];

      const normalized = list.map((p) => ({
        ...p,
        brandname: p.brandname ?? p.brand_name ?? "",
        price: p.price ? Number(p.price) : null,
        price_min: p.price_min ? Number(p.price_min) : null,
        price_max: p.price_max ? Number(p.price_max) : null,
      }));

      setProducts(normalized);
    } catch (err) {
      console.error("❌ Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="products-page">
      <h2 className="page-title">All Products</h2>

      <div className="product-grid">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="product-card"
          >
            <div className="product-img-wrap">
              <img
                src={p.main_image || "/fallback.jpg"}
                alt={p.name}
                onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
              />
            </div>

            <div className="product-info">
              <p className="product-brand">{p.brandname}</p>

              <h3 className="product-name">{p.name}</h3>

              {/* ⭐ 完整统一价格逻辑（与 ProductCard.jsx 完全一致） */}
              <p className="product-price">
                {p.price_min != null && p.price_max != null
                  ? p.price_min === p.price_max
                    ? `$${p.price_min.toFixed(2)}`
                    : `$${p.price_min.toFixed(2)} – $${p.price_max.toFixed(2)}`
                  : p.price != null
                  ? `$${p.price.toFixed(2)}`
                  : "Price unavailable"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
