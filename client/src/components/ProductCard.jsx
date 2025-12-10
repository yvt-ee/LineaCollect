import { Link } from "react-router-dom";
import "./ProductCards.css";

export default function ProductCard({ p }) {
  return (
    <div className="product-card">
      <Link to={`/product/${p.slug}`} className="product-link">
        <img className="product-photo" src={p.main_image} alt={p.name} />
        <div className="product-info">
          <h3 className="product-name">{p.name}</h3>
          <p className="product-brand">{p.brandname}</p>
          <p className="product-category">{p.category}</p>

          {/* ⭐ Fixed pricing logic */}
          <p className="product-price">
            {p.price_min != null && p.price_max != null
              ? Number(p.price_min) === Number(p.price_max)
                ? `$${Number(p.price_min).toFixed(2)}`
                : `$${Number(p.price_min).toFixed(2)} – $${Number(p.price_max).toFixed(2)}`
              : p.price != null
              ? `$${Number(p.price).toFixed(2)}`
              : "Price unavailable"}
          </p>
        </div>
      </Link>
    </div>
  );
}
