import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { MediaEntityType } from "../constants/index.js";
import { MediaModel, type Media } from "../model/index.js";

export class MediaRepository extends BaseRepository<Media> {
  public constructor() {
    super(MediaModel);
  }

  public async findByEntity(
    entityType: MediaEntityType,
    entityId?: string,
  ): Promise<Array<HydratedDocument<Media>>> {
    const filter: Record<string, unknown> = { entityType };
    if (entityId) filter.entityId = entityId;

    return MediaModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  public async deleteMedia(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Media> | null> {
    return MediaModel.findByIdAndDelete(id).exec();
  }
}
