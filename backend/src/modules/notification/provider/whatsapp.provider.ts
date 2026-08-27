import { env } from "../../../config/env.js";
import type {
  INotificationProvider,
  SendNotificationResult,
} from "./notification-provider.interface.js";

interface WhatsAppApiResponse {
  messages?: Array<{ id?: unknown }>;
  error?: {
    message?: unknown;
    type?: unknown;
    code?: unknown;
    error_data?: {
      details?: unknown;
    };
  };
}

const normalizeIndianPhone = (recipient: string): string | undefined => {
  const digits = recipient.replace(/\D/g, "");

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return undefined;
};

const getMetadataString = (
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined => {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export class WhatsAppProvider implements INotificationProvider {
  public readonly providerName = "WHATSAPP";

  public async send(
    recipient: string,
    _subject: string,
    _body: string,
    metadata?: Record<string, unknown>,
  ): Promise<SendNotificationResult> {
    const normalizedRecipient = normalizeIndianPhone(recipient);

    if (!normalizedRecipient) {
      return {
        success: false,
        error: "Invalid Indian WhatsApp recipient number.",
      };
    }

    if (!env.whatsappApiToken || !env.whatsappPhoneNumberId) {
      return {
        success: false,
        error:
          "WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be configured.",
      };
    }

    const templateName =
      getMetadataString(metadata, "whatsappTemplate") ??
      env.whatsappDefaultTemplate;
    const languageCode =
      getMetadataString(metadata, "whatsappLanguage") ??
      env.whatsappDefaultLanguage;

    try {
      const response = await fetch(
        `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.whatsappApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: normalizedRecipient,
            type: "template",
            template: {
              name: templateName,
              language: {
                code: languageCode,
              },
            },
          }),
        },
      );

      const responseBody = (await response
        .json()
        .catch(() => ({}))) as WhatsAppApiResponse;

      if (!response.ok) {
        const details =
          typeof responseBody.error?.error_data?.details === "string"
            ? ` ${responseBody.error.error_data.details}`
            : "";
        return {
          success: false,
          error:
            typeof responseBody.error?.message === "string"
              ? `${responseBody.error.message}${details}`
              : `WhatsApp API failed with status ${response.status}.`,
        };
      }

      const providerMessageId = responseBody.messages?.find(
        (message) => typeof message.id === "string",
      )?.id;

      return {
        success: true,
        providerMessageId:
          typeof providerMessageId === "string" ? providerMessageId : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send WhatsApp notification.",
      };
    }
  }
}
