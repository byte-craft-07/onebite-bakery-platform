import type {
  FilterQuery,
  HydratedDocument,
  Types,
  UpdateQuery,
} from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { CategoryModel } from "../../category/index.js";
import { OccasionModel } from "../../occasion/index.js";
import { ProductModel, type Product } from "../model/index.js";
import type {
  PaginatedResult,
  ProductSortOption,
  PublicProductQueryDto,
} from "../types/query.types.js";

export class ProductRepository extends BaseRepository<Product> {
  public constructor() {
    super(ProductModel);
  }

  public async findBySlug(
    slug: string,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOne({ slug }).exec();
  }

  public async findActiveBySlug(
    slugOrId: string,
  ): Promise<Product | null> {
    const isObjectId = /^[a-f\d]{24}$/i.test(slugOrId);
    const filter: FilterQuery<Product> = isObjectId
      ? {
          $or: [{ slug: slugOrId }, { _id: slugOrId }],
          isActive: true,
          isDeleted: false,
        }
      : {
          slug: slugOrId,
          isActive: true,
          isDeleted: false,
        };

    return ProductModel.findOne(filter)
      .select("-costPrice -deletedAt -deletedBy -__v")
      .lean<Product>()
      .exec();
  }

  public async findPublicCatalog(
    query: PublicProductQueryDto,
    filterOverrides: FilterQuery<Product> = {},
  ): Promise<PaginatedResult<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Product> = {
      isActive: true,
      isDeleted: false,
      ...filterOverrides,
    };

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

    const searchQuery = (query as Record<string, unknown>).q || (query as Record<string, unknown>).search;
    if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
      const qClean = searchQuery.trim();
      filter.$or = [
        { name: { $regex: qClean, $options: "i" } },
        { description: { $regex: qClean, $options: "i" } },
        { slug: { $regex: qClean, $options: "i" } },
      ];
    }

    const sortOption = this.resolveSortOption(query.sort);

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .select("-costPrice -deletedAt -deletedBy -__v")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean<Product[]>()
        .exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  public async findPublicList(): Promise<Array<HydratedDocument<Product>>> {
    return ProductModel.find({ isActive: true, isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  public async findAdminList(): Promise<Array<HydratedDocument<Product>>> {
    return ProductModel.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async findByIdIncludingDeleted(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findById(id).exec();
  }

  public async updateById(
    id: Types.ObjectId,
    update: UpdateQuery<Product>,
  ): Promise<HydratedDocument<Product> | null> {
    return this.update({ _id: id }, update);
  }

  public async categoryExists(categoryId: Types.ObjectId): Promise<boolean> {
    const category = await CategoryModel.exists({
      _id: categoryId,
      isDeleted: false,
    }).exec();

    return Boolean(category);
  }

  public async findCategoryBySlugOrId(identifier: string) {
    if (/^[a-f\d]{24}$/i.test(identifier)) {
      return CategoryModel.findOne({
        _id: identifier,
        isActive: true,
        isDeleted: false,
      })
        .select("_id name slug")
        .lean()
        .exec();
    }

    return CategoryModel.findOne({
      slug: identifier,
      isActive: true,
      isDeleted: false,
    })
      .select("_id name slug")
      .lean()
      .exec();
  }

  public async findOccasionBySlugOrId(identifier: string) {
    if (/^[a-f\d]{24}$/i.test(identifier)) {
      return OccasionModel.findOne({
        _id: identifier,
        isActive: true,
      })
        .select("_id name slug")
        .lean()
        .exec();
    }

    return OccasionModel.findOne({
      slug: identifier,
      isActive: true,
    })
      .select("_id name slug")
      .lean()
      .exec();
  }

  public async findMissingOccasionIds(
    occasionIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (occasionIds.length === 0) {
      return [];
    }

    const occasions = await OccasionModel.find({
      _id: { $in: occasionIds },
    })
      .select("_id")
      .exec();
    const foundIds = new Set(occasions.map((occasion) => occasion._id.toString()));

    return occasionIds.filter((occasionId) => !foundIds.has(occasionId.toString()));
  }

  public async findExistingProduct(
    filter: FilterQuery<Product>,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOne(filter).exec();
  }

  public async findMissingProductIds(
    productIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (productIds.length === 0) {
      return [];
    }

    const products = await ProductModel.find({
      _id: { $in: productIds },
      isDeleted: false,
    })
      .select("_id")
      .exec();
    const foundIds = new Set(products.map((product) => product._id.toString()));

    return productIds.filter((productId) => !foundIds.has(productId.toString()));
  }

  private resolveSortOption(sort?: ProductSortOption): Record<string, 1 | -1> {
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
      case "display_order":
      case "displayOrder":
      default:
        return { displayOrder: 1, createdAt: -1 };
    }
  }
}
