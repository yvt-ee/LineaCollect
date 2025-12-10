// routes/reviews.js
import express from "express";
import {
  getReviewsByProduct,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviews.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/*----------------------------------------------
   📌 GET all reviews for one product
   GET /reviews/product/:productId
----------------------------------------------*/
router.get("/product/:productId", getReviewsByProduct);

/*----------------------------------------------
   ✍️ CREATE review  (login optional)
   POST /reviews
----------------------------------------------*/
router.post("/", authenticate, createReview);

/*----------------------------------------------
   ✏️ UPDATE review  (login required)
   PUT /reviews/:reviewId
----------------------------------------------*/
router.put("/:reviewId", authenticate, updateReview);

/*----------------------------------------------
   ❌ DELETE review  (login required)
   DELETE /reviews/:reviewId
----------------------------------------------*/
router.delete("/:reviewId", authenticate, deleteReview);

export default router;
