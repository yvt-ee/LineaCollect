import { useEffect, useState } from "react";
import AdminAPI from "../../api/AdminAPI";
import ImageManager from "./ImageManager";
import VariantManager from "./VariantManager";
import "./admin.css";


export default function ProductEditor({ product, onBack, reload }) {
  const isNew = !product;

  const [form, setForm] = useState({
    name: "",
    brandName: "",
    category: "",
    description: "",
    price: "",
  });

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Load dropdown lists
  useEffect(() => {
    AdminAPI.Brands.getAll().then((res) => setBrands(res.data));
    AdminAPI.Categories.getAll().then((res) => setCategories(res.data));

    if (product) {
      setForm({
        name: product.product.name,
        brandName: product.product.brandname,
        category: product.product.category,
        description: product.product.description,
        price: product.product.price_min || product.product.price,
      });
    }
  }, [product]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    if (isNew) {
      await AdminAPI.Products.create(fd);
    } else {
      await AdminAPI.Products.update(product.product.id, fd);
    }

    reload();
    onBack();
  }

  return (
    <div className="editor">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <h2>{isNew ? "Add Product" : "Edit Product"}</h2>

      <div className="editor-grid">

        {/* ========== LEFT FORM ========== */}
        <div className="form-panel">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} />

          <label>Brand</label>
          <select name="brandName" value={form.brandName} onChange={handleChange}>
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          <label>Base Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
          />

          <button className="primary-btn save" onClick={handleSave}>
            Save Product
          </button>
        </div>

        {/* ========== RIGHT PANELS ========== */}
        {!isNew && (
          <div className="right-panels">
            <ImageManager product={product} />
            <VariantManager product={product} />
          </div>
        )}
      </div>
    </div>
  );
}
