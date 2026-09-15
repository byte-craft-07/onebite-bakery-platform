import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { NotificationController } from "../controller/index.js";
import { NotificationRepository } from "../repository/index.js";
import { NotificationService } from "../service/index.js";
import {
  notificationIdParamSchema,
  pushSubscriptionSchema,
  sendNotificationSchema,
  unsubscribePushSchema,
} from "../validators/index.js";

export const notificationRouter = Router();

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

notificationRouter.get(
  "/vapid-public-key",
  asyncHandler(notificationController.getVapidPublicKey),
);

notificationRouter.post(
  "/push-subscriptions",
  requireAuth,
  validateRequest({ body: pushSubscriptionSchema }),
  asyncHandler(notificationController.registerPushSubscription),
);

notificationRouter.delete(
  "/push-subscriptions",
  requireAuth,
  validateRequest({ body: unsubscribePushSchema }),
  asyncHandler(notificationController.unsubscribePush),
);

notificationRouter.post(
  "/test-push",
  requireAuth,
  asyncHandler(notificationController.sendTestPush),
);

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

    if (notification.status !== "SENT") {
      res.status(HTTP_STATUS.BAD_GATEWAY).json({
        success: false,
        message:
          notification.failureReason ?? "Order confirmation email could not be sent.",
        data: { notification },
      });
      return;
    }

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

    if (notification.status !== "SENT") {
      res.status(HTTP_STATUS.BAD_GATEWAY).json({
        success: false,
        message: notification.failureReason ?? "Welcome email could not be sent.",
        data: { notification },
      });
      return;
    }

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
    const notification = await notificationService.send({
      recipient: phone,
      type: "ORDER_CONFIRMED",
      template: "order-confirmed",
      payload: {
        customerName: "Customer",
        orderNumber,
        deliveryTime: status,
      },
      provider: "WHATSAPP",
    });

    if (notification.status !== "SENT") {
      res.status(HTTP_STATUS.BAD_GATEWAY).json({
        success: false,
        message:
          notification.failureReason ?? "WhatsApp notification could not be sent.",
        data: { notification },
      });
      return;
    }

    res.json({
      success: true,
      message: `WhatsApp alert processed for +91 ${phone} for Order #${orderNumber} (${status})`,
      data: { notification },
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
  "/unread-count",
  requireAuth,
  asyncHandler(notificationController.getUnreadCount),
);

notificationRouter.patch(
  "/read-all",
  requireAuth,
  asyncHandler(notificationController.markAllAsRead),
);

notificationRouter.patch(
  "/:id/read",
  requireAuth,
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.markAsRead),
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

const broadcastSchema = z.object({
  title: z.string().trim().min(2),
  message: z.string().trim().min(2),
  targetRole: z.string().optional(),
});

notificationRouter.post(
  "/broadcast",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ body: broadcastSchema }),
  asyncHandler(async (req, res) => {
    const { title, message } = req.body as z.infer<typeof broadcastSchema>;
    const notification = await notificationService.send({
      recipient: "ALL_CUSTOMERS",
      type: "ADMIN_NOTIFICATION",
      template: "broadcast",
      payload: { title, message },
      provider: "EMAIL",
    });

    res.json({
      success: true,
      message: `Broadcast notification "${title}" dispatched successfully.`,
      data: { notification },
    });
  }),
);
