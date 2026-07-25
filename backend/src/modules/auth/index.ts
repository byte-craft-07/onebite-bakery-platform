export { AuthController } from "./controller/index.js";
export type { SendOtpDto, VerifyOtpDto } from "./dto/index.js";
export { OtpModel, RefreshTokenModel } from "./model/index.js";
export type { Otp, OtpPurpose, RefreshToken } from "./model/index.js";
export { ConsoleOtpProvider } from "./providers/index.js";
export { OtpRepository } from "./repository/index.js";
export { authRouter } from "./routes/index.js";
export { OtpService } from "./service/index.js";
export type {
  OtpDeliveryPayload,
  OtpProvider,
  SendOtpResult,
  VerifyOtpResult,
} from "./types/index.js";
