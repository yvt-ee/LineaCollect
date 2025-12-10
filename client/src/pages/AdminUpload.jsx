import React, { useState, useEffect } from "react";
import "./AdminUpload.css";
import AdminAPI from "../api/AdminAPI";   // ✅ 使用合并后的 AdminAPI

const AdminUpload = () => {
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [products, setProducts] = useState([]);

  // === Fetch all products ===
  const loadProducts = async () => {
    try {
      const res = await AdminAPI.Products.getAll();
      setProducts(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!name || !brandName || !category || !price || files.length === 0) {
      alert("Please fill out all fields and select at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("brandName", brandName);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("description", description);

    files.forEach((file) => formData.append("images", file));

    try {
      setStatus("Uploading product...");
      setStatusType("loading");

      const res = await AdminAPI.Products.create(formData);

      setStatus("✅ Product uploaded successfully!");
      setStatusType("success");

      loadProducts();

      // Reset form
      setName("");
      setBrandName("");
      setPrice("");
      setCategory("");
      setDescription("");
      setFiles([]);

    } catch (err) {
      console.error("❌ Upload error:", err);
      setStatus("❌ Upload failed");
      setStatusType("error");
    }
  };

  // price helper
  const formatPrice = (p) => {
    if (p.price_min != null && p.price_max != null) {
      if (p.price_min === p.price_max) return `$${p.price_min}`;
      return `$${p.price_min} – $${p.price_max}`;
    }
    if (p.price != null) return `$${p.price}`;
    return "—";
  };

  return (
    <div className="admin-upload">
      <h2>🛍️ Product Management Dashboard</h2>

      {/* === Upload Form === */}
      <form onSubmit={handleUpload}>
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Brand Name"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Price (e.g. 199.99)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Category (e.g. bags, jewelry)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <textarea
          placeholder="Product Description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label className="file-upload">
          <input type="file" multiple accept="image/*" onChange={handleFileChange} />
          <p>📁 Click or drag images here to upload</p>
          {files.length > 0 && <p>{files.length} file(s) selected</p>}
        </label>

        <button type="submit">Upload Product</button>
      </form>

      {status && <p className={`status ${statusType}`}>{status}</p>}

      {/* === Product Table === */}
      <section className="admin-table">
        <h3>📦 All Products</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Main Image</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.brand_name || p.brandName || "—"}</td>
                  <td>{p.category}</td>
                  <td>{formatPrice(p)}</td>
                  <td>
                    {p.main_image ? (
                      <img
                        src={p.main_image}
                        alt={p.name}
                        style={{ width: "60px", borderRadius: "6px" }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminUpload;
