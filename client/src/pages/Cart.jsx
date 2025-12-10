import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import cartEvents from "../utils/cartEvents";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openColor, setOpenColor] = useState(null);
  const [openSize, setOpenSize] = useState(null);

  /* =====================================================
        Unified Load Cart (Guest + Logged-in)
  ===================================================== */
  async function loadCart() {
    try {
      /* ---------------------------------
         Guest Cart
      --------------------------------- */
      if (!user) {
        const guest = JSON.parse(localStorage.getItem("guestCart") || "[]");
        setItems(guest);
        return;
      }

      /* ---------------------------------
         Logged-in Cart
      --------------------------------- */
      const res = await axiosInstance.get("/cart");
      const dbItems = res.data.items || [];

      const converted = await Promise.all(
        dbItems.map(async (item) => {
          // ⭐ 使用 product_id，而不是 slug
          const productData = (
            await axiosInstance.get(`/products/${item.product_id}`)
          ).data.product;

          // ⭐ 当前颜色的所有可选 size
          const sizesForColor = productData.variants
            .filter((v) => v.color === item.color)
            .map((v) => v.size);

          return {
            variant_id: item.variant_id,
            product_id: productData.id,
            slug: productData.slug,
            name: productData.name,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: item.price,

            image:
              productData.colorImages?.[item.color]?.[0] ||
              productData.main_image,

            allVariants: productData.variants,
            allColors: Object.keys(productData.colorImages || {}),
            allSizes: sizesForColor, // ⭐ 修复
            colorImages: productData.colorImages,
          };
        })
      );

      setItems(converted);
      
    } catch (err) {
      console.error("Cart load error", err);
    }
  }

  async function reloadCart() {
    setLoading(true);
    await loadCart();
    setLoading(false);
  }

  /* =====================================================
        Init load + Listen to cart events
  ===================================================== */
  useEffect(() => {
    reloadCart();

    const unsub = cartEvents.on("changed", () => reloadCart());
    return () => unsub && unsub();
  }, []);

  /* =====================================================
        Update Variant
  ===================================================== */
  async function updateVariant(item, newColor, newSize) {
    const color = newColor || item.color;
    const size = newSize || item.size;

    const matched = item.allVariants.find(
      (v) => v.color === color && v.size === size
    );
    if (!matched) return alert("This combination is not available.");

    /* -----------------------------
         Guest user
    ----------------------------- */
    if (!user) {
      let cart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      const idx = cart.findIndex((i) => i.variant_id === item.variant_id);
      if (idx === -1) return;

      cart[idx] = {
        ...cart[idx],
        color,
        size,
        variant_id: matched.id,
        price: matched.price,
        image: item.colorImages[color]?.[0] || item.image,
      };

      localStorage.setItem("guestCart", JSON.stringify(cart));
      setItems(cart);
      cartEvents.emit("changed");
      return;
    }

    /* -----------------------------
         Logged-in user (Optimistic UI)
    ----------------------------- */
    setItems((prev) =>
      prev.map((it) =>
        it.variant_id === item.variant_id
          ? {
              ...it,
              color,
              size,
              variant_id: matched.id,
              price: matched.price,
              image: item.colorImages[color]?.[0] || item.image,
            }
          : it
      )
    );

    try {
      await axiosInstance.put("/cart/change-variant", {
        oldVariantId: item.variant_id,
        newVariantId: matched.id,
      });
    } catch (err) {
      console.error("Failed to update variant:", err);
      await reloadCart();
    }
  }

  /* =====================================================
        Update Quantity
  ===================================================== */
  async function updateQty(item, newQty) {
    if (newQty < 1) return;

    if (!user) {
      let cart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      const found = cart.find((i) => i.variant_id === item.variant_id);
      if (found) found.quantity = newQty;

      localStorage.setItem("guestCart", JSON.stringify(cart));
      setItems(cart);
      cartEvents.emit("changed");
      return;
    }


    // ----------------------------
    // Logged-in User: Optimistic UI
    // ----------------------------
    // 1) UI 立即更新（不等待后端）
    setItems((prev) =>
      prev.map((i) =>
        i.variant_id === item.variant_id
          ? { ...i, quantity: newQty }
          : i
      )
    );

    // 2) 后端更新
    try {
      await axiosInstance.put("/cart/update", {
        variantId: item.variant_id,
        quantity: newQty,
      });
    } catch (err) {
      console.error("❌ Failed updateQty:", err);
      // 如果失败，再从后端同步一次
      await reloadCart();
    }
  }

  /* =====================================================
        Remove Item
  ===================================================== */
  async function removeItem(item) {
    if (!user) {
      let cart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      cart = cart.filter((i) => i.variant_id !== item.variant_id);

      localStorage.setItem("guestCart", JSON.stringify(cart));
      setItems(cart);
      cartEvents.emit("changed");
      return;
    }

    await axiosInstance.delete(`/cart/remove/${item.variant_id}`);
    await reloadCart();
  }

  /* =====================================================
      RENDER
===================================================== */
if (loading) return <div>Loading...</div>;

const subtotal = items.reduce(
  (sum, i) => sum + Number(i.price) * i.quantity,
  0
);

return (
  <div className="cart-container">
    <h2>Your Cart</h2>

    {items.length === 0 ? (
      <p>Your cart is empty.</p>
    ) : (
      <>
        {/* Cart List */}
        <div className="cart-list">
          {items.map((item) => (
            <div className="cart-item" key={item.variant_id}>
              <img
                src={item.image}
                onClick={() => navigate(`/product/${item.slug}`)}
                className="cart-item-img"
              />

              <div className="cart-info">
                {/* Product Name */}
                <h4
                  className="cart-item-link"
                  onClick={() => navigate(`/product/${item.slug}`)}
                >
                  {item.name}
                </h4>

                {/* Variant Group */}
                <div className="cart-variants">
                  {/* Color */}
                  <div className="cart-variant-row">
                    <div
                      className="variant-select"
                      onClick={() =>
                        setOpenColor(
                          openColor === item.variant_id ? null : item.variant_id
                        )
                      }
                    >
                      Color: {item.color}
                    </div>

                    {openColor === item.variant_id && (
                      <div className="variant-dropdown">
                        {item.allColors.map((c) => (
                          <div
                            key={c}
                            className="variant-option"
                            onClick={() => {
                              updateVariant(item, c, null);
                              setOpenColor(null);
                            }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Size */}
                  <div className="cart-variant-row">
                    <div
                      className="variant-select"
                      onClick={() =>
                        setOpenSize(
                          openSize === item.variant_id ? null : item.variant_id
                        )
                      }
                    >
                      Size: {item.size}
                    </div>

                    {openSize === item.variant_id && (
                      <div className="variant-dropdown">
                        {item.allSizes.map((s) => (
                          <div
                            key={s}
                            className="variant-option"
                            onClick={() => {
                              updateVariant(item, null, s);
                              setOpenSize(null);
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price + Remove */}
                <div className="cart-info-row">
                  <p className="cart-price">${item.price}</p>

                  <button
                    className="cart-remove"
                    onClick={() => removeItem(item)}
                  >
                    Remove
                  </button>
                </div>

                {/* Quantity */}
                <div className="cart-qty">
                  <button onClick={() => updateQty(item, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item, item.quantity + 1)}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary + Checkout */}
        <div className="cart-summary">
          <h3>Summary</h3>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>

          <button className="checkout-btn">
            Checkout
          </button>
        </div>
      </>
    )}
  </div>
);
}
