import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";

export interface RenderedTemplate {
  subject: string;
  body: string;
}

export class TemplateRenderer {
  private static readonly templates: Record<
    string,
    { subject: string; body: string }
  > = {
    "order-created": {
      subject: "The Online Bakery Order Received - {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>Thank you for your order <strong>{{orderNumber}}</strong>! Subtotal: ₹{{amount}}. We are processing your request.</p>",
    },
    "order-confirmed": {
      subject: "The Online Bakery Order Confirmed - {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>Your order <strong>{{orderNumber}}</strong> has been confirmed! Estimated ready time: {{deliveryTime}}.</p>",
    },
    "order-status-updated": {
      subject: "The Online Bakery Order Update - {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>Your order <strong>{{orderNumber}}</strong> is now <strong>{{status}}</strong>.</p>",
    },
    "payment-success": {
      subject: "Payment Successful for Order {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>We received your payment of ₹{{amount}} for order <strong>{{orderNumber}}</strong>. Payment ID: {{paymentId}}.</p>",
    },
    "payment-failed": {
      subject: "Payment Action Required - Order {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>Your payment attempt for order <strong>{{orderNumber}}</strong> was not successful. Reason: {{failureReason}}.</p>",
    },
    "order-cancelled": {
      subject: "The Online Bakery Order Cancelled - {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>Your order <strong>{{orderNumber}}</strong> has been cancelled. Reason: {{cancellationReason}}.</p>",
    },
    "custom-cake-update": {
      subject: "Update on Custom Cake Request - {{orderNumber}}",
      body: "<p>Hello {{customerName}},</p><p>There is an update regarding your custom cake request for order <strong>{{orderNumber}}</strong>.</p>",
    },
    "admin-notification": {
      subject: "The Online Bakery System Notification: {{title}}",
      body: "<p>System Alert: {{message}}</p>",
    },
    "admin-broadcast": {
      subject: "The Online Bakery Announcement: {{title}}",
      body: "<p>Hello,</p><p>{{message}}</p>",
    },
    welcome: {
      subject: "Welcome to The Online Bakery",
      body: "<p>Hello {{customerName}},</p><p>Welcome to The Online Bakery. We are happy to have you here.</p>",
    },
  };

  public static render(
    templateKey: string,
    variables: Record<string, unknown>,
  ): RenderedTemplate {
    const templateName = templateKey.toLowerCase().replace(/_/g, "-");
    const tpl = TemplateRenderer.templates[templateName] ?? TemplateRenderer.templates[templateKey];

    if (!tpl) {
      throw new AppError(
        `Notification template '${templateKey}' is not supported.`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    let subject = tpl.subject;
    let body = tpl.body;

    for (const [key, value] of Object.entries(variables)) {
      const stringValue = String(value ?? "");
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      subject = subject.replace(placeholder, stringValue);
      body = body.replace(placeholder, stringValue);
    }

    // Default fallbacks for unreplaced variables
    subject = subject.replace(/{{\s*\w+\s*}}/g, "");
    body = body.replace(/{{\s*\w+\s*}}/g, "");

    return { subject, body };
  }
}
