import { Types, type HydratedDocument } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { Category } from "../model/index.js";
import type { CategoryRepository } from "../repository/index.js";
import { CategoryService } from "./category.service.js";

const context: RequestContext = {
  userId: new Types.ObjectId().toString(),
  userRole: "admin",
  requestId: "category-test",
};

const createCategoryDocument = (
  overrides: Partial<Category> = {},
): HydratedDocument<Category> => {
  const now = new Date();
  const category: Category = {
    _id: new Types.ObjectId(),
    name: "Birthday Cakes",
    slug: "birthday-cakes",
    description: "Fresh birthday cakes.",
    image: "https://cdn.onebitebakery.test/birthday-cakes.webp",
    displayOrder: 1,
    isActive: true,
    seoTitle: "Birthday Cakes",
    seoDescription: "Fresh birthday cakes for celebrations.",
    seoKeywords: ["birthday", "cakes"],
    searchableText: "birthday cakes fresh celebrations",
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  return category as HydratedDocument<Category>;
};

const createService = (
  overrides: Partial<Record<keyof CategoryRepository, unknown>> = {},
) => {
  const repository = {
    create: vi.fn().mockImplementation((data: Partial<Category>) =>
      Promise.resolve(createCategoryDocument(data)),
    ),
    findBySlug: vi.fn().mockResolvedValue(null),
    findByName: vi.fn().mockResolvedValue(null),
    findOne: vi.fn().mockResolvedValue(null),
    findAdminList: vi.fn().mockResolvedValue([]),
    findActiveTreeCategories: vi.fn().mockResolvedValue([]),
    findByIdIncludingDeleted: vi.fn().mockResolvedValue(null),
    hasChildren: vi.fn().mockResolvedValue(false),
    updateById: vi.fn().mockImplementation(
      (_id: Types.ObjectId, update: { $set?: Partial<Category> }) =>
        Promise.resolve(createCategoryDocument(update.$set ?? {})),
    ),
    softDelete: vi.fn().mockResolvedValue(createCategoryDocument({
      isDeleted: true,
    })),
    ...overrides,
  } as unknown as CategoryRepository;

  return {
    service: new CategoryService(repository),
    repository,
  };
};

const createDto = () => ({
  name: "Birthday Cakes",
  description: "Fresh birthday cakes.",
  image: "https://cdn.onebitebakery.test/birthday-cakes.webp",
  displayOrder: 1,
  isActive: true,
  parentCategory: null,
  seoTitle: "Birthday Cakes",
  seoDescription: "Fresh birthday cakes for celebrations.",
  seoKeywords: ["birthday", "cakes"],
});

describe("CategoryService", () => {
  it("creates a category with a generated unique slug", async () => {
    const { service, repository } = createService();

    const category = await service.createCategory(createDto(), context);

    expect(category.slug).toBe("birthday-cakes");
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it("prevents duplicate category names", async () => {
    const { service } = createService({
      findByName: vi.fn().mockResolvedValue(createCategoryDocument()),
    });

    await expect(service.createCategory(createDto(), context)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("builds a nested public category tree", async () => {
    const parent = createCategoryDocument({
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
      name: "Cakes",
      slug: "cakes",
    });
    const child = createCategoryDocument({
      _id: new Types.ObjectId("507f1f77bcf86cd799439012"),
      name: "Birthday Cakes",
      parentCategory: parent._id,
    });
    const { service } = createService({
      findActiveTreeCategories: vi.fn().mockResolvedValue([parent, child]),
    });

    const tree = await service.listPublicCategoryTree();

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.name).toBe("Birthday Cakes");
  });

  it("prevents circular parent relationships", async () => {
    const categoryId = new Types.ObjectId("507f1f77bcf86cd799439011");
    const parentId = new Types.ObjectId("507f1f77bcf86cd799439012");
    const category = createCategoryDocument({ _id: categoryId });
    const parent = createCategoryDocument({
      _id: parentId,
      parentCategory: categoryId,
    });
    const { service } = createService({
      findOne: vi
        .fn()
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce(parent),
    });

    await expect(
      service.updateCategory(
        categoryId.toString(),
        { parentCategory: parentId.toString() },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("blocks soft delete when child categories exist", async () => {
    const category = createCategoryDocument();
    const { service } = createService({
      findOne: vi.fn().mockResolvedValue(category),
      hasChildren: vi.fn().mockResolvedValue(true),
    });

    await expect(
      service.deleteCategory(category._id.toString(), context),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("restores a soft-deleted category", async () => {
    const deleted = createCategoryDocument({ isDeleted: true });
    const { service, repository } = createService({
      findByIdIncludingDeleted: vi.fn().mockResolvedValue(deleted),
    });

    await service.restoreCategory(deleted._id.toString(), context);

    expect(repository.updateById).toHaveBeenCalledOnce();
  });

  it("adds a suffix when a generated slug already exists", async () => {
    const { service } = createService({
      findBySlug: vi
        .fn()
        .mockResolvedValueOnce(createCategoryDocument())
        .mockResolvedValueOnce(null),
    });

    const category = await service.createCategory(createDto(), context);

    expect(category.slug).toBe("birthday-cakes-2");
  });
});
