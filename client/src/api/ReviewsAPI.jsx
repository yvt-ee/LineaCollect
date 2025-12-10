import api from "./axiosClient";

export const fetchReviewsByProduct = (productId) =>
  api.get(`/reviews/product/${productId}`).then(res => res.data);

export const createReview = (data) =>
  api.post("/reviews", data).then(res => res.data);

export const updateReview = (id, data) =>
  api.put(`/reviews/${id}`, data).then(res => res.data);

export const deleteReview = (id) =>
  api.delete(`/reviews/${id}`).then(res => res.data);
