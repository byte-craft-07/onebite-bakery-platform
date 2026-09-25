import { Router } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { requireAuth, requireRoles } from "../../auth/middlewares/index.js";
import type { AuthenticatedRequest } from "../../auth/types/index.js";
import { UserModel } from "../../user/model/user.model.js";
import { ReviewModel } from "../model/review.model.js";
import { toObjectId } from "../../../db/utils/object-id.js";

export const reviewRouter = Router();

const UNSPLASH_DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";

/**
 * Helper to derive shrunk email name and avatar.
 * If user name is missing or default ("Verified Customer"), shrinks email to email username (e.g. ajay123).
 * Avatar uses user's profile image or generated UI initials avatar from shrunk email.
 */
function resolveReviewerIdentity(
  user: { name?: string; email?: string; profileImage?: string } | null,
  customName?: string,
  customAvatar?: string,
) {
  const email = user?.email?.trim().toLowerCase() || "";
  const shrunkEmail = email ? email.split("@")[0] : "";

  let cleanName = "";
  if (typeof customName === "string" && customName.trim() && customName.trim() !== "Verified Customer") {
    cleanName = customName.trim().slice(0, 100);
  } else if (shrunkEmail) {
    cleanName = shrunkEmail.slice(0, 100);
  } else if (user?.name && user.name.trim() && user.name.trim() !== "Verified Customer") {
    cleanName = user.name.trim().slice(0, 100);
  } else {
    cleanName = "Bakery Customer";
  }

  let cleanAvatar = "";
  if (
    typeof customAvatar === "string" &&
    customAvatar.startsWith("http") &&
    !customAvatar.includes(UNSPLASH_DEFAULT_AVATAR)
  ) {
    cleanAvatar = customAvatar.slice(0, 500);
  } else if (
    user?.profileImage &&
    user.profileImage.startsWith("http") &&
    !user.profileImage.includes(UNSPLASH_DEFAULT_AVATAR)
  ) {
    cleanAvatar = user.profileImage.slice(0, 500);
  } else {
    cleanAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(shrunkEmail || cleanName)}&background=596B58&color=fff&bold=true`;
  }

  return { cleanName, cleanAvatar, userEmail: email || undefined };
}

// 1. PUBLIC: Get reviews from Database only (strictly no dummy reviews)
reviewRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { productId, limit = "50" } = req.query as Record<string, string>;
    const queryLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const filter: Record<string, unknown> = { isActive: true };
    if (productId) {
      filter.productId = productId;
    }

    const reviews = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(queryLimit)
      .lean()
      .exec();

    const formatted = (reviews || []).map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      customerName: r.customerName,
      name: r.customerName,
      avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customerName)}&background=596B58&color=fff&bold=true`,
      rating: r.rating,
      qualityRating: r.qualityRating,
      tasteRating: r.tasteRating,
      comment: r.comment,
      productName: r.productName,
      productId: r.productId,
      orderId: r.orderId,
      tags: r.tags || [],
      isVerified: r.isVerified,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      date: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    return res.json({
      success: true,
      data: { reviews: formatted },
    });
  }),
);

