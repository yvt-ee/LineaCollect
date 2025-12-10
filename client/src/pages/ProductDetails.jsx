import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import "./ProductDetails.css";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import { useSearchParams } from "react-router-dom";
import cartEvents from "../utils/cartEvents";


export default function ProductDetails() {
  const { slug } = useParams();
  const auth = useAuth();
  const user = auth?.user || null;

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // ⭐ Toast state
  const [toast, setToast] = useState(null);


  const [searchParams] = useSearchParams();



  /* ------------------------------ 
      Load product 
  ------------------------------ */
  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await axiosInstance.get(`/products/${slug}`);
        const p = res.data.product;

        setProduct(p);

        const allImages = Object.values(p.colorImages || {}).flat();
        setMainImage(allImages[0] || p.main_image || "");
      } catch (err) {
        console.error("❌ Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);


  /* ------------------------------ 
      Load reviews 
  ------------------------------ */
  useEffect(() => {
    if (!product) return;

    async function loadReviews() {
      try {
        const res = await axiosInstance.get(`/reviews/product/${product.id}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    loadReviews();
  }, [product]);

  /* ------------------------------ 
      Match variant 
  ------------------------------ */
  useEffect(() => {
    if (!product) return;

    if (!selectedColor) {
      setSelectedVariant(null);
      setSelectedSize("");
      return;
    }

    const sizesForColor = product.variants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.size);

    if (!sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0] || "");
    }

    const found = product.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
    setSelectedVariant(found || null);

    const imgs = product.colorImages[selectedColor] || [];
    if (imgs.length > 0) setMainImage(imgs[0]);
  }, [selectedColor, selectedSize, product]);

  /* ------------------------------ 
      Add to Cart with Toast 
  ------------------------------ */
  async function addToCart() {
    if (!selectedVariant) return alert("Please select size & color");

    try {
      const res = await axiosInstance.post("/cart/add", {
        variantId: selectedVariant.id,
        quantity: 1,
      });

      /* ======================================================
            GUEST CART
      ====================================================== */
      if (res.data.guest) {
        let guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");

        // ⭐ 在函数内重新计算 sizesForColor（修复你原来的 bug）
        const sizesForColor = product.variants
          .filter((v) => v.color === selectedColor)
          .map((v) => v.size);

        const existing = guestCart.find(
          (i) => i.variant_id === selectedVariant.id
        );

        if (existing) {
          existing.quantity += 1;
        } else {
          guestCart.push({
            variant_id: selectedVariant.id,
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            color: selectedColor,
            size: selectedSize,
            image: mainImage,
            price: selectedVariant.price,
            quantity: 1,

            // ⭐ 修复作用域：这些数据在 addToCart 内保证可用
            allVariants: product.variants,
            allColors: Object.keys(product.colorImages || {}),
            allSizes: sizesForColor,
            colorImages: product.colorImages,
            variantImagesByColor: product.colorImages,
          });
        }

        localStorage.setItem("guestCart", JSON.stringify(guestCart));
      }

      /* ======================================================
            Notify Navbar → 立即刷新 Cart Count
      ====================================================== */
      cartEvents.emit("changed");  // ⭐ 唯一正确事件名

      /* ======================================================
            Toast
      ====================================================== */
      setToast({
        message: `${product.name} added to cart (${selectedColor} / ${selectedSize})`,
        image: mainImage,
      });

    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    }
  }


  /* ------------------------------ 
      Wishlist 
  ------------------------------ */
  async function toggleWishlist() {
    if (!user) return alert("Please login first");

    try {
      await axiosInstance.post("/wishlist/toggle", {
        product_id: product.id,
      });
      alert("Updated wishlist");
    } catch {
      alert("Failed to update wishlist");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!product) return <h2>Product not found</h2>;

  const allImages = Object.values(product.colorImages || {}).flat();
  const sizesForColor = selectedColor
    ? product.variants
        .filter((v) => v.color === selectedColor)
        .map((v) => v.size)
    : [];

  /* -----------------------------------------
        JSX RENDER
  ----------------------------------------- */
  return (
    <>
      <div className="product-details-container">
        {/* Left Images */}
        <div className="image-section">
          <img src={mainImage} className="main-image" alt="" />

          <div className="thumbnail-row">
            {(selectedColor ? product.colorImages[selectedColor] : allImages).map(
              (img, idx) => (
                <img
                  key={idx}
                  src={img}
                  className="thumbnail"
                  onClick={() => setMainImage(img)}
                />
              )
            )}
          </div>
        </div>

        {/* Right Info */}
        <div className="info-section">
          <p className="brand">{product.brand_name}</p>
          <h2 className="name">{product.name}</h2>

          {selectedVariant ? (
            <p className="price">${selectedVariant.price}</p>
          ) : (
            <p className="price">
              ${product.price_min} – ${product.price_max}
            </p>
          )}

          <p className="desc">{product.description}</p>

          {/* Color */}
          <div className="options-group">
            <p className="option-label">Color</p>
            <div className="option-buttons">
              {Object.keys(product.colorImages || {}).map((c) => (
                <button
                  key={c}
                  className={selectedColor === c ? "opt-btn active" : "opt-btn"}
                  onClick={() => {
                    const next = selectedColor === c ? "" : c;
                    setSelectedColor(next);

                    if (!next) {
                      setMainImage(allImages[0] || product.main_image || "");
                    }
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          {selectedColor && (
            <div className="options-group">
              <p className="option-label">Size</p>
              <div className="option-buttons">
                {sizesForColor.map((s) => (
                  <button
                    key={s}
                    className={selectedSize === s ? "opt-btn active" : "opt-btn"}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          {selectedVariant && (
            <p className="stock">
              {selectedVariant.stock > 0
                ? `In stock (${selectedVariant.stock})`
                : "Out of stock"}
            </p>
          )}

          {/* Buttons */}
          <div className="buttons">
            <button className="add-cart" onClick={addToCart}>
              Add to Cart
            </button>
            <button className="wishlist-btn" onClick={toggleWishlist}>
              ❤️ Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="reviews-section">
        <h3 className="review-title">Customer Reviews</h3>

        {loadingReviews && <p>Loading reviews...</p>}

        {!loadingReviews && reviews.length === 0 && (
          <p className="no-reviews">No reviews yet</p>
        )}

        {!loadingReviews &&
          reviews.length > 0 &&
          reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-header">
                <span className="review-name">{r.user}</span>
                <span className="review-stars">
                  {"⭐".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>

              {r.comment && <p className="review-comment">{r.comment}</p>}

              <p className="review-date">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
      </div>

      {/* ⭐ Toast */}
      {toast && (
        <Toast
          message={toast.message}
          image={toast.image}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
