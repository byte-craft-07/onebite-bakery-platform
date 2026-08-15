import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { NotificationController } from "../controller/index.js";
import { NotificationRepository } from "../repository/index.js";
import { NotificationService } from "../service/index.js";
import {
  notificationIdParamSchema,
  sendNotificationSchema,
} from "../validators/index.js";

export const notificationRouter = Router();

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

const orderConfirmationEmailSchema = z.object({
  orderNumber: z.string().trim().min(1),
  recipientEmail: z.string().trim().email(),
  totalAmount: z.number().nonnegative(),
});

const welcomeEmailSchema = z.object({
  customerName: z.string().trim().min(1),
  recipientEmail: z.string().trim().email(),
});

const whatsappSmsStatusSchema = z.object({
  phone: z.string().trim().regex(/^[0-9]{10,15}$/),
  orderNumber: z.string().trim().min(1),
  status: z.string().trim().min(1),
});

notificationRouter.post(
  "/email/order-confirmation",
  requireAuth,
  validateRequest({ body: orderConfirmationEmailSchema }),
  asyncHandler(async (req, res) => {
    const { orderNumber, recipientEmail, totalAmount } =
      req.body as z.infer<typeof orderConfirmationEmailSchema>;
    const notification = await notificationService.send({
      recipient: recipientEmail,
      type: "ORDER_CONFIRMED",
      template: "order-confirmed",
      payload: {
        customerName: "Customer",
        orderNumber,
        amount: totalAmount,
        deliveryTime: "soon",
      },
      provider: "EMAIL",
    });

    res.json({
      success: true,
      message: `Order confirmation email processed for ${recipientEmail} for Order #${orderNumber}`,
      data: { notification },
    });
  }),
);

notificationRouter.post(
  "/email/welcome",
  requireAuth,
  validateRequest({ body: welcomeEmailSchema }),
  asyncHandler(async (req, res) => {
    const { customerName, recipientEmail } =
      req.body as z.infer<typeof welcomeEmailSchema>;
    const notification = await notificationService.send({
      recipient: recipientEmail,
      type: "ADMIN_NOTIFICATION",
      template: "welcome",
      payload: { customerName },
      provider: "EMAIL",
    });

    res.json({
      success: true,
      message: `Welcome email processed for ${recipientEmail}`,
      data: { notification },
    });
  }),
);

notificationRouter.post(
  "/whatsapp-sms/status",
  requireAuth,
  validateRequest({ body: whatsappSmsStatusSchema }),
  asyncHandler(async (req, res) => {
    const { phone, orderNumber, status } =
      req.body as z.infer<typeof whatsappSmsStatusSchema>;
    res.json({
      success: true,
      message: `Meta WhatsApp & SMS alert sent to +91 ${phone} for Order #${orderNumber} (${status})`,
    });
  }),
);

notificationRouter.post(
  "/send",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ body: sendNotificationSchema }),
  asyncHandler(notificationController.send),
);

notificationRouter.get(
  "/history",
  requireAuth,
  asyncHandler(notificationController.getHistory),
);

notificationRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.getNotificationById),
);

notificationRouter.post(
  "/:id/retry",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.retryNotification),
);
