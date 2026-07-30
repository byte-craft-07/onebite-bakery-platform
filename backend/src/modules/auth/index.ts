export { AuthController } from "./controller/index.js";
export type { SendOtpDto, VerifyOtpDto } from "./dto/index.js";
export { requireAuth, requireRoles } from "./middlewares/index.js";
export { OtpModel, RefreshTokenModel } from "./model/index.js";
export type { Otp, OtpPurpose, RefreshToken } from "./model/index.js";
export { ConsoleOtpProvider } from "./providers/index.js";
export {
  OtpRepository,
  RefreshTokenRepository,
} from "./repository/index.js";
export { authRouter } from "./routes/index.js";
export { AuthService, OtpService } from "./service/index.js";
export type {
  AuthenticatedUser,
  AuthenticatedRequest,
  AuthenticationResult,
  AuthTokens,
  OtpDeliveryPayload,
  OtpProvider,
  SendOtpResult,
  VerifyOtpResult,
} from "./types/index.js";
