import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { OccasionModel, type Occasion } from "../model/index.js";

export class OccasionRepository extends BaseRepository<Occasion> {
  public constructor() {
    super(OccasionModel);
  }

  public async findBySlug(slug: string): Promise<HydratedDocument<Occasion> | null> {
    return OccasionModel.findOne({ slug }).exec();
  }

  public async findActiveBySlug(
    slug: string,
  ): Promise<HydratedDocument<Occasion> | null> {
    return OccasionModel.findOne({ slug, isActive: true }).exec();
  }

  public async listActive(): Promise<Array<HydratedDocument<Occasion>>> {
    return OccasionModel.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  public async listAll(): Promise<Array<HydratedDocument<Occasion>>> {
    return OccasionModel.find()
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }
}