// 2. ADMIN: Get all reviews (with filters & search)
reviewRouter.get(
  "/admin/all",
  requireAuth,
  requireRoles(["admin", "branch_admin"]),
  asyncHandler(async (req, res) => {
    const { search, rating, status, limit = "100", skip = "0" } = req.query as Record<string, string>;
    const queryLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
    const querySkip = Math.max(parseInt(skip, 10) || 0, 0);

    const filter: Record<string, unknown> = {};

    if (rating && !isNaN(Number(rating))) {
      filter.rating = Number(rating);
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "hidden") {
      filter.isActive = false;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { customerName: searchRegex },
        { userEmail: searchRegex },
        { comment: searchRegex },
        { productName: searchRegex },
      ];
    }

    const [reviews, totalCount] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(querySkip)
        .limit(queryLimit)
        .lean()
        .exec(),
      ReviewModel.countDocuments(filter).exec(),
    ]);

    const formatted = (reviews || []).map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      userId: r.userId ? r.userId.toString() : undefined,
      userEmail: r.userEmail,
      customerName: r.customerName,
      name: r.customerName,
      avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customerName)}&background=596B58&color=fff&bold=true`,
      rating: r.rating,
      qualityRating: r.qualityRating,
      tasteRating: r.tasteRating,
      comment: r.comment,
      productName: r.productName,
      productId: r.productId,
      orderId: r.orderId,
      tags: r.tags || [],
      isVerified: r.isVerified,
      isActive: r.isActive,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      date: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    return res.json({
      success: true,
      data: {
        reviews: formatted,
        total: totalCount,
      },
    });
  }),
);

// 3. ADMIN: Toggle review active/hidden status
reviewRouter.patch(
  "/admin/:id/toggle-status",
  requireAuth,
  requireRoles(["admin"]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await ReviewModel.findById(id).exec();
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.isActive = !review.isActive;
    await review.save();

    return res.json({
      success: true,
      message: `Review is now ${review.isActive ? "Active (visible)" : "Hidden"}`,
      data: {
        id: review._id.toString(),
        isActive: review.isActive,
      },
    });
  }),
);

// 4. ADMIN: Delete review
reviewRouter.delete(
  "/admin/:id",
  requireAuth,
  requireRoles(["admin"]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ReviewModel.findByIdAndDelete(id).exec();

    return res.json({
      success: true,
      message: "Review deleted successfully",
    });
  }),
);

// 5. PROTECTED: Submit Single Review (Only Logged-in Users)
reviewRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userIdStr = authenticatedRequest.user.id;

    // Fetch user details for shrunk email and profile
    const userDoc = await UserModel.findById(userIdStr).lean().exec();

    const {
      rating,
      comment,
      productName,
      productId,
      orderId,
      qualityRating,
      tasteRating,
      tags,
      name,
      customerName,
      avatar,
    } = req.body || {};

    const { cleanName, cleanAvatar, userEmail } = resolveReviewerIdentity(
      userDoc,
      customerName || name,
      avatar,
    );

    const cleanRating = Math.min(Math.max(Number(rating) || 5, 1), 5);
    const cleanComment = typeof comment === "string" ? comment.slice(0, 2000) : "Great quality & taste!";

    const newRevDoc = {
      userId: userDoc ? toObjectId(userDoc._id) : toObjectId(userIdStr),
      userEmail,
      customerName: cleanName,
      avatar: cleanAvatar,
      rating: cleanRating,
      qualityRating: Math.min(Math.max(Number(qualityRating) || cleanRating, 1), 5),
      tasteRating: Math.min(Math.max(Number(tasteRating) || cleanRating, 1), 5),
      comment: cleanComment,
      productName: typeof productName === "string" ? productName.slice(0, 150) : "Bakery Special",
      productId: typeof productId === "string" ? productId.slice(0, 100) : undefined,
      orderId: typeof orderId === "string" ? orderId.slice(0, 100) : undefined,
      tags: Array.isArray(tags) ? tags.slice(0, 10).map((t: unknown) => String(t).slice(0, 50)) : [],
      isVerified: true,
      isActive: true,
    };

    const saved = await ReviewModel.create(newRevDoc);
    const createdId = saved._id.toString();
    const createdAt = saved.createdAt.toISOString();

    return res.status(201).json({
      success: true,
      data: {
        review: {
          id: createdId,
          _id: createdId,
          ...newRevDoc,
          name: cleanName,
          createdAt,
          date: createdAt,
        },
      },
    });
  }),
);

// 6. PROTECTED: Submit Batch Reviews (Only Logged-in Users)
reviewRouter.post(
  "/batch",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userIdStr = authenticatedRequest.user.id;

    const userDoc = await UserModel.findById(userIdStr).lean().exec();

    const { items, orderId, customerName, name, avatar } = req.body || {};
    const { cleanName, cleanAvatar, userEmail } = resolveReviewerIdentity(
      userDoc,
      customerName || name,
      avatar,
    );

    const addedReviews: Record<string, unknown>[] = [];

    if (Array.isArray(items) && items.length > 0) {
      const limitedItems = items.slice(0, 20);
      const docsToInsert = limitedItems.map((item: {
        rating?: number;
        qualityRating?: number;
        tasteRating?: number;
        comment?: string;
        productName?: string;
        productId?: string;
        tags?: unknown[];
      }) => {
        const cleanRating = Math.min(Math.max(Number(item.rating) || 5, 1), 5);

        return {
          userId: userDoc ? toObjectId(userDoc._id) : toObjectId(userIdStr),
          userEmail,
          customerName: cleanName,
          avatar: cleanAvatar,
          rating: cleanRating,
          qualityRating: Math.min(Math.max(Number(item.qualityRating) || cleanRating, 1), 5),
          tasteRating: Math.min(Math.max(Number(item.tasteRating) || cleanRating, 1), 5),
          comment: typeof item.comment === "string" ? item.comment.slice(0, 2000) : "High quality product!",
          productName: typeof item.productName === "string" ? item.productName.slice(0, 150) : "Bakery Special",
          productId: typeof item.productId === "string" ? item.productId.slice(0, 100) : undefined,
          orderId: typeof orderId === "string" ? orderId.slice(0, 100) : undefined,
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 10).map((t: unknown) => String(t).slice(0, 50)) : [],
          isVerified: true,
          isActive: true,
        };
      });

      const inserted = await ReviewModel.insertMany(docsToInsert);
      inserted.forEach((r) => {
        addedReviews.push({
          id: r._id.toString(),
          _id: r._id.toString(),
          userId: r.userId ? r.userId.toString() : undefined,
          userEmail: r.userEmail,
          customerName: r.customerName,
          name: r.customerName,
          avatar: r.avatar,
          rating: r.rating,
          qualityRating: r.qualityRating,
          tasteRating: r.tasteRating,
          comment: r.comment,
          productName: r.productName,
          productId: r.productId,
          orderId: r.orderId,
          tags: r.tags,
          isVerified: r.isVerified,
          createdAt: r.createdAt.toISOString(),
          date: r.createdAt.toISOString(),
        });
      });
    }

    return res.status(201).json({
      success: true,
      data: { reviews: addedReviews },
    });
  }),
);
