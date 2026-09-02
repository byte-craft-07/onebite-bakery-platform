import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type {
  AssignBranchAdminDto,
  AssignServiceAreaDto,
  CreateBranchDto,
  UpdateBranchDto,
  UpdateBranchStatusDto,
} from "../dto/branch.dto.js";
import type { BranchType } from "../model/branch.model.js";
import type { BranchService } from "../service/branch.service.js";

export class BranchController {
  public constructor(private readonly branchService: BranchService) {}

  public createBranch = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branch = await this.branchService.createBranch(
      request.body as CreateBranchDto,
      actorId,
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Branch created successfully.",
      data: { branch },
    });
  };

  public getAllBranches = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const type = typeof request.query.type === "string" ? (request.query.type as BranchType) : undefined;
    const isActive =
      request.query.isActive === "true"
        ? true
        : request.query.isActive === "false"
          ? false
          : undefined;
    const search = typeof request.query.search === "string" ? request.query.search : undefined;

    const branches = await this.branchService.getAllBranches({ type, isActive, search });

    return sendSuccess(response, {
      message: "Branches fetched successfully.",
      data: { branches },
    });
  };

  public getBranchById = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const branchId = this.getParam(request, "branchId");
    const branch = await this.branchService.getBranchById(branchId);

    return sendSuccess(response, {
      message: "Branch details fetched successfully.",
      data: { branch },
    });
  };

  public updateBranch = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const branch = await this.branchService.updateBranch(
      branchId,
      request.body as UpdateBranchDto,
      actorId,
    );

    return sendSuccess(response, {
      message: "Branch updated successfully.",
      data: { branch },
    });
  };

  public updateBranchStatus = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const { isActive } = request.body as UpdateBranchStatusDto;
    const branch = await this.branchService.updateBranchStatus(
      branchId,
      isActive,
      actorId,
    );

    return sendSuccess(response, {
      message: `Branch ${isActive ? "activated" : "deactivated"} successfully.`,
      data: { branch },
    });
  };

  public assignServiceArea = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const result = await this.branchService.assignServiceArea(
      branchId,
      request.body as AssignServiceAreaDto,
      actorId,
    );

    return sendSuccess(response, {
      message: result.message,
      data: { village: result.village },
    });
  };

  public unassignServiceArea = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const serviceAreaId = this.getParam(request, "serviceAreaId");
    const result = await this.branchService.unassignServiceArea(
      branchId,
      serviceAreaId,
      actorId,
    );

    return sendSuccess(response, {
      message: result.message,
    });
  };

  public listServiceAreas = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const branchId = this.getParam(request, "branchId");
    const villages = await this.branchService.listServiceAreas(branchId);

    return sendSuccess(response, {
      message: "Branch service areas fetched successfully.",
      data: { villages },
    });
  };

  public assignBranchAdmin = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const branch = await this.branchService.assignBranchAdmin(
      branchId,
      request.body as AssignBranchAdminDto,
      actorId,
    );

    return sendSuccess(response, {
      message: "Branch Admin assigned successfully.",
      data: { branch },
    });
  };

  public removeBranchAdmin = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const { userId } = request.body as { userId: string };
    const branch = await this.branchService.removeBranchAdmin(
      branchId,
      userId,
      actorId,
    );

    return sendSuccess(response, {
      message: "Branch Admin removed successfully.",
      data: { branch },
    });
  };

  public getBranchProducts = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const branchId = this.getParam(request, "branchId");
    const products = await this.branchService.getBranchProducts(branchId);

    return sendSuccess(response, {
      message: "Branch product availability & inventory fetched successfully.",
      data: { products },
    });
  };

  public updateBranchProduct = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const actorId = authenticatedRequest.user.id;
    const branchId = this.getParam(request, "branchId");
    const productId = this.getParam(request, "productId");
    const product = await this.branchService.updateBranchProduct(
      branchId,
      productId,
      request.body,
      actorId,
    );

    return sendSuccess(response, {
      message: "Branch product availability/inventory updated successfully.",
      data: { product },
    });
  };

  public getBranchDashboardStats = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const branchId = this.getParam(request, "branchId");
    const stats = await this.branchService.getBranchDashboardStats(branchId);

    return sendSuccess(response, {
      message: "Branch dashboard statistics fetched successfully.",
      data: stats,
    });
  };

  public getBranchProductMatrix = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const data = await this.branchService.getBranchProductMatrix();

    return sendSuccess(response, {
      message: "Branch product matrix fetched successfully.",
      data,
    });
  };

  private getParam(request: Request, paramName: string): string {
    const value = request.params[paramName];
    if (typeof value !== "string") {
      throw new Error(`Validated ${paramName} parameter is missing.`);
    }
    return value;
  }
}
