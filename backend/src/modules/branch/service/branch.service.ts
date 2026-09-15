import type { HydratedDocument, Types } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { OrderModel } from "../../order/model/order.model.js";
import { ProductModel } from "../../product/model/product.model.js";
import { AuditLogModel } from "../../platform/model/audit-log.model.js";
import { UserModel, type User } from "../../user/model/user.model.js";
import { hashPassword } from "../../auth/utils/password.js";
import { VillageModel, type Village } from "../../village/model/village.model.js";
import type {
  AssignBranchAdminDto,
  AssignServiceAreaDto,
  CreateBranchDto,
  UpdateBranchDto,
  UpdateBranchProductDto,
} from "../dto/branch.dto.js";
import { BranchProductModel, type BranchProduct } from "../model/branch-product.model.js";
import { BranchModel, type Branch, type BranchAddress, type BranchType } from "../model/branch.model.js";
import type { BranchRepository, FindBranchesFilter } from "../repository/branch.repository.js";

export interface BranchProductResponse {
  branchId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productType: string;
  globalPrice: number;
  globalIsAvailable: boolean;
  thumbnailUrl: string;
  isAvailable: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  isOverride: boolean;
  updatedAt?: Date;
}

export interface BranchResponse {
  id: string;
  name: string;
  code: string;
  type: BranchType;
  address: BranchAddress;
  phone: string;
  email: string;
  managerId?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  isActive: boolean;
  villageCount?: number;
  villages?: Array<{
    id: string;
    name: string;
    district: string;
    pincode: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class BranchService {
  public constructor(private readonly branchRepository: BranchRepository) {}

  public async createBranch(
    dto: CreateBranchDto,
    actorId?: string,
  ): Promise<BranchResponse> {
    const code = dto.code.toUpperCase();
    const existingCode = await this.branchRepository.findByCode(code);
    if (existingCode) {
      throw new AppError(
        `Branch code '${code}' already exists. Branch codes must be unique.`,
        HTTP_STATUS.CONFLICT,
      );
    }

    let managerUser: HydratedDocument<User> | null = null;
    if (dto.adminCredentials && dto.adminCredentials.name && dto.adminCredentials.phone) {
      const cleanPhone = dto.adminCredentials.phone.trim();
      const cleanEmail = dto.adminCredentials.email ? dto.adminCredentials.email.trim().toLowerCase() : undefined;

      let user = await UserModel.findOne({
        $or: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      }).exec();

      if (user) {
        if (dto.adminCredentials.password && dto.adminCredentials.password.trim()) {
          user.password = hashPassword(dto.adminCredentials.password.trim());
        }
        user.name = dto.adminCredentials.name;
        if (cleanPhone) user.phone = cleanPhone;
        if (cleanEmail) user.email = cleanEmail;
        user.role = "branch_admin";
        user.status = "active";
        user.isVerified = true;
        await user.save();
      } else {
        user = new UserModel({
          name: dto.adminCredentials.name,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          password: dto.adminCredentials.password && dto.adminCredentials.password.trim() ? hashPassword(dto.adminCredentials.password.trim()) : undefined,
          role: "branch_admin",
          status: "active",
          isVerified: true,
        });
        await user.save();
      }
      managerUser = user;
    } else if (dto.managerId) {
      const managerObjId = toObjectId(dto.managerId);
      managerUser = await UserModel.findById(managerObjId).exec();
      if (!managerUser) {
        throw new AppError(
          "Specified Branch Admin user does not exist.",
          HTTP_STATUS.NOT_FOUND,
        );
      }
    }

    const branch = await this.branchRepository.create({
      name: dto.name,
      code,
      type: dto.type,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      managerId: managerUser ? managerUser._id : undefined,
      isActive: true,
    });

    if (managerUser) {
      managerUser.role = "branch_admin";
      managerUser.branchId = branch._id;
      await managerUser.save();

      if (!branch.managerId) {
        branch.managerId = managerUser._id;
        await branch.save();
      }
    }

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "BRANCH_CREATED",
        entity: "Branch",
        entityId: branch._id.toString(),
        timestamp: new Date(),
        metadata: {
          name: branch.name,
          code: branch.code,
          type: branch.type,
          managerPhone: managerUser?.phone,
        },
      });
    }

