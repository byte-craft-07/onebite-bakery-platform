import { Router } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler.js";

export const reviewRouter = Router();

// In-memory / MongoDB sync collection for reviews
const initialReviews = [
  {
    id: "rev-1",
    customerName: "Ananya Sharma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "The Belgian Dark Chocolate Truffle was unbelievable! Perfectly moist and rich. Ordered for my mom's birthday.",
    productName: "Belgian Dark Chocolate Truffle Cake",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isVerified: true,
  },
  {
    id: "rev-2",
    customerName: "Rohan Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "Best eggless bakery in town. Delivery was super fast and the sourdough bread was hot & fresh!",
    productName: "Fresh Sourdough Bread",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    isVerified: true,
  },
  {
    id: "rev-3",
    customerName: "Priya Patel",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "Ordered the custom tier cake for our anniversary. Design was exact to the picture and flavor was heavenly!",
    productName: "Custom Tier Cake",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    isVerified: true,
  },
];

let reviewsList = [...initialReviews];

reviewRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { reviews: reviewsList },
    });
  }),
);

reviewRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { rating, comment, productName } = req.body;
    const newRev = {
      id: `rev-${Date.now()}`,
      customerName: "Verified Customer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: Number(rating) || 5,
      comment: comment || "Great experience!",
      productName: productName || "Bakery Special",
      createdAt: new Date().toISOString(),
      isVerified: true,
    };
    reviewsList.unshift(newRev);
    res.status(201).json({
      success: true,
      data: { review: newRev },
    });
  }),
);
