import crypto from "node:crypto";

import type {
  INotificationProvider,
  SendNotificationResult,
} from "./notification-provider.interface.js";

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

    const providerMessageId = `msg_email_${crypto.randomBytes(4).toString("hex")}`;

    return {
      success: true,
      providerMessageId,
    };
  }
}
