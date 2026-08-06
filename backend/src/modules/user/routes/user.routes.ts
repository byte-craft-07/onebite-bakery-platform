import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { UserModel, type User, type UserStatus } from "../model/index.js";

export const userRouter = Router();

const userIdParamSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid user id."),
});

const userStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
});

const listUsersQuerySchema = z.object({
  role: z.enum(["customer", "admin"]).optional(),
  status: z.enum(["active", "blocked"]).optional(),
});

const toUserResponse = (user: User) => ({
  id: user._id.toString(),
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt.toISOString(),
});

const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

userRouter.get(
  "/",
  ...adminOnly,
  validateRequest({ query: listUsersQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listUsersQuerySchema>;
    const filter: Partial<Pick<User, "role" | "status">> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();

    res.json({
      success: true,
      data: { users: users.map(toUserResponse) },
    });
  }),
);

userRouter.patch(
  "/:id/status",
  ...adminOnly,
  validateRequest({ params: userIdParamSchema, body: userStatusSchema }),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: UserStatus };
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
    }

    res.json({ success: true, data: { user: toUserResponse(user) } });
  }),
);
