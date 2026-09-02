import type { HydratedDocument, Types, UpdateQuery } from "mongoose";

import { escapeRegex } from "../../../shared/utils/escape-regex.js";
import { BranchModel, type Branch, type BranchType } from "../model/branch.model.js";

export interface FindBranchesFilter {
  type?: BranchType;
  isActive?: boolean;
  search?: string;
}

export class BranchRepository {
  public async create(data: Partial<Branch>): Promise<HydratedDocument<Branch>> {
    const branch = new BranchModel(data);
    return branch.save();
  }

  public async findById(id: Types.ObjectId): Promise<HydratedDocument<Branch> | null> {
    return BranchModel.findById(id).exec();
  }

  public async findByCode(code: string): Promise<HydratedDocument<Branch> | null> {
    return BranchModel.findOne({ code: code.toUpperCase() }).exec();
  }

  public async findByManager(managerId: Types.ObjectId): Promise<HydratedDocument<Branch> | null> {
    return BranchModel.findOne({ managerId }).exec();
  }

  public async findAll(filter: FindBranchesFilter = {}): Promise<HydratedDocument<Branch>[]> {
    const query: Record<string, unknown> = {};

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    if (filter.search && filter.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(filter.search.trim()), "i");
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { "address.city": searchRegex }];
    }

    return BranchModel.find(query).sort({ type: 1, name: 1 }).exec();
  }

  public async update(
    id: Types.ObjectId,
    update: UpdateQuery<Branch>,
  ): Promise<HydratedDocument<Branch> | null> {
    return BranchModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).exec();
  }
}
