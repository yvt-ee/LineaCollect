import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/ProductsAPI";
import "./SearchResults.css";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await fetchProducts();
        // simple name/brand/category match
        const filtered = data.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.brandname.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } catch (err) {
        console.error("❌ Error fetching search results:", err);
      } finally {
        setLoading(false);
      }
    };
    if (query) loadResults();
  }, [query]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <div className="search-results-page">
      <h2>Search results for “{query}”</h2>
      {results.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="product-grid">
          {results.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="product-card">
              <img src={p.main_image} alt={p.name} className="product-photo" />
              <div className="product-info">
                <h3>{p.name}</h3>
                <p>{p.brandname}</p>
                <p className="product-price">${p.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
