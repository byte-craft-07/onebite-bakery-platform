import type { FilterQuery, HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { ListMediaFilterDto } from "../dto/index.js";
import { MediaModel, type Media } from "../model/index.js";

export class MediaRepository extends BaseRepository<Media> {
  public constructor() {
    super(MediaModel);
  }

  public async findByFileName(
    fileName: string,
  ): Promise<HydratedDocument<Media> | null> {
    return MediaModel.findOne({ fileName, isDeleted: false }).exec();
  }

  public async findActiveById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Media> | null> {
    return MediaModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  public async findPaginatedMedia(
    query: ListMediaFilterDto,
  ): Promise<{
    items: Array<HydratedDocument<Media>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Media> = { isDeleted: false };

    if (query.mimeType) {
      filter.mimeType = query.mimeType;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    const [items, total] = await Promise.all([
      MediaModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      MediaModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
