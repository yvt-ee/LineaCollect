import { useEffect, useState } from "react";
import AdminAPI from "../api/AdminAPI";
import ProductList from "../components/admin/ProductList";
import ProductEditor from "../components/admin/ProductEditor";
import AddProduct from "../components/admin/AddProduct"; // 🟦 New Component
import "./AdminProducts.css";

export default function AdminProducts() {
  const [view, setView] = useState("list"); // list | edit | create
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** ============================
   *  🔄 Load all products
   *  ============================ */
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await AdminAPI.Products.getAll();
      setProducts(res.data || []);
    } catch (err) {
      console.error("❌ Admin loadProducts error:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /** ============================
   *  📝 Edit existing product
   *  ============================ */
  const handleEdit = async (id) => {
    try {
      setLoading(true);
      const res = await AdminAPI.Products.getOne(id);
      setSelectedProduct(res.data);
      setView("edit");
    } catch (err) {
      console.error("❌ Error loading product:", err);
      setError("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  /** ============================
   *  ➕ Create new product
   *  ============================ */
  const handleCreate = () => {
    setSelectedProduct(null);
    setView("create");
  };

  /** ============================
   *  🔙 Back to list
   *  ============================ */
  const backToList = () => {
    setView("list");
    loadProducts();
  };

  return (
    <div className="admin-page">

      {/* ========== Loading state ========== */}
      {loading && view === "list" && <p className="admin-loading">Loading products...</p>}

      {/* ========== Error ========== */}
      {error && <p className="admin-error">{error}</p>}

      {/* ========== LIST VIEW ========== */}
      {view === "list" && !loading && (
        <ProductList
          products={products}
          onEdit={handleEdit}
          onCreate={handleCreate}
          reload={loadProducts}
        />
      )}

      {/* ========== CREATE VIEW ========== */}
      {view === "create" && (
        <AddProduct
          onBack={backToList}
          reload={loadProducts}
        />
      )}

      {/* ========== EDIT VIEW ========== */}
      {view === "edit" && (
        <ProductEditor
          product={selectedProduct}
          onBack={backToList}
          reload={loadProducts}
        />
      )}
    </div>
  );
}
