import { describe, expect, it, vi } from "vitest";

import type { ProductResponse } from "../../product/index.js";
import {
  escapeRegex,
  type SearchProvider,
  type SearchResultResponse,
} from "../providers/index.js";
import { SearchService } from "./search.service.js";

const now = new Date();

const mockProductResponse: ProductResponse = {
  id: "507f1f77bcf86cd799439011",
  name: "Chocolate Cake",
  slug: "chocolate-cake",
  description: "Rich chocolate truffle cake.",
  categoryId: "507f1f77bcf86cd799439012",
  occasionIds: ["507f1f77bcf86cd799439013"],
  productType: "NORMAL",
  price: 500,
  imageUrls: ["https://cdn.onebitebakery.test/chocolate-cake.webp"],
  thumbnailUrl: "https://cdn.onebitebakery.test/chocolate-cake-thumb.webp",
  stockStatus: "IN_STOCK",
  isAvailable: true,
  isActive: true,
  isFeatured: true,
  isTrending: false,
  isRecommended: false,
  isSeasonal: false,
  deliveryEligible: true,
  pickupEligible: true,
  displayOrder: 1,
  seoTitle: "Chocolate Cake",
  seoDescription: "Order chocolate cake.",
  seoKeywords: ["chocolate", "cake"],
  createdAt: now,
  updatedAt: now,
};

const mockSearchResult: SearchResultResponse = {
  query: "chocolate",
  products: [mockProductResponse],
  matchedCategories: [{ id: "c1", name: "Cakes", slug: "cakes" }],
  matchedOccasions: [{ id: "o1", name: "Birthday", slug: "birthday" }],
  pagination: {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
};

const createService = (
  providerOverrides: Partial<Record<keyof SearchProvider, unknown>> = {},
) => {
  const provider = {
    providerName: "MOCK",
    search: vi.fn().mockResolvedValue(mockSearchResult),
    ...providerOverrides,
  } as unknown as SearchProvider;

  return {
    service: new SearchService(provider),
    provider,
  };
};

describe("SearchService & EscapeRegex Utility", () => {
  it("escapes special regex characters to prevent regex injection", () => {
    const maliciousQuery = "cake.*+?^${}()|[\\]\\\\";
    const safeRegexString = escapeRegex(maliciousQuery);

    expect(safeRegexString).not.toContain(".*");
    expect(() => new RegExp(safeRegexString, "i")).not.toThrow();
  });

  it("executes basic search through search provider", async () => {
    const { service, provider } = createService();

    const result = await service.executeSearch({ q: "chocolate", page: 1, limit: 20 });

    expect(result.query).toBe("chocolate");
    expect(result.products).toHaveLength(1);
    expect(provider.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "chocolate",
        page: 1,
        limit: 20,
      }),
    );
  });

  it("passes category, occasion, price range, and boolean filters to provider", async () => {
    const { service, provider } = createService();

    await service.executeSearch({
      q: "cake",
      category: "cakes",
      occasion: "birthday",
      minPrice: 100,
      maxPrice: 800,
      isAvailable: true,
      isFeatured: true,
    });

    expect(provider.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "cake",
        category: "cakes",
        occasion: "birthday",
        minPrice: 100,
        maxPrice: 800,
        isAvailable: true,
        isFeatured: true,
      }),
    );
  });

  it("passes sorting parameters (alphabetical, popular, price_asc, price_desc) to search provider", async () => {
    const { service, provider } = createService();

    await service.executeSearch({
      q: "cake",
      sort: "alphabetical",
    });

    expect(provider.search).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: "alphabetical",
      }),
    );
  });

  it("returns empty result structure when no items match search query", async () => {
    const emptyResult: SearchResultResponse = {
      query: "nonexistent",
      products: [],
      matchedCategories: [],
      matchedOccasions: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    };

    const { service } = createService({
      search: vi.fn().mockResolvedValue(emptyResult),
    });

    const result = await service.executeSearch({ q: "nonexistent" });

    expect(result.products).toHaveLength(0);
    expect(result.matchedCategories).toHaveLength(0);
    expect(result.matchedOccasions).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });
});