    return this.toBranchResponse(branch, managerUser?.name, managerUser?.phone, managerUser?.email);
  }

  public async getAllBranches(
    filter: FindBranchesFilter = {},
  ): Promise<BranchResponse[]> {
    const branches = await this.branchRepository.findAll(filter);

    const branchIds = branches.map((b) => b._id);
    const allAssignedVillages = await VillageModel.find({ branchId: { $in: branchIds } })
      .select("_id name district pincode branchId")
      .sort({ name: 1 })
      .lean()
      .exec();

    const villageMap = new Map<string, Array<{ id: string; name: string; district: string; pincode: string }>>();
    for (const v of allAssignedVillages) {
      if (v.branchId) {
        const bIdStr = v.branchId.toString();
        if (!villageMap.has(bIdStr)) {
          villageMap.set(bIdStr, []);
        }
        villageMap.get(bIdStr)!.push({
          id: v._id.toString(),
          name: v.name,
          district: v.district,
          pincode: v.pincode,
        });
      }
    }

    const managerIds = branches
      .map((b) => b.managerId)
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    const managers = await UserModel.find({ _id: { $in: managerIds } })
      .select("_id name phone email")
      .lean()
      .exec();

    const managerMap = new Map<string, { name: string; phone?: string; email?: string }>();
    for (const m of managers) {
      managerMap.set(m._id.toString(), { name: m.name, phone: m.phone, email: m.email });
    }

    return branches.map((b) => {
      const vList = villageMap.get(b._id.toString()) || [];
      const mgr = b.managerId ? managerMap.get(b.managerId.toString()) : undefined;
      return this.toBranchResponse(b, mgr?.name, mgr?.phone, mgr?.email, vList.length, vList);
    });
  }

  public async getBranchById(id: string): Promise<BranchResponse> {
    const branchObjId = toObjectId(id);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    let managerName: string | undefined;
    let managerPhone: string | undefined;
    let managerEmail: string | undefined;
    if (branch.managerId) {
      const manager = await UserModel.findById(branch.managerId).select("name phone email").lean().exec();
      managerName = manager?.name;
      managerPhone = manager?.phone;
      managerEmail = manager?.email;
    }

    const villages = await VillageModel.find({ branchId: branch._id })
      .sort({ name: 1 })
      .lean()
      .exec();

    const formattedVillages = villages.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      district: v.district,
      pincode: v.pincode,
    }));

    return this.toBranchResponse(
      branch,
      managerName,
      managerPhone,
      managerEmail,
      formattedVillages.length,
      formattedVillages,
    );
  }

  public async updateBranch(
    id: string,
    dto: UpdateBranchDto,
    actorId?: string,
  ): Promise<BranchResponse> {
    const branchObjId = toObjectId(id);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    let managerName: string | undefined;
    let managerPhone: string | undefined;
    let managerEmail: string | undefined;

    if (dto.adminCredentials && dto.adminCredentials.phone) {
      const cleanPhone = dto.adminCredentials.phone.trim();
      const cleanEmail = dto.adminCredentials.email ? dto.adminCredentials.email.trim().toLowerCase() : undefined;

      let user = await UserModel.findOne({
        $or: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      }).exec();

      if (user) {
        if (dto.adminCredentials.name) user.name = dto.adminCredentials.name;
        if (cleanPhone) user.phone = cleanPhone;
        if (cleanEmail !== undefined) user.email = cleanEmail || undefined;
        if (dto.adminCredentials.password && dto.adminCredentials.password.trim()) {
          user.password = hashPassword(dto.adminCredentials.password.trim());
        }
        user.role = "branch_admin";
        user.branchId = branch._id;
        user.status = "active";
        user.isVerified = true;
        await user.save();
      } else if (dto.adminCredentials.name) {
        user = new UserModel({
          name: dto.adminCredentials.name,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          password: dto.adminCredentials.password && dto.adminCredentials.password.trim() ? hashPassword(dto.adminCredentials.password.trim()) : undefined,
          role: "branch_admin",
          branchId: branch._id,
          status: "active",
          isVerified: true,
        });
        await user.save();
      }
      if (user) {
        branch.managerId = user._id;
        managerName = user.name;
        managerPhone = user.phone;
        managerEmail = user.email;
      }
    } else if (dto.managerId !== undefined) {
      if (dto.managerId === null) {
        if (branch.managerId) {
          const oldManager = await UserModel.findById(branch.managerId);
          if (oldManager && oldManager.role === "branch_admin") {
            oldManager.role = "customer";
            oldManager.branchId = undefined;
            await oldManager.save();
          }
        }
        branch.managerId = undefined;
      } else {
        const managerObjId = toObjectId(dto.managerId);
        const newManager = await UserModel.findById(managerObjId);
        if (!newManager) {
          throw new AppError("Specified Branch Admin user not found.", HTTP_STATUS.NOT_FOUND);
        }

        if (branch.managerId && branch.managerId.toString() !== newManager._id.toString()) {
          const oldManager = await UserModel.findById(branch.managerId);
          if (oldManager && oldManager.role === "branch_admin") {
            oldManager.role = "customer";
            oldManager.branchId = undefined;
            await oldManager.save();
          }
        }

        newManager.role = "branch_admin";
        newManager.branchId = branch._id;
        await newManager.save();

        branch.managerId = newManager._id;
        managerName = newManager.name;
      }
    }

    if (dto.name) branch.name = dto.name;
    if (dto.type) branch.type = dto.type;
    if (dto.phone) branch.phone = dto.phone;
    if (dto.email) branch.email = dto.email;
    if (dto.address) {
      branch.address = {
        ...branch.address,
        ...dto.address,
      };
    }

    await branch.save();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "BRANCH_UPDATED",
        entity: "Branch",
        entityId: branch._id.toString(),
        timestamp: new Date(),
        metadata: { name: branch.name, type: branch.type },
      });
    }

    return this.toBranchResponse(branch, managerName, managerPhone, managerEmail);
  }

  public async updateBranchStatus(
    id: string,
    isActive: boolean,
    actorId?: string,
  ): Promise<BranchResponse> {
    const branchObjId = toObjectId(id);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    branch.isActive = isActive;
    await branch.save();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: isActive ? "BRANCH_ACTIVATED" : "BRANCH_DEACTIVATED",
        entity: "Branch",
        entityId: branch._id.toString(),
        timestamp: new Date(),
        metadata: { name: branch.name, code: branch.code, isActive },
      });
    }

    return this.toBranchResponse(branch);
  }

  public async assignServiceArea(
    branchId: string,
    dto: AssignServiceAreaDto,
    actorId?: string,
  ): Promise<{ message: string; village: Village }> {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (!branch.isActive) {
      throw new AppError("Cannot assign service area to an inactive branch.", HTTP_STATUS.BAD_REQUEST);
    }

    const villageObjId = toObjectId(dto.villageId);
    const village = await VillageModel.findById(villageObjId);

    if (!village) {
      throw new AppError("Village not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (village.branchId && village.branchId.toString() !== branch._id.toString()) {
      const existingBranch = await this.branchRepository.findById(village.branchId);
      const isReassignFromMainToFranchise =
        existingBranch &&
        existingBranch.type === "MAIN" &&
        branch.type !== "MAIN";

      if (!isReassignFromMainToFranchise) {
        const existingName = existingBranch ? existingBranch.name : village.branchId.toString();
        throw new AppError(
          `Service area '${village.name}' is already assigned to branch '${existingName}'. Reassignment must be unassigned first.`,
          HTTP_STATUS.CONFLICT,
        );
      }
    }

    village.branchId = branch._id;
    await village.save();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "VILLAGE_ASSIGNED",
        entity: "Village",
        entityId: village._id.toString(),
        timestamp: new Date(),
        metadata: { villageName: village.name, branchId: branch._id.toString(), branchName: branch.name },
      });
    }

    return {
      message: `Village '${village.name}' successfully assigned to branch '${branch.name}'.`,
      village,
    };
  }

  public async unassignServiceArea(
    branchId: string,
    serviceAreaId: string,
    actorId?: string,
  ): Promise<{ message: string }> {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    let village = null;
    const cleanId = (serviceAreaId || "").trim();
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      village = await VillageModel.findById(cleanId).exec();
    }
    if (!village) {
      village = await VillageModel.findOne({
        name: { $regex: new RegExp(`^${cleanId}$`, "i") },
      }).exec();
    }

    if (!village) {
      throw new AppError("Service area / Village not found.", HTTP_STATUS.NOT_FOUND);
    }

    await VillageModel.updateOne(
      { _id: village._id },
      { $set: { branchId: null } },
    ).exec();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "VILLAGE_UNASSIGNED",
        entity: "Village",
        entityId: village._id.toString(),
        timestamp: new Date(),
        metadata: {
          villageName: village.name,
          previousBranchId: branch._id.toString(),
          branchName: branch.name,
        },
      });
    }

    return {
      message: `Village '${village.name}' unassigned successfully.`,
    };
  }

  public async listServiceAreas(branchId: string): Promise<Village[]> {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    return VillageModel.find({ branchId: branch._id }).sort({ name: 1 }).exec();
  }

  public async assignBranchAdmin(
    branchId: string,
    dto: AssignBranchAdminDto,
    actorId?: string,
  ): Promise<BranchResponse> {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (!branch.isActive) {
      throw new AppError("Cannot assign Branch Admin to an inactive branch.", HTTP_STATUS.BAD_REQUEST);
    }

    const userObjId = toObjectId(dto.userId);
    const user = await UserModel.findById(userObjId);

    if (!user) {
      throw new AppError("Target user not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (user.branchId && user.branchId.toString() !== branch._id.toString()) {
      const otherBranch = await this.branchRepository.findById(user.branchId);
      const otherName = otherBranch ? otherBranch.name : user.branchId.toString();
      throw new AppError(
        `User '${user.name}' is already assigned as Branch Admin for branch '${otherName}'.`,
        HTTP_STATUS.CONFLICT,
      );
    }

    if (branch.managerId && branch.managerId.toString() !== user._id.toString()) {
      const oldManager = await UserModel.findById(branch.managerId);
      if (oldManager && oldManager.role === "branch_admin") {
        oldManager.role = "customer";
        oldManager.branchId = undefined;
        await oldManager.save();
      }
    }

    user.role = "branch_admin";
    user.branchId = branch._id;
    await user.save();

    branch.managerId = user._id;
    await branch.save();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "BRANCH_ADMIN_ASSIGNED",
        entity: "Branch",
        entityId: branch._id.toString(),
        timestamp: new Date(),
        metadata: { userId: user._id.toString(), userName: user.name, branchName: branch.name },
      });
    }

    return this.toBranchResponse(branch, user.name);
  }

  public async removeBranchAdmin(
    branchId: string,
    userId: string,
    actorId?: string,
  ): Promise<BranchResponse> {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);

    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    const userObjId = toObjectId(userId);
    const user = await UserModel.findById(userObjId);

    if (!user) {
      throw new AppError("Target user not found.", HTTP_STATUS.NOT_FOUND);
    }

    user.branchId = undefined;
    if (user.role === "branch_admin") {
      user.role = "customer";
    }
    await user.save();

    if (branch.managerId && branch.managerId.toString() === user._id.toString()) {
      branch.managerId = undefined;
      await branch.save();
    }

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "BRANCH_ADMIN_REMOVED",
        entity: "Branch",
        entityId: branch._id.toString(),
        timestamp: new Date(),
        metadata: { userId: user._id.toString(), userName: user.name, branchName: branch.name },
      });
    }

    return this.toBranchResponse(branch);
  }

  public async resolveBranchForVillage(
    villageId?: string | Types.ObjectId,
  ): Promise<HydratedDocument<Branch> | null> {
    // 1. Resolve true Main Branch (strictly MAIN type or TOB-HQ / Main Store name)
    const mainBranch =
      (await BranchModel.findOne({ type: "MAIN", isActive: true }).exec()) ||
      (await BranchModel.findOne({ code: "TOB-HQ", isActive: true }).exec()) ||
      (await BranchModel.findOne({ name: { $regex: /main\s*store|main\s*branch/i }, type: { $ne: "FRANCHISE" }, isActive: true }).exec()) ||
      (await BranchModel.findOne({ type: "MAIN" }).exec()) ||
      (await BranchModel.findOne({ code: "TOB-HQ" }).exec()) ||
      (await BranchModel.findOne({ type: { $ne: "FRANCHISE" }, isActive: true }).exec()) ||
      (await BranchModel.findOne({ name: { $not: { $regex: /raja|franchise/i } }, isActive: true }).exec()) ||
      (await BranchModel.findOne({ isActive: true }).exec());

    if (!villageId) {
      return mainBranch;
    }

    const vStr = villageId.toString().trim();
    if (!vStr) {
      return mainBranch;
    }

    let village = null;

    if (vStr.match(/^[0-9a-fA-F]{24}$/)) {
      village = await VillageModel.findById(vStr).exec();
    }

    if (!village) {
      const parts = vStr.split(",").map((p) => p.trim()).filter(Boolean);
      const possibleName = parts[0] || vStr;
      const possibleDistrict = parts[1];

      if (possibleDistrict) {
        village = await VillageModel.findOne({
          name: { $regex: new RegExp(`^${possibleName}$`, "i") },
          district: { $regex: new RegExp(`^${possibleDistrict}$`, "i") },
        }).exec();
      }

      if (!village) {
        village = await VillageModel.findOne({
          name: { $regex: new RegExp(`^${possibleName}$`, "i") },
        }).exec();
      }

      // If still not found, check if vStr matches or contains any known village name
      if (!village && VillageModel.db?.readyState === 1) {
        try {
          const allActiveVillages = await VillageModel.find({ isActive: true }).exec();
          if (Array.isArray(allActiveVillages)) {
            const matched = allActiveVillages.find((v) => {
              const vName = v.name?.trim().toLowerCase() || "";
              const q = vStr.toLowerCase();
              return q === vName || q.includes(vName) || vName.includes(q);
            });
            if (matched) {
              village = matched;
            }
          }
        } catch (_e) {
          // Ignore
        }
      }
    }

    if (village && village.branchId) {
      const branch = await this.branchRepository.findById(village.branchId);
      if (branch && branch.isActive) {
        return branch;
      }
    }

    return mainBranch;
  }

  public async getBranchProducts(branchId: string): Promise<BranchProductResponse[]> {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);
    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    const products = await ProductModel.find({ isDeleted: false, isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    const overrides = await BranchProductModel.find({ branchId: branch._id }).exec();
    const overrideMap = new Map<string, HydratedDocument<BranchProduct>>();
    for (const ov of overrides) {
      overrideMap.set(ov.productId.toString(), ov);
    }

    return products.map((prod) => {
      const ov = overrideMap.get(prod._id.toString());
      return {
        branchId: branch._id.toString(),
        productId: prod._id.toString(),
        productName: prod.name,
        productSlug: prod.slug,
        productType: prod.productType,
        globalPrice: prod.price,
        globalIsAvailable: prod.isAvailable,
        thumbnailUrl: prod.thumbnailUrl,
        isAvailable: ov ? ov.isAvailable : prod.isAvailable,
        stockQuantity: ov ? ov.stockQuantity : prod.stockQuantity,
        lowStockThreshold: ov ? ov.lowStockThreshold : prod.lowStockThreshold,
        allowBackorder: ov ? ov.allowBackorder : prod.allowBackorder,
        isOverride: Boolean(ov),
        updatedAt: ov ? ov.updatedAt : prod.updatedAt,
      };
    });
  }

  public async getBranchProductMatrix() {
    const products = await ProductModel.find({ isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .select("_id name slug price isAvailable thumbnailUrl productType")
      .lean()
      .exec();

    const branches = await this.branchRepository.findAll();
    const activeBranches = branches.filter((b) => b.isActive);
    const allOverrides = await BranchProductModel.find().lean().exec();

    const matrix: Record<
      string,
      Record<
        string,
        {
          isAvailable: boolean;
          stockQuantity: number;
          lowStockThreshold: number;
          allowBackorder: boolean;
          isOverride: boolean;
        }
      >
    > = {};

    for (const ov of allOverrides) {
      const bId = ov.branchId.toString();
      const pId = ov.productId.toString();
      if (!matrix[pId]) {
        matrix[pId] = {};
      }
      matrix[pId]![bId] = {
        isAvailable: ov.isAvailable,
        stockQuantity: ov.stockQuantity,
        lowStockThreshold: ov.lowStockThreshold,
        allowBackorder: ov.allowBackorder,
        isOverride: true,
      };
    }

    return {
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        price: p.price,
        globalIsAvailable: p.isAvailable,
        thumbnailUrl: p.thumbnailUrl,
        productType: p.productType,
      })),
      branches: activeBranches.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        code: b.code,
        type: b.type,
      })),
      matrix,
    };
  }

  public async updateBranchProduct(
    branchId: string,
    productId: string,
    dto: UpdateBranchProductDto,
    actorId?: string,
  ): Promise<BranchProductResponse> {
    const branchObjId = toObjectId(branchId);
    const productObjId = toObjectId(productId);

    const branch = await this.branchRepository.findById(branchObjId);
    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    const product = await ProductModel.findOne({ _id: productObjId, isDeleted: false }).exec();
    if (!product) {
      throw new AppError("Product not found.", HTTP_STATUS.NOT_FOUND);
    }

    let branchProd = await BranchProductModel.findOne({
      branchId: branch._id,
      productId: product._id,
    }).exec();

    if (!branchProd) {
      branchProd = new BranchProductModel({
        branchId: branch._id,
        productId: product._id,
        isAvailable: dto.isAvailable ?? product.isAvailable,
        stockQuantity: dto.stockQuantity ?? product.stockQuantity,
        lowStockThreshold: dto.lowStockThreshold ?? product.lowStockThreshold,
        allowBackorder: dto.allowBackorder ?? product.allowBackorder,
        createdBy: actorId ? toObjectId(actorId) : undefined,
      });
    } else {
      if (typeof dto.isAvailable === "boolean") branchProd.isAvailable = dto.isAvailable;
      if (typeof dto.stockQuantity === "number") branchProd.stockQuantity = dto.stockQuantity;
      if (typeof dto.lowStockThreshold === "number") branchProd.lowStockThreshold = dto.lowStockThreshold;
      if (typeof dto.allowBackorder === "boolean") branchProd.allowBackorder = dto.allowBackorder;
    }

    if (actorId) branchProd.updatedBy = toObjectId(actorId);
    await branchProd.save();

    if (actorId) {
      const action =
        dto.isAvailable === true
          ? "BRANCH_PRODUCT_ENABLED"
          : dto.isAvailable === false
          ? "BRANCH_PRODUCT_DISABLED"
          : "BRANCH_STOCK_UPDATED";

      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action,
        entity: "BranchProduct",
        entityId: branchProd._id.toString(),
        timestamp: new Date(),
        metadata: {
          branchId: branch._id.toString(),
          branchName: branch.name,
          productId: product._id.toString(),
          productName: product.name,
          isAvailable: branchProd.isAvailable,
          stockQuantity: branchProd.stockQuantity,
        },
      });
    }

    return {
      branchId: branch._id.toString(),
      productId: product._id.toString(),
      productName: product.name,
      productSlug: product.slug,
      productType: product.productType,
      globalPrice: product.price,
      globalIsAvailable: product.isAvailable,
      thumbnailUrl: product.thumbnailUrl,
      isAvailable: branchProd.isAvailable,
      stockQuantity: branchProd.stockQuantity,
      lowStockThreshold: branchProd.lowStockThreshold,
      allowBackorder: branchProd.allowBackorder,
      isOverride: true,
      updatedAt: branchProd.updatedAt,
    };
  }

  public async getBranchDashboardStats(branchId: string) {
    const branchObjId = toObjectId(branchId);
    const branch = await this.branchRepository.findById(branchObjId);
    if (!branch) {
      throw new AppError("Branch not found.", HTTP_STATUS.NOT_FOUND);
    }

    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    istNow.setUTCHours(0, 0, 0, 0);
    const startOfTodayIST = new Date(istNow.getTime() - istOffsetMs);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sinceDate = startOfTodayIST < last24h ? startOfTodayIST : last24h;

    const [todayOrdersCount, totalOrdersCount, pendingCount, preparingCount, outForDeliveryCount, deliveredCount, cancelledCount] = await Promise.all([
      OrderModel.countDocuments({ branchId: branch._id, createdAt: { $gte: sinceDate } }).exec(),
      OrderModel.countDocuments({ branchId: branch._id }).exec(),
      OrderModel.countDocuments({ branchId: branch._id, orderStatus: "PENDING" }).exec(),
      OrderModel.countDocuments({ branchId: branch._id, orderStatus: { $in: ["CONFIRMED", "PREPARING", "BAKING", "QUALITY_CHECK", "PACKED"] } }).exec(),
      OrderModel.countDocuments({ branchId: branch._id, orderStatus: "OUT_FOR_DELIVERY" }).exec(),
      OrderModel.countDocuments({ branchId: branch._id, orderStatus: "DELIVERED" }).exec(),
      OrderModel.countDocuments({ branchId: branch._id, orderStatus: "CANCELLED" }).exec(),
    ]);

    const branchProducts = await this.getBranchProducts(branchId);
    const lowStockCount = branchProducts.filter(
      (p) => p.isAvailable && p.stockQuantity <= p.lowStockThreshold,
    ).length;
    const unavailableCount = branchProducts.filter((p) => !p.isAvailable).length;

    return {
      branch: {
        id: branch._id.toString(),
        name: branch.name,
        code: branch.code,
        type: branch.type,
      },
      stats: {
        todayOrders: todayOrdersCount,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingCount,
        preparingOrders: preparingCount,
        outForDelivery: outForDeliveryCount,
        deliveredOrders: deliveredCount,
        cancelledOrders: cancelledCount,
        lowStockProducts: lowStockCount,
        unavailableProducts: unavailableCount,
      },
    };
  }

  private toBranchResponse(
    branch: HydratedDocument<Branch>,
    managerName?: string,
    managerPhone?: string,
    managerEmail?: string,
    villageCount?: number,
    villages?: Array<{ id: string; name: string; district: string; pincode: string }>,
  ): BranchResponse {
    return {
      id: branch._id.toString(),
      name: branch.name,
      code: branch.code,
      type: branch.type,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      managerId: branch.managerId ? branch.managerId.toString() : undefined,
      managerName,
      managerPhone,
      managerEmail,
      isActive: branch.isActive,
      ...(villageCount !== undefined ? { villageCount } : {}),
      ...(villages ? { villages } : {}),
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }
}
