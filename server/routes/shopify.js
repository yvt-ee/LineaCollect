import express from "express";

const router = express.Router();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_KEY;

router.post("/create-checkout", async (req, res) => {
  try {
    const { lineItems } = req.body;

    const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/checkouts.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({
        checkout: {
          line_items: lineItems, // [{ variant_id, quantity }]
        },
      }),
    });

    const data = await response.json();

    if (!data.checkout) {
      console.error("Shopify Checkout API Error:", data);
      return res.status(400).json({ error: "Failed to create checkout" });
    }

    return res.json({
      checkoutUrl: data.checkout.web_url,
    });

  } catch (error) {
    console.error("🔥 Shopify Checkout Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
