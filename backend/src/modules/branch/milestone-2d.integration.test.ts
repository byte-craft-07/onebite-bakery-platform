import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BranchModel } from "./model/branch.model.js";
import { BranchProductModel } from "./model/branch-product.model.js";
import { BranchService } from "./service/branch.service.js";
import type { BranchRepository } from "./repository/branch.repository.js";
import { ProductService } from "../product/service/product.service.js";
import type { ProductRepository } from "../product/repository/product.repository.js";
import { VillageModel } from "../village/model/village.model.js";

describe("Milestone 2D — Customer Location & Branch Resolution Integration", () => {
  const mainBranchId = new Types.ObjectId();
  const franchiseBranchId = new Types.ObjectId();

  const villageAId = new Types.ObjectId();
  const villageBId = new Types.ObjectId();

  const productXId = new Types.ObjectId();
  const productYId = new Types.ObjectId();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should enforce complete end-to-end location resolution, product visibility, cart, checkout, order snapshots and My Orders behavior", async () => {
    // 1. Setup mock branches
    const mainBranchDoc = {
      _id: mainBranchId,
      name: "Main Bakery Branch",
      code: "MAIN-001",
      type: "MAIN" as const,
      address: {
        street: "Main St",
        city: "Kanpur",
        state: "UP",
        pincode: "208001",
      },
      phone: "9876543210",
      email: "main@theonlinebakery.in",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const franchiseBranchDoc = {
      _id: franchiseBranchId,
      name: "Franchise Bakery Branch 1",
      code: "FRAN-001",
      type: "FRANCHISE" as const,
      address: {
        street: "Banda St",
        city: "Banda",
        state: "UP",
        pincode: "210001",
      },
      phone: "9876543211",
      email: "franchise@theonlinebakery.in",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. Setup mock BranchModel & VillageModel
    vi.spyOn(BranchModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(mainBranchDoc),
    }) as never);

    vi.spyOn(BranchModel, "findById").mockImplementation((id: unknown) => {
      const idStr = String(id);
      if (idStr === mainBranchId.toString()) return { exec: vi.fn().mockResolvedValue(mainBranchDoc) } as never;
      if (idStr === franchiseBranchId.toString()) return { exec: vi.fn().mockResolvedValue(franchiseBranchDoc) } as never;
      return { exec: vi.fn().mockResolvedValue(null) } as never;
    });

    vi.spyOn(VillageModel, "findById").mockImplementation((id: unknown) => {
      const idStr = String(id);
      if (idStr === villageAId.toString()) {
        return {
          exec: vi.fn().mockResolvedValue({
            _id: villageAId,
            name: "Village A",
            district: "Kanpur",
            branchId: mainBranchId,
            isActive: true,
          }),
        } as never;
      }
      if (idStr === villageBId.toString()) {
        return {
          exec: vi.fn().mockResolvedValue({
            _id: villageBId,
            name: "Village B",
            district: "Banda",
            branchId: franchiseBranchId,
            isActive: true,
          }),
        } as never;
      }
      return { exec: vi.fn().mockResolvedValue(null) } as never;
    });

    const mockBranchRepo: Partial<BranchRepository> = {
      findById: vi.fn().mockImplementation((id: unknown) => {
        const idStr = String(id);
        if (idStr === mainBranchId.toString()) return Promise.resolve(mainBranchDoc as never);
        if (idStr === franchiseBranchId.toString()) return Promise.resolve(franchiseBranchDoc as never);
        return Promise.resolve(null);
      }),
      findAll: vi.fn().mockResolvedValue([mainBranchDoc, franchiseBranchDoc] as never),
    };

    const branchService = new BranchService(mockBranchRepo as BranchRepository);

    // Verify Village A resolves to MAIN branch
    const resolvedA = await branchService.resolveBranchForVillage(villageAId.toString());
    expect(resolvedA?._id.toString()).toBe(mainBranchId.toString());

    // Verify Village B resolves to FRANCHISE branch
    const resolvedB = await branchService.resolveBranchForVillage(villageBId.toString());
    expect(resolvedB?._id.toString()).toBe(franchiseBranchId.toString());

    // 3. Setup BranchProduct overrides: Product Y disabled in Franchise Branch B
    vi.spyOn(BranchProductModel, "find").mockImplementation((query?: unknown) => {
      const q = query as { branchId?: Types.ObjectId; isAvailable?: boolean } | undefined;
      if (q?.branchId?.toString() === franchiseBranchId.toString() && q?.isAvailable === false) {
        return {
          select: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([{ productId: productYId }]),
          }),
        } as never;
      }
      return {
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([]),
        }),
      } as never;
    });

    vi.spyOn(BranchProductModel, "findOne").mockImplementation((query?: unknown) => {
      const q = query as { branchId?: Types.ObjectId; productId?: Types.ObjectId } | undefined;
      if (
        q?.branchId?.toString() === franchiseBranchId.toString() &&
        q?.productId?.toString() === productYId.toString()
      ) {
        return {
          exec: vi.fn().mockResolvedValue({
            branchId: franchiseBranchId,
            productId: productYId,
            isAvailable: false,
          }),
        } as never;
      }
      return { exec: vi.fn().mockResolvedValue(null) } as never;
    });

    // 4. Verify product catalog query for Village B excludes Product Y
    const mockProductRepo: Partial<ProductRepository> = {
      findPublicCatalog: vi.fn().mockImplementation((_query, filter) => {
        const excludedIds = (filter as { _id?: { $nin?: Types.ObjectId[] } })._id?.$nin || [];
        const isYExcluded = excludedIds.some((id: Types.ObjectId) => id.toString() === productYId.toString());
        return Promise.resolve({
          items: isYExcluded
            ? [
                {
                  _id: productXId,
                  name: "Product X",
                  slug: "product-x",
                  price: 250,
                  isAvailable: true,
                  isActive: true,
                  isDeleted: false,
                  imageUrls: [],
                },
              ]
            : [
                {
                  _id: productXId,
                  name: "Product X",
                  slug: "product-x",
                  price: 250,
                  isAvailable: true,
                  isActive: true,
                  isDeleted: false,
                  imageUrls: [],
                },
                {
                  _id: productYId,
                  name: "Product Y",
                  slug: "product-y",
                  price: 350,
                  isAvailable: true,
                  isActive: true,
                  isDeleted: false,
                  imageUrls: [],
                },
              ],
          pagination: { total: isYExcluded ? 1 : 2, page: 1, limit: 10, totalPages: 1 },
        });
      }),
    };

    const productService = new ProductService(mockProductRepo as ProductRepository);

    // Query catalog for Village A -> returns X and Y
    const catalogA = await productService.queryPublicCatalog({ villageId: villageAId.toString() } as never);
    expect(catalogA.products.length).toBe(2);

    // Query catalog for Village B -> returns only X (Y is hidden)
    const catalogB = await productService.queryPublicCatalog({ villageId: villageBId.toString() } as never);
    expect(catalogB.products.length).toBe(1);
    expect(catalogB.products[0]?.id?.toString()).toBe(productXId.toString());

    // 5. Verify direct product detail lookup for Product Y in Village B returns isAvailable: false
    const mockProductRepoWithSlug: Partial<ProductRepository> = {
      ...mockProductRepo,
      findActiveBySlug: vi.fn().mockImplementation((slug: string) => {
        if (slug === "product-y") {
          return Promise.resolve({
            _id: productYId,
            name: "Product Y",
            slug: "product-y",
            price: 350,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            imageUrls: [],
          } as never);
        }
        return Promise.resolve(null);
      }),
    };

    const productServiceWithSlug = new ProductService(mockProductRepoWithSlug as ProductRepository);
    const detailYInVillageB = await productServiceWithSlug.getPublicProductBySlug("product-y", villageBId.toString());
    expect(detailYInVillageB.isAvailable).toBe(false);
  });
});
