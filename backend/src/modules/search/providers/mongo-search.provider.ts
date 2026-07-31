import type { FilterQuery, Types } from "mongoose";

import { CategoryModel } from "../../category/index.js";
import { OccasionModel } from "../../occasion/index.js";
import { ProductModel, type Product } from "../../product/index.js";
import type {
  MatchedCategoryItem,
  MatchedOccasionItem,
  SearchProvider,
  SearchQueryDto,
  SearchResultResponse,
  SearchSortOption,
} from "./search-provider.interface.js";

export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export class MongoSearchProvider implements SearchProvider {
  public readonly providerName = "MONGO";

  public async search(query: SearchQueryDto): Promise<SearchResultResponse> {
    const rawSearchText = (query.query ?? query.q ?? "").trim();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const safeSearchText = rawSearchText.slice(0, 100);
    const escapedQuery = escapeRegex(safeSearchText);
    const searchRegex = escapedQuery ? new RegExp(escapedQuery, "i") : null;

    let matchedCategoryIdsFromQuery: string[] = [];
    let matchedOccasionIdsFromQuery: string[] = [];
    let matchedCategories: MatchedCategoryItem[] = [];
    let matchedOccasions: MatchedOccasionItem[] = [];

    if (searchRegex) {
      const [categories, occasions] = await Promise.all([
        CategoryModel.find({
          isActive: true,
          isDeleted: false,
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { slug: searchRegex },
            { seoKeywords: searchRegex },
          ],
        })
          .select("_id name slug description")
          .limit(10)
          .lean()
          .exec(),
        OccasionModel.find({
          isActive: true,
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { slug: searchRegex },
            { seoKeywords: searchRegex },
          ],
        })
          .select("_id name slug description")
          .limit(10)
          .lean()
          .exec(),
      ]);

      matchedCategories = categories.map((cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        ...(cat.description ? { description: cat.description } : {}),
      }));

      matchedOccasions = occasions.map((occ) => ({
        id: occ._id.toString(),
        name: occ.name,
        slug: occ.slug,
        ...(occ.description ? { description: occ.description } : {}),
      }));

      matchedCategoryIdsFromQuery = categories.map((cat) => cat._id.toString());
      matchedOccasionIdsFromQuery = occasions.map((occ) => occ._id.toString());
    }

    const filter: FilterQuery<Product> = {
      isActive: true,
      isDeleted: false,
    };

    if (searchRegex) {
      const textConditions: FilterQuery<Product>[] = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { seoKeywords: searchRegex },
        { seoTitle: searchRegex },
      ];

      if (matchedCategoryIdsFromQuery.length > 0) {
        textConditions.push({
          categoryId: { $in: matchedCategoryIdsFromQuery },
        });
      }

      if (matchedOccasionIdsFromQuery.length > 0) {
        textConditions.push({
          occasionIds: { $in: matchedOccasionIdsFromQuery },
        });
      }

      filter.$or = textConditions;
    }

    if (query.category) {
      const isObjectId = /^[a-f\d]{24}$/i.test(query.category);
      if (isObjectId) {
        filter.categoryId = query.category;
      } else {
        const cat = await CategoryModel.findOne({
          slug: query.category,
          isActive: true,
          isDeleted: false,
        })
          .select("_id")
          .lean()
          .exec();
        if (cat) {
          filter.categoryId = cat._id;
        } else {
          return {
            query: safeSearchText,
            products: [],
            matchedCategories: [],
            matchedOccasions: [],
            pagination: { total: 0, page, limit, totalPages: 1 },
          };
        }
      }
    }

    if (query.occasion) {
      const isObjectId = /^[a-f\d]{24}$/i.test(query.occasion);
      if (isObjectId) {
        filter.occasionIds = query.occasion;
      } else {
        const occ = await OccasionModel.findOne({
          slug: query.occasion,
          isActive: true,
        })
          .select("_id")
          .lean()
          .exec();
        if (occ) {
          filter.occasionIds = occ._id;
        } else {
          return {
            query: safeSearchText,
            products: [],
            matchedCategories: [],
            matchedOccasions: [],
            pagination: { total: 0, page, limit, totalPages: 1 },
          };
        }
      }
    }

    if (query.productType) {
      filter.productType = query.productType;
    }

    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable;
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    if (query.isTrending !== undefined) {
      filter.isTrending = query.isTrending;
    }

    if (query.isSeasonal !== undefined) {
      filter.isSeasonal = query.isSeasonal;
    }

    if (query.isRecommended !== undefined) {
      filter.isRecommended = query.isRecommended;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        filter.price.$lte = query.maxPrice;
      }
    }

    const sortOption = this.resolveSortOption(query.sort);

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .select("-costPrice -deletedAt -deletedBy -__v")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const mappedProducts = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      ...(product.shortDescription
        ? { shortDescription: product.shortDescription }
        : {}),
      description: product.description,
      categoryId: product.categoryId.toString(),
      occasionIds: (product.occasionIds ?? []).map((id: Types.ObjectId) =>
        id.toString(),
      ),
      productType: product.productType,
      ...(product.comboItems && product.comboItems.length > 0
        ? {
            comboItems: product.comboItems.map((item) => ({
              productId: item.productId.toString(),
              quantity: item.quantity,
            })),
          }
        : {}),
      price: product.price,
      ...(typeof product.compareAtPrice === "number"
        ? { compareAtPrice: product.compareAtPrice }
        : {}),
      ...(product.taxCategory ? { taxCategory: product.taxCategory } : {}),
      imageUrls: product.imageUrls,
      thumbnailUrl: product.thumbnailUrl,
      stockStatus: product.stockStatus,
      isAvailable: product.isAvailable,
      ...(product.availableFrom ? { availableFrom: product.availableFrom } : {}),
      ...(product.availableUntil ? { availableUntil: product.availableUntil } : {}),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
      isRecommended: product.isRecommended,
      isSeasonal: product.isSeasonal,
      deliveryEligible: product.deliveryEligible,
      pickupEligible: product.pickupEligible,
      displayOrder: product.displayOrder,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      seoKeywords: product.seoKeywords,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return {
      query: safeSearchText,
      products: mappedProducts,
      matchedCategories,
      matchedOccasions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  private resolveSortOption(sort?: SearchSortOption): Record<string, 1 | -1> {
    switch (sort) {
      case "newest":
        return { createdAt: -1 };
      case "price_asc":
      case "price-asc":
        return { price: 1, _id: 1 };
      case "price_desc":
      case "price-desc":
        return { price: -1, _id: 1 };
      case "featured":
        return { isFeatured: -1, displayOrder: 1, createdAt: -1 };
      case "trending":
        return { isTrending: -1, displayOrder: 1, createdAt: -1 };
      case "recommended":
        return { isRecommended: -1, displayOrder: 1, createdAt: -1 };
      case "relevance":
      default:
        return { displayOrder: 1, createdAt: -1 };
    }
  }
}
