import crypto from "node:crypto";

import { env } from "../../../config/env.js";
import type {
  INotificationProvider,
  SendNotificationResult,
} from "./notification-provider.interface.js";

interface ResendEmailResponse {
  id?: unknown;
  message?: unknown;
  error?: unknown;
}

export class EmailProvider implements INotificationProvider {
  public readonly providerName = "EMAIL";

  public async send(
    recipient: string,
    _subject: string,
    _body: string,
    _metadata?: Record<string, unknown>,
  ): Promise<SendNotificationResult> {
    if (!recipient || !recipient.includes("@")) {
      return {
        success: false,
        error: `Invalid email recipient address '${recipient}'.`,
      };
    }

    if (!env.resendApiKey) {
      if (env.nodeEnv === "production") {
        return {
          success: false,
          error: "RESEND_API_KEY is not configured.",
        };
      }

      const providerMessageId = `dev_email_${crypto.randomBytes(4).toString("hex")}`;
      return {
        success: true,
        providerMessageId,
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.resendFromEmail,
          to: [recipient],
          subject: _subject,
          html: _body,
        }),
      });

      const responseBody = (await response.json().catch(() => ({}))) as ResendEmailResponse;

      if (!response.ok) {
        return {
          success: false,
          error:
            typeof responseBody.message === "string"
              ? responseBody.message
              : `Resend email API failed with status ${response.status}.`,
        };
      }

      return {
        success: true,
        providerMessageId:
          typeof responseBody.id === "string" ? responseBody.id : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send email notification.",
      };
    }

  }
}
