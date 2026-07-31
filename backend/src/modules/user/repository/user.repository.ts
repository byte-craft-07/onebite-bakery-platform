import type { HydratedDocument } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { UserModel, type User } from "../model/index.js";

export class UserRepository extends BaseRepository<User> {
  public constructor() {
    super(UserModel);
  }

  public async findByPhone(
    phone: string,
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findOne({ phone }).exec();
  }

  public async createCustomerFromPhone(
    phone: string,
  ): Promise<HydratedDocument<User>> {
    return this.create({
      name: "OneBite Customer",
      phone,
      role: "customer",
      isVerified: true,
      status: "active",
      lastLogin: new Date(),
    });
  }

  public async createAdminFromPhone(
    phone: string,
  ): Promise<HydratedDocument<User>> {
    return this.create({
      name: "Development Admin",
      phone,
      email: "admin@onebite.local",
      role: "admin",
      isVerified: true,
      status: "active",
      lastLogin: new Date(),
    });
  }

  public async markVerifiedLogin(
    userId: User["_id"],
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          isVerified: true,
          lastLogin: new Date(),
        },
      },
      { new: true, runValidators: true },
    ).exec();
  }
}
