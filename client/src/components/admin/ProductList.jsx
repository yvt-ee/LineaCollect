import "./admin.css";


export default function ProductList({ products, onEdit, onCreate, reload }) {
  return (
    <div className="product-list">
      <div className="header">
        <h2>📦 Products</h2>
        <button className="primary-btn" onClick={onCreate}>
          + Add Product
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Price Range</th>
            <th>Edit</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <img src={p.main_image} className="thumb" />
              </td>
              <td>{p.name}</td>
              <td>{p.brandname}</td>
              <td>{p.category}</td>
              <td>
                {p.price_min
                  ? `$${p.price_min} - $${p.price_max}`
                  : `$${p.price}`}
              </td>
              <td>
                <button className="edit-btn" onClick={() => onEdit(p.id)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
