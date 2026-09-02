import { Router } from "express";

import { optionalAuth, requireAuth, requireRoles } from "../../auth/index.js";

import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { CustomCakeController } from "../controller/custom-cake.controller.js";
import { CustomCakeRepository } from "../repository/custom-cake.repository.js";
import { CustomCakeService } from "../service/custom-cake.service.js";

export const customCakeRouter = Router();

const repo = new CustomCakeRepository();
export const customCakeService = new CustomCakeService(repo);
const controller = new CustomCakeController(customCakeService);

const adminOnly = [requireAuth, requireRoles(["admin", "branch_admin"])] as const;

// --- Public Endpoints ---
// Get active custom options (flavors, designs, shapes)
customCakeRouter.get("/options", asyncHandler(controller.getOptions));

// Submit custom cake consultation/inquiry
customCakeRouter.post("/inquiries", optionalAuth, asyncHandler(controller.submitInquiry));


// Customer lookup inquiry status by ticket number
customCakeRouter.get("/inquiries/track/:inquiryNumber", asyncHandler(controller.getInquiryByNumber));

// --- Admin Management Endpoints ---
// Options CRUD
customCakeRouter.get("/admin/options", ...adminOnly, asyncHandler(controller.getAllOptionsAdmin));
customCakeRouter.post("/admin/options", ...adminOnly, asyncHandler(controller.createOption));
customCakeRouter.patch("/admin/options/:id", ...adminOnly, asyncHandler(controller.updateOption));
customCakeRouter.delete("/admin/options/:id", ...adminOnly, asyncHandler(controller.deleteOption));

// Inquiries Hub CRUD & Recommendations
customCakeRouter.get("/admin/inquiries", ...adminOnly, asyncHandler(controller.getAllInquiriesAdmin));
customCakeRouter.get("/admin/inquiries/:id", ...adminOnly, asyncHandler(controller.getInquiryByIdAdmin));
customCakeRouter.patch("/admin/inquiries/:id", ...adminOnly, asyncHandler(controller.updateInquiryAdmin));
customCakeRouter.delete("/admin/inquiries/:id", ...adminOnly, asyncHandler(controller.deleteInquiryAdmin));
