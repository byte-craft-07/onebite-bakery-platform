import { env } from "../../../config/env.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { logger } from "../../../shared/utils/logger.js";
import { maskPhone } from "../utils/index.js";

interface Msg91VerifyResponse {
  type?: string;
  message?: string;
  number?: string;
  mobile?: string;
  data?: {
    number?: string;
    mobile?: string;
    phone?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class Msg91WidgetService {
  private readonly verifyUrl = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

  public async verifyAccessToken(accessToken: string): Promise<{ phone: string }> {
    if (!accessToken || typeof accessToken !== "string" || !accessToken.trim()) {
      throw new AppError(
        "MSG91 access token is required.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const authKey = env.msg91AuthKey;

    // Simulated test tokens support for local development / test suites without real network
    if (
      (!authKey || env.nodeEnv !== "production") &&
      accessToken.startsWith("simulated-msg91-")
    ) {
      const match = accessToken.match(/^simulated-msg91-(\d{10,12})$/);
      const testPhone = match && match[1] ? match[1] : "9876543210";
      return { phone: testPhone };
    }

    if (!authKey) {
      logger.error("MSG91_AUTH_KEY is not configured on the server.");
      throw new AppError(
        "Phone verification service is temporarily unavailable.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        [],
        true,
        APP_ERROR_CODES.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          authkey: authKey,
          "access-token": accessToken.trim(),
        }),
      });

      const responseData = (await response.json()) as Msg91VerifyResponse;

      if (!response.ok || responseData.type === "error") {
        logger.warn(
          {
            status: response.status,
            msg91Message: responseData.message,
          },
          "MSG91 token verification rejected by server",
        );

        throw new AppError(
          responseData.message || "Invalid or expired phone verification token.",
          HTTP_STATUS.UNAUTHORIZED,
          [],
          true,
          APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
        );
      }

      // Extract verified phone number from multiple possible MSG91 payload locations
      const rawVerifiedPhone =
        responseData.data?.number ||
        responseData.data?.mobile ||
        responseData.data?.phone ||
        responseData.number ||
        responseData.mobile;

      if (!rawVerifiedPhone || typeof rawVerifiedPhone !== "string") {
        logger.error(
          { responseKeys: Object.keys(responseData) },
          "MSG91 verification response missing verified phone number",
        );
        throw new AppError(
          "Unable to extract verified phone identity.",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      logger.info(
        { phoneMasked: maskPhone(rawVerifiedPhone) },
        "MSG91 access token successfully verified by server",
      );

      return { phone: rawVerifiedPhone };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }

      logger.error(
        { error: err instanceof Error ? err.message : String(err) },
        "Error calling MSG91 verifyAccessToken API",
      );

      throw new AppError(
        "Failed to verify phone verification token with MSG91.",
        HTTP_STATUS.BAD_GATEWAY,
      );
    }
  }
}
