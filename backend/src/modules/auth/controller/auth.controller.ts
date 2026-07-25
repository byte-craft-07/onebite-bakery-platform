import type { Request, Response } from "express";

import { sendSuccess } from "../../../shared/responses/api-response.js";
import { createRequestContext } from "../../../shared/utils/request-context.js";
import {
  OTP_RESPONSE_MESSAGES,
} from "../constants/otp.constants.js";
import type { SendOtpDto, VerifyOtpDto } from "../dto/index.js";
import type { OtpService } from "../service/index.js";

export class AuthController {
  public constructor(private readonly otpService: OtpService) {}

  public sendOtp = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.otpService.sendOtp(
      request.body as SendOtpDto,
      createRequestContext(request),
    );

    return sendSuccess(response, {
      message: OTP_RESPONSE_MESSAGES.SEND_ACCEPTED,
      data: result,
    });
  };

  public verifyOtp = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.otpService.verifyOtp(
      request.body as VerifyOtpDto,
      createRequestContext(request),
    );

    return sendSuccess(response, {
      message: OTP_RESPONSE_MESSAGES.VERIFY_SUCCESS,
      data: result,
    });
  };
}
