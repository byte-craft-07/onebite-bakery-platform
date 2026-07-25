import { Router } from "express";
import rateLimit from "express-rate-limit";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { AuthController } from "../controller/index.js";
import { ConsoleOtpProvider } from "../providers/index.js";
import { OtpRepository } from "../repository/index.js";
import { OtpService } from "../service/index.js";
import {
  OTP_RATE_LIMITS,
  OTP_RESPONSE_MESSAGES,
} from "../constants/index.js";
import { sendOtpSchema, verifyOtpSchema } from "../validators/index.js";

export const authRouter = Router();

const otpRepository = new OtpRepository();
const otpProvider = new ConsoleOtpProvider();
const otpService = new OtpService(otpRepository, otpProvider);
const authController = new AuthController(otpService);

const sendOtpRateLimiter = rateLimit({
  windowMs: OTP_RATE_LIMITS.SEND_WINDOW_MS,
  limit: OTP_RATE_LIMITS.SEND_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: OTP_RESPONSE_MESSAGES.RESEND_LIMIT_REACHED,
    errors: [],
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const verifyOtpRateLimiter = rateLimit({
  windowMs: OTP_RATE_LIMITS.VERIFY_WINDOW_MS,
  limit: OTP_RATE_LIMITS.VERIFY_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: OTP_RESPONSE_MESSAGES.ATTEMPTS_EXCEEDED,
    errors: [],
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

authRouter.post(
  "/send-otp",
  sendOtpRateLimiter,
  validateRequest({ body: sendOtpSchema }),
  asyncHandler(authController.sendOtp),
);

authRouter.post(
  "/verify-otp",
  verifyOtpRateLimiter,
  validateRequest({ body: verifyOtpSchema }),
  asyncHandler(authController.verifyOtp),
);
