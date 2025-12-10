export default function ImageManager({ product }) {
  const { images, product: p } = product;

  async function setMain(imageId) {
    await AdminAPI.Images.setMain(p.id, imageId);
    window.location.reload();
  }

  async function remove(imageId) {
    if (!window.confirm("Delete image?")) return;
    await AdminAPI.Images.delete(imageId);
    window.location.reload();
  }

  return (
    <div className="image-manager">
      <h3>Images</h3>
      <div className="image-grid">
        {images.map((img) => (
          <div key={img.id} className="image-box">
            <img src={img.image_url} />
            <div className="image-controls">
              {!img.is_main && (
                <button onClick={() => setMain(img.id)}>Set Main</button>
              )}
              <button className="danger" onClick={() => remove(img.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
