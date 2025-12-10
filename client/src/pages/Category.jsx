// src/pages/Category.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import "./Products.css";

import {
  fetchProductsByCategory,
  fetchNewIn,
  fetchBestSellers,
  fetchSale,
} from "../api/CategoriesAPI";

// Pretty title (bracelets → Bracelets)
const pretty = (slug = "") =>
  slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

// ⭐ Since your real API already is clean, we only unify a few fields
function normalize(p) {
  return {
    ...p,

    // 品牌
    brandname: p.brandname ?? p.brand_name ?? "",

    // 图片字段（和 Products.jsx 完全一致）
    main_image: p.main_image ?? "/fallback.jpg",

    // slug 一定存在
    slug: p.slug ?? p.id ?? "",

    // 价格（后端给的最终结构）
    price: p.price ? Number(p.price) : null,
    price_min: p.price_min ? Number(p.price_min) : null,
    price_max: p.price_max ? Number(p.price_max) : null,
  };
}

export default function Category() {
  const { categoryName } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const slug = categoryName.toLowerCase();
        let data;

        // ⭐ Special categories:
        if (slug === "new-in") data = await fetchNewIn();
        else if (slug === "best-sellers") data = await fetchBestSellers();
        else if (slug === "sale") data = await fetchSale();
        else data = await fetchProductsByCategory(categoryName);

        console.log("📦 Raw category data:", data);

        // ⭐ Support both [] and {products: []}
        const list = Array.isArray(data)
          ? data
          : data?.products
          ? data.products
          : [];

        // ⭐ Final normalized products
        const final = list.map(normalize);

        console.log("🎯 Normalized category products:", final);
        setProducts(final);
      } catch (err) {
        console.error("❌ Category API error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [categoryName]);

  if (loading)
    return <p style={{ textAlign: "center", marginTop: 50 }}>Loading...</p>;

  return (
    <div className="products-page">
      <h2 className="page-title">{pretty(categoryName)}</h2>

      {products.length === 0 ? (
        <p style={{ textAlign: "center" }}>No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
