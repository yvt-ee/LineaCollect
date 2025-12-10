import { useState } from "react";
import AdminAPI from "../../api/AdminAPI";

export default function VariantManager({ product }) {
  const { product: p, variants } = product;

  const [newVariant, setNewVariant] = useState({
    color: "",
    size: "",
    price: "",
    stock: "",
  });

  function handleChange(e) {
    setNewVariant({ ...newVariant, [e.target.name]: e.target.value });
  }

  async function addVariant() {
    await AdminAPI.Variants.add(p.id, newVariant);
    window.location.reload();
  }

  async function deleteVariant(id) {
    await AdminAPI.Variants.delete(id);
    window.location.reload();
  }

  return (
    <div className="variant-manager">
      <h3>Variants</h3>

      <table className="variant-table">
        <thead>
          <tr>
            <th>Color</th>
            <th>Size</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.id}>
              <td>{v.color}</td>
              <td>{v.size}</td>
              <td>${v.price}</td>
              <td>{v.stock}</td>
              <td>
                <button className="danger" onClick={() => deleteVariant(v.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {/* Add row */}
          <tr>
            <td>
              <input name="color" onChange={handleChange} />
            </td>
            <td>
              <input name="size" onChange={handleChange} />
            </td>
            <td>
              <input name="price" type="number" onChange={handleChange} />
            </td>
            <td>
              <input name="stock" type="number" onChange={handleChange} />
            </td>
            <td>
              <button className="primary-btn" onClick={addVariant}>
                + Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
