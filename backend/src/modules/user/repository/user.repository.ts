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

  public async findByEmail(
    email: string,
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  public async findByGoogleId(
    googleId: string,
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findOne({ googleId }).exec();
  }

  public async createCustomerFromGoogle(payload: {
    googleId: string;
    email: string;
    name: string;
    profileImage?: string;
  }): Promise<HydratedDocument<User>> {
    return this.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      googleId: payload.googleId,
      profileImage: payload.profileImage,
      authProviders: ["google"],
      role: "customer",
      isVerified: true,
      status: "active",
      lastLogin: new Date(),
    });
  }

  public async linkGoogleAccount(
    userId: User["_id"],
    googleId: string,
    profileImage?: string,
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          googleId,
          ...(profileImage ? { profileImage } : {}),
          isVerified: true,
          lastLogin: new Date(),
        },
        $addToSet: {
          authProviders: "google",
        },
      },
      { new: true, runValidators: true },
    ).exec();
  }

  public async createCustomerFromPhone(
    phone: string,
  ): Promise<HydratedDocument<User>> {
    return this.create({
      name: "The Online Bakery Customer",
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
      name: "Ajay Prajapati",
      phone,
      email: "ajaykterha@gmail.com",
      profileImage: "https://lh3.googleusercontent.com/a/ACg8ocKUbft27NKCgakV4you7xwWL4RqMom-n5LZNJ_eTUsfmzR6KlCLUQ=s96-c",
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
