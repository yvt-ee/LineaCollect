import { useEffect, useState } from "react";
import ProductsAPI from "../../api/ProductsAPI";
import SmartSelect from "./SmartSelect";
import "./AddProduct.css";

export default function AddProduct({ onBack, reload }) {
  /* ----------------------------------------
      ① 全局 Product 字段
  ---------------------------------------- */
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [isActive, setIsActive] = useState(true);

  /* ----------------------------------------
      ② 选项 Options（Color / Size）
  ---------------------------------------- */
  const [colors, setColors] = useState([]);     // ["Gold","Silver"]
  const [sizes, setSizes] = useState([]);       // ["6","7","8"]

  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");

  /* ----------------------------------------
      ③ 每个 Color 的图片 + Variants
  ---------------------------------------- */
  const [colorBlocks, setColorBlocks] = useState({});
  /*
    colorBlocks = {
      Gold: {
        images: File[],
        variants: [
          { size: "6", sku:"GOLD-6", price:99, stock:10 },
          { size: "7", sku:"GOLD-7", price:99, stock:8 }
        ]
      },
      Silver: {...}
    }
  */

  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [loading, setLoading] = useState(false);

  /* ----------------------------------------
      → Load brand/category metadata
  ---------------------------------------- */
  useEffect(() => {
    loadMeta();
  }, []);

  async function loadMeta() {
    const brandsRes = await ProductsAPI.fetchBrands(); // [{id,name}]
    const catsRes = await ProductsAPI.fetchCategories(); // ["Ring","Bag"]

    setBrandOptions(brandsRes.map((b) => b.name));
    setCategoryOptions(catsRes);
  }

  /* ----------------------------------------
      自动生成 slug
  ---------------------------------------- */
  useEffect(() => {
    setSlug(
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  }, [name]);

  /* ----------------------------------------
      添加 Color
  ---------------------------------------- */
  function addColor() {
    const c = colorInput.trim();
    if (!c) return;

    if (!colors.includes(c)) {
      setColors([...colors, c]);
      setColorBlocks({
        ...colorBlocks,
        [c]: { images: [], variants: [] },
      });
    }

    setColorInput("");
  }

  /* ----------------------------------------
      添加 Size
  ---------------------------------------- */
  function addSize() {
    const s = sizeInput.trim();
    if (!s) return;

    if (!sizes.includes(s)) {
      setSizes([...sizes, s]);
    }

    setSizeInput("");
  }

  /* ----------------------------------------
      上传 Color 图片
  ---------------------------------------- */
  function handleColorImages(color, files) {
    setColorBlocks({
      ...colorBlocks,
      [color]: {
        ...colorBlocks[color],
        images: Array.from(files),
      },
    });
  }

  /* ----------------------------------------
      设置某个 variat 的字段
  ---------------------------------------- */
  function updateVariant(color, index, key, value) {
    const updated = [...colorBlocks[color].variants];
    updated[index] = { ...updated[index], [key]: value };

    setColorBlocks({
      ...colorBlocks,
      [color]: { ...colorBlocks[color], variants: updated },
    });
  }

  /* ----------------------------------------
      创建当前 Color 的 variants（基于 sizes）
  ---------------------------------------- */
  function generateVariantsForColor(color) {
    const variants = sizes.map((sz) => ({
      size: sz,
      sku: `${color}-${sz}`.toUpperCase(),
      price: priceMin || 0,
      stock: 0,
    }));

    setColorBlocks({
      ...colorBlocks,
      [color]: { ...colorBlocks[color], variants },
    });
  }

  /* ----------------------------------------
      保存 1 个 Color batch → 调后端 createProduct
  ---------------------------------------- */
  async function saveColor(color) {
    const block = colorBlocks[color];
    if (!block) return;

    if (block.images.length === 0) {
      alert(`Color "${color}" must have images`);
      return;
    }

    if (!block.variants || block.variants.length === 0) {
      alert(`Color "${color}" has no variants`);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("brandName", brand);
    formData.append("category", category);
    formData.append("description", description);

    formData.append("price_min", priceMin);
    formData.append("price_max", priceMax || priceMin);

    formData.append("is_active", isActive);

    formData.append("color", color);

    formData.append("variants", JSON.stringify(block.variants));

    const options = {
      Color: colors,
      Size: sizes,
    };
    formData.append("options", JSON.stringify(options));

    block.images.forEach((file) => formData.append("images", file));

    try {
      setLoading(true);
      await ProductsAPI.createProduct(formData);
      alert(`Color "${color}" saved successfully`);
      reload();
      onBack();
    } catch (err) {
      console.error("❌ Create product error:", err);
      alert("Create product failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------
      UI rendering
  ---------------------------------------- */
  return (
    <div className="add-product-form">
      <h2>➕ Add New Product</h2>

      {/* =====================================================
          1) Product 基础信息
      ===================================================== */}
      <label>Product Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>Slug</label>
      <input value={slug} readOnly />

      <SmartSelect
        label="Brand"
        options={brandOptions}
        value={brand}
        onChange={setBrand}
        placeholder="Type or select brand…"
      />

      <SmartSelect
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={setCategory}
        placeholder="Type or select category…"
      />

      <label>Description</label>
      <textarea
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="row">
        <div>
          <label>Price Min</label>
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
        </div>

        <div>
          <label>Price Max</label>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active product
      </label>

      {/* =====================================================
          2) Options: Color + Size
      ===================================================== */}
      <h3>Options</h3>

      <div className="row">
        <div className="opt-box">
          <label>Add Color</label>
          <input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            placeholder="e.g. Gold"
          />
          <button type="button" onClick={addColor}>
            Add
          </button>

          <div className="tag-list">
            {colors.map((c) => (
              <span key={c} className="tag">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="opt-box">
          <label>Add Size</label>
          <input
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="e.g. 6, 7"
          />
          <button type="button" onClick={addSize}>
            Add
          </button>

          <div className="tag-list">
            {sizes.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================
          3) Color Blocks
      ===================================================== */}
      {colors.map((color) => {
        const block = colorBlocks[color];
        return (
          <div key={color} className="color-block">
            <h3>Color: {color}</h3>

            {/* 图片上传 */}
            <label>Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleColorImages(color, e.target.files)}
            />
            {block?.images?.length > 0 && (
              <p>{block.images.length} image(s) selected</p>
            )}

            {/* Variants */}
            <button
              type="button"
              onClick={() => generateVariantsForColor(color)}
            >
              Generate variants for this color
            </button>

            {block?.variants?.length > 0 && (
              <table className="variant-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>

                <tbody>
                  {block.variants.map((v, index) => (
                    <tr key={index}>
                      <td>{v.size}</td>
                      <td>
                        <input
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(color, index, "sku", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(color, index, "price", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(color, index, "stock", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              type="button"
              disabled={loading}
              className="save-color-btn"
              onClick={() => saveColor(color)}
            >
              Save {color} Batch
            </button>
          </div>
        );
      })}

      <button className="secondary" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
