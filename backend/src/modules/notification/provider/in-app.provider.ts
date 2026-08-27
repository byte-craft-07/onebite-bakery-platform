import crypto from "node:crypto";

import type {
  INotificationProvider,
  SendNotificationResult,
} from "./notification-provider.interface.js";

export class InAppProvider implements INotificationProvider {
  public readonly providerName = "IN_APP";

  public async send(): Promise<SendNotificationResult> {
    return {
      success: true,
      providerMessageId: `in_app_${crypto.randomBytes(4).toString("hex")}`,
    };
  }
}
