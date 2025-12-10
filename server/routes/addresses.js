// routes/addresses.js
import express from "express";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addresses.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ===============================
// ADDRESS ROUTES (login required)
// ===============================

// 📌 获取当前用户全部地址
router.get("/", authenticate, getAddresses);

// 📌 添加新地址
router.post("/", authenticate, addAddress);

// 📌 更新地址
router.put("/:id", authenticate, updateAddress);

// 📌 删除地址
router.delete("/:id", authenticate, deleteAddress);

// 📌 设置默认地址
router.put("/:id/default", authenticate, setDefaultAddress);

export default router;
