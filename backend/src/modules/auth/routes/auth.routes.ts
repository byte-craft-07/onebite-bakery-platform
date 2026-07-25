import { Router } from "express";
import rateLimit from "express-rate-limit";

import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { UserRepository } from "../../user/index.js";
import { requireAuth } from "../middlewares/index.js";
import { AuthController } from "../controller/index.js";
import { ConsoleOtpProvider } from "../providers/index.js";
import {
  OtpRepository,
  RefreshTokenRepository,
} from "../repository/index.js";
import { AuthService, OtpService } from "../service/index.js";
import {
  AUTH_RATE_LIMITS,
  AUTH_RESPONSE_MESSAGES,
  OTP_RATE_LIMITS,
  OTP_RESPONSE_MESSAGES,
} from "../constants/index.js";
import { sendOtpSchema, verifyOtpSchema } from "../validators/index.js";

export const authRouter = Router();

const otpRepository = new OtpRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const userRepository = new UserRepository();
const otpProvider = new ConsoleOtpProvider();
const otpService = new OtpService(otpRepository, otpProvider);
const authService = new AuthService(
  otpService,
  userRepository,
  refreshTokenRepository,
);
const authController = new AuthController(otpService, authService);

const sendOtpRateLimiter = rateLimit({
  windowMs: OTP_RATE_LIMITS.SEND_WINDOW_MS,
  limit: OTP_RATE_LIMITS.SEND_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: OTP_RESPONSE_MESSAGES.RESEND_LIMIT_REACHED,
    errors: [],
    code: APP_ERROR_CODES.TOO_MANY_REQUESTS,
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
    code: APP_ERROR_CODES.TOO_MANY_REQUESTS,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const refreshRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMITS.REFRESH_WINDOW_MS,
  limit: AUTH_RATE_LIMITS.REFRESH_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: AUTH_RESPONSE_MESSAGES.INVALID_REFRESH_TOKEN,
    errors: [],
    code: APP_ERROR_CODES.TOO_MANY_REQUESTS,
  },
});

const sessionRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMITS.SESSION_WINDOW_MS,
  limit: AUTH_RATE_LIMITS.SESSION_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: AUTH_RESPONSE_MESSAGES.AUTHENTICATION_REQUIRED,
    errors: [],
    code: APP_ERROR_CODES.TOO_MANY_REQUESTS,
  },
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

authRouter.get(
  "/me",
  sessionRateLimiter,
  requireAuth,
  asyncHandler(authController.me),
);

authRouter.post(
  "/refresh",
  refreshRateLimiter,
  asyncHandler(authController.refresh),
);

authRouter.post(
  "/logout",
  sessionRateLimiter,
  asyncHandler(authController.logout),
);

authRouter.post(
  "/logout-all",
  sessionRateLimiter,
  requireAuth,
  asyncHandler(authController.logoutAll),
);
