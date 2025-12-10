// src/api/CartsAPI.jsx
import api from "./axiosClient";

const CartAPI = {
  // 获取当前购物车（支持 guest）
  getCart: () => api.get("/cart"),

  // 添加商品
  addToCart: (variantId, quantity = 1) =>
    api.post("/cart/add", {
      variantId,
      quantity,
    }),

  // 更新数量（必须登录）
  updateQty: (variantId, quantity) =>
    api.put("/cart/update", {
      variantId,
      quantity,
    }),

  // 删除商品（必须登录）
  removeItem: (variantId) =>
    api.delete(`/cart/remove/${variantId}`),

  // 切换 variant（颜色 / 尺寸）
  changeVariant: (oldVariantId, newVariantId) =>
    api.put("/cart/change-variant", {
      oldVariantId,
      newVariantId,
    }),

  // guest cart 合并到 user cart
  mergeGuestCart: (items) =>
    api.post("/cart/merge", { items }),
};

export default CartAPI;
