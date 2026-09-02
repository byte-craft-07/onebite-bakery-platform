import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import type { CustomCakeService } from "../service/custom-cake.service.js";
import type { CustomCakeOptionType } from "../model/custom-cake-option.model.js";

export class CustomCakeController {
  constructor(private readonly service: CustomCakeService) {}

  // --- Public Endpoints ---
  public getOptions = async (req: Request, res: Response): Promise<void> => {
    const type = req.query.type as CustomCakeOptionType | undefined;
    const options = await this.service.getOptions(type, true);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { options },
    });
  };

  public submitInquiry = async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const payload = {
      ...req.body,
      userId: user?.id || user?._id || undefined,
    };
    const inquiry = await this.service.createInquiry(payload);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Custom cake inquiry submitted successfully! Our head baker will review and reach out.",
      data: { inquiry },
    });
  };

  public getInquiryByNumber = async (req: Request, res: Response): Promise<void> => {
    const inquiry = await this.service.getInquiryByNumber(String(req.params.inquiryNumber));
    if (!inquiry) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Inquiry not found.",
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { inquiry },
    });
  };

  // --- Admin Endpoints ---
  public getAllOptionsAdmin = async (req: Request, res: Response): Promise<void> => {
    const type = req.query.type as CustomCakeOptionType | undefined;
    const options = await this.service.getOptions(type, false);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { options },
    });
  };

  public createOption = async (req: Request, res: Response): Promise<void> => {
    const option = await this.service.createOption(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Option created successfully.",
      data: { option },
    });
  };

  public updateOption = async (req: Request, res: Response): Promise<void> => {
    const option = await this.service.updateOption(String(req.params.id), req.body);
    if (!option) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Option not found.",
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Option updated successfully.",
      data: { option },
    });
  };

  public deleteOption = async (req: Request, res: Response): Promise<void> => {
    const success = await this.service.deleteOption(String(req.params.id));
    if (!success) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Option not found.",
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Option deleted successfully.",
    });
  };

  public getAllInquiriesAdmin = async (req: Request, res: Response): Promise<void> => {
    const { status, search, userId } = req.query;
    const inquiries = await this.service.getInquiries({
      status: status as any,
      search: search ? String(search) : undefined,
      userId: userId ? String(userId) : undefined,
    });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { inquiries },
    });
  };

  public getInquiryByIdAdmin = async (req: Request, res: Response): Promise<void> => {
    const inquiry = await this.service.getInquiryById(String(req.params.id));
    if (!inquiry) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Inquiry not found.",
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { inquiry },
    });
  };

  public updateInquiryAdmin = async (req: Request, res: Response): Promise<void> => {
    const inquiry = await this.service.updateInquiry(String(req.params.id), req.body);
    if (!inquiry) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Inquiry not found.",
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Inquiry updated successfully.",
      data: { inquiry },
    });
  };

  public deleteInquiryAdmin = async (req: Request, res: Response): Promise<void> => {
    const success = await this.service.deleteInquiry(String(req.params.id));
    if (!success) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Inquiry not found.",
      });
      return;
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Inquiry deleted successfully.",
    });
  };
}
