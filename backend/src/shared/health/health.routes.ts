import { Router } from "express";
import mongoose from "mongoose";

import { SUCCESS_MESSAGES } from "../constants/messages.js";
import { sendSuccess } from "../responses/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const healthRouter = Router();

healthRouter.get("/", asyncHandler(async (_request, response) => {
  return sendSuccess(response, {
    message: SUCCESS_MESSAGES.HEALTHY,
    data: {
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "not_connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
}));
