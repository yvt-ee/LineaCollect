// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";

// ✅ 正确的 imports
import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import uploadsRouter from "./routes/uploads.js";
import ordersRouter from "./routes/orders.js";
import inventoryRouter from "./routes/inventory.js";
import cartRouter from "./routes/cart.js";
import variantsRouter from "./routes/variants.js";
import shopifyRoutes from "./routes/shopify.js";
import reviewRoutes from "./routes/reviews.js";
import addressRoutes from "./routes/addresses.js";

// ...



import {
  authenticate,
  optionalAuth,
  requireAdmin,
} from "./middleware/auth.js";

const app = express();

// ES Modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// 🌐 Global Middleware
// -----------------------------------------------------
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -----------------------------------------------------
// ❤️ Health Check
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LineaCollect API running",
    endpoints: {
      auth: "/api/auth",
      addresses: "/api/addresses",
      products: "/api/products",
      variants: "/api/variants",
      cart: "/api/cart",
      orders: "/api/orders",
      inventory: "/api/inventory",
      upload: "/api/upload",
      reviews: "/api/reviews"
    },
  });
});

// -----------------------------------------------------
// 🛣 API Routing
// -----------------------------------------------------

// 🔐 Auth Routes ← 前端 axiosInstance 必须访问这个
app.use("/api/auth", authRouter);

// 🏠 User addresses
app.use("/api/addresses", addressRoutes);

app.use("/api/categories", categoriesRouter);

// 👜 Products (optional user)
app.use("/api/products", optionalAuth, productsRouter);


// 🎨 Variants
app.use("/api/variants", optionalAuth, variantsRouter);

// 🛒 Cart + Orders (required login)
app.use("/api/cart", optionalAuth, cartRouter);
app.use("/api/orders", optionalAuth, ordersRouter);

// 🏭 Inventory (admin only)
app.use("/api/inventory", authenticate, requireAdmin, inventoryRouter);

// 📤 Uploads (admin only)
app.use("/api/upload", authenticate, requireAdmin, uploadsRouter);

// 🛍 Shopify
app.use("/api/shopify", shopifyRoutes);

// ⭐ Reviews (public)
app.use("/api/reviews", reviewRoutes);



// -----------------------------------------------------
// 404 Handler
// -----------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -----------------------------------------------------
// Error handler
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack || err);
  res.status(500).json({ error: "Internal server error" });
});

// -----------------------------------------------------
// 🚀 Start Server
// -----------------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 LineaCollect API running on http://localhost:${PORT}`);
});
