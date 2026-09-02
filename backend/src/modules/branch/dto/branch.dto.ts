import { z } from "zod";
import { Types } from "mongoose";

import { BRANCH_TYPES } from "../model/branch.model.js";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId string.",
});

export const branchAddressDtoSchema = z.object({
  street: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[0-9]{4,10}$/, "Pincode must be 4 to 10 digits."),
  landmark: z.string().trim().max(150).optional(),
});

export const branchAdminCredentialsDtoSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[0-9]{10,15}$/, "Admin phone number must be 10 to 15 digits."),
  email: z.string().trim().toLowerCase().email("Invalid admin email address.").optional().or(z.literal("")),
  password: z.string().trim().min(4, "Password must be at least 4 characters.").optional().or(z.literal("")),
});

export const createBranchDtoSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, "Branch code must be 3-20 uppercase alphanumeric characters."),
  type: z.enum(BRANCH_TYPES),
  address: branchAddressDtoSchema,
  phone: z.string().trim().regex(/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."),
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  managerId: objectIdSchema.optional(),
  adminCredentials: branchAdminCredentialsDtoSchema.optional(),
});

export type CreateBranchDto = z.infer<typeof createBranchDtoSchema>;

export const updateBranchDtoSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  type: z.enum(BRANCH_TYPES).optional(),
  address: branchAddressDtoSchema.partial().optional(),
  phone: z.string().trim().regex(/^[0-9]{10,15}$/).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  managerId: objectIdSchema.optional().nullable(),
  adminCredentials: branchAdminCredentialsDtoSchema.partial().optional(),
});

export type UpdateBranchDto = z.infer<typeof updateBranchDtoSchema>;

export const updateBranchStatusDtoSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateBranchStatusDto = z.infer<typeof updateBranchStatusDtoSchema>;

export const assignServiceAreaDtoSchema = z.object({
  villageId: objectIdSchema,
});

export type AssignServiceAreaDto = z.infer<typeof assignServiceAreaDtoSchema>;

export const assignBranchAdminDtoSchema = z.object({
  userId: objectIdSchema,
});

export type AssignBranchAdminDto = z.infer<typeof assignBranchAdminDtoSchema>;

export const updateBranchProductDtoSchema = z.object({
  isAvailable: z.boolean().optional(),
  stockQuantity: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  allowBackorder: z.boolean().optional(),
});

export type UpdateBranchProductDto = z.infer<typeof updateBranchProductDtoSchema>;
