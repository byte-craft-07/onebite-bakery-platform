import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { createSlug } from "../../../shared/utils/slug.js";
import type { Occasion } from "../model/index.js";
import type { OccasionRepository } from "../repository/occasion.repository.js";

export class OccasionService {
  public constructor(private readonly occasionRepository: OccasionRepository) {}

  public async listPublicOccasions(): Promise<Occasion[]> {
    return this.occasionRepository.listActive();
  }

  public async getPublicOccasionBySlug(slug: string): Promise<Occasion> {
    const occasion = await this.occasionRepository.findActiveBySlug(slug);

    if (!occasion) {
      throw new AppError(
        "Occasion not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.OCCASION_NOT_FOUND,
      );
    }

    return occasion;
  }
}
