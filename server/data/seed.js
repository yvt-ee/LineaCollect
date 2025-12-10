// =============================
// 🌱 LINEACOLLECT SEED DATA
// Compatible with NEW schema (product_images uses product_id + color)
// =============================

// =============================
// USERS
// =============================
export const users = [
  {
    name: "Admin",
    email: "admin@lineacollect.com",
    password_hash: "admin123",
    role: "admin",
    is_active: true,
  },
  {
    name: "User One",
    email: "user1@lineacollect.com",
    password_hash: "user123",
    role: "user",
    is_active: true,
  },
  {
    name: "User Two",
    email: "user2@lineacollect.com",
    password_hash: "user123",
    role: "user",
    is_active: true,
  }
];

// =============================
// REFRESH TOKENS
// =============================
export const refreshTokens = [
  {
    user_email: "user1@lineacollect.com",
    token: "dummy_refresh_token_1",
    device_info: "Safari on iPhone",
    ip_address: "127.0.0.1",
    expires_at: "2030-01-01T00:00:00Z",
  }
];

// =============================
// ADDRESSES
// =============================
// =============================
export const userAddresses = [
  {
    user_email: "user1@lineacollect.com",
    first_name: "User",
    last_name: "One",
    phone: "206-555-1234",
    address_line1: "1234 Pine Street",
    address_line2: null,
    city: "Seattle",
    state: "WA",
    postal_code: "98101",
    country: "United States",
    is_default: true,
  },
  {
    user_email: "user2@lineacollect.com",
    first_name: "User",
    last_name: "Two",
    phone: "206-555-5678",
    address_line1: "200 Broadway Ave",
    address_line2: null,
    city: "Seattle",
    state: "WA",
    postal_code: "98122",
    country: "United States",
    is_default: true,
  }
];


// =============================
// BRANDS
// =============================
export const brands = [
  { name: "Kara Yoo", description: "Minimalist jewelry handcrafted in Canada.", is_active: true },
  { name: "Faris", description: "Artful jewelry designed by Faris Du Graf in Seattle.", is_active: true },
  { name: "Wolf Circus", description: "Vancouver-based demi-fine jewelry made from recycled metals.", is_active: true },
  { name: "Cuyana", description: "Timeless leather goods crafted in Italy.", is_active: true },
  { name: "Themoirè", description: "Eco-luxury bags crafted from bio-based materials.", is_active: true },
];

// =============================
// PRODUCTS + OPTIONS + VARIANTS + COLOR IMAGES
// =============================
export const products = [
  {
    name: "Kara Yoo Willa Ring",
    slug: "kara-yoo-willa-ring",
    brandName: "Kara Yoo",
    category: "Ring",
    description: "Sterling Silver or Gold Plated Brass · Nickel-free · Hypoallergenic",

    // ⭐ 每个颜色的图片
    colorImages: {
      Gold: [
        "https://lineacollect.s3.us-east-1.amazonaws.com/karayoo.jpg",
        "https://lineacollect.s3.us-east-1.amazonaws.com/karayoo-2.jpg"
      ],
      Silver: [
        "https://lineacollect.s3.us-east-1.amazonaws.com/karayoo-3.jpg"
      ]
    },

    options: {
      Color: ["Gold", "Silver"],
      Size: ["5", "6", "7", "8", "9"]
    },

    variants: [
      { color: "Gold", size: "5", sku: "willa-g-5", price: 210, stock: 10 },
      { color: "Gold", size: "6", sku: "willa-g-6", price: 210, stock: 8 },
      { color: "Gold", size: "7", sku: "willa-g-7", price: 210, stock: 7 },
      { color: "Gold", size: "8", sku: "willa-g-8", price: 210, stock: 11 },
      { color: "Gold", size: "9", sku: "willa-g-9", price: 210, stock: 11 },

      { color: "Silver", size: "5", sku: "willa-s-5", price: 180, stock: 4 },
      { color: "Silver", size: "6", sku: "willa-s-6", price: 180, stock: 5 }
    ]
  },

  {
    name: "Faris Molten Pearl Ring",
    slug: "faris-molten-pearl-ring",
    brandName: "Faris",
    category: "Ring",
    description: "Organic molten forms with freshwater pearls.",

    colorImages: {
      Silver: ["https://lineacollect.s3.us-east-1.amazonaws.com/Faris.jpg"]
    },

    options: {
      Color: ["Silver"],
      Size: ["5", "6","7"]
    },

    variants: [
      { color: "Silver", size: "5", sku: "faris-s-5", price: 210, stock: 22 },
      { color: "Silver", size: "6", sku: "faris-s-6", price: 210, stock: 4 },
      { color: "Silver", size: "7", sku: "faris-s-7", price: 210, stock: 14 }
    ]
  },

  {
    name: "Wolf Circus Rabbit Necklace",
    slug: "wolf-circus-rabbit-necklace",
    brandName: "Wolf Circus",
    category: "Necklace",
    description: "Pendant necklace with bunny charm",

    colorImages: {
      Gold: ["https://lineacollect.s3.us-east-1.amazonaws.com/wolfcircus-1.jpg"],
      Silver: ["https://lineacollect.s3.us-east-1.amazonaws.com/wolfcircus.jpg"]
    },

    options: {
      Color: ["Silver", "Gold"],
      Size: ["One Size"]
    },

    variants: [
      { color: "Silver", size: "One Size", sku: "wolf-s", price: 110, stock: 22 },
      { color: "Gold", size: "One Size", sku: "wolf-g", price: 130, stock: 31 }
    ]
  }
];

// =============================
// REVIEWS
// =============================
export const reviews = [
  {
    product_slug: "kara-yoo-willa-ring",
    user_email: "user1@lineacollect.com",
    rating: 5,
    comment: "Beautiful craftsmanship. Perfect for daily wear!"
  },
  {
    product_slug: "faris-molten-pearl-earrings",
    user_email: "user2@lineacollect.com",
    rating: 4,
    comment: "Unique and lightweight."
  }
];

// =============================
// WISHLIST
// =============================
export const wishlist = [
  {
    user_email: "user1@lineacollect.com",
    product_slug: "faris-molten-pearl-earrings"
  }
];

// =============================
// PROMOTIONS
// =============================
export const promotions = [
  {
    name: "Holiday Sale",
    discount: 15,
    starts_at: "2025-12-01T00:00:00Z",
    ends_at: "2026-01-01T00:00:00Z",
    is_active: true
  }
];

export const promotionProducts = [
  {
    promotion_name: "Holiday Sale",
    product_slug: "kara-yoo-willa-ring"
  }
];

// =============================
// INVENTORY LOGS
// =============================
export const inventoryLogs = [
  {
    variant_sku: "willa-g-5",
    change_amount: +10,
    reason: "Initial stock"
  },
  {
    variant_sku: "faris-s",
    change_amount: +22,
    reason: "Initial stock"
  }
];

// =============================
// INVENTORY RESERVATIONS
// =============================
export const inventoryReservations = [
  {
    variant_sku: "willa-g-5",
    user_email: "user2@lineacollect.com",
    quantity: 1,
    expires_at: "2026-01-01T00:00:00Z"
  }
];

// =============================
// DEFAULT EXPORT
// =============================
const seed = {
  users,
  refreshTokens,
  userAddresses,
  brands,
  products,
  reviews,
  wishlist,
  promotions,
  promotionProducts,
  inventoryLogs,
  inventoryReservations
};

export default seed;
