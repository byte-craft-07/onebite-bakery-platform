import { toObjectId } from "../../../db/utils/object-id.js";
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

  public async listAdminOccasions(): Promise<Occasion[]> {
    return this.occasionRepository.listAll();
  }

  public async createOccasion(payload: Partial<Occasion>): Promise<Occasion> {
    const slug = payload.slug || createSlug(payload.name || "occasion");
    const existing = await this.occasionRepository.findBySlug(slug);
    if (existing) {
      throw new AppError("Occasion with this slug already exists.", HTTP_STATUS.CONFLICT);
    }
    const defaultImg = payload.bannerImage || "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80";
    const defaultDesc = payload.description || `${payload.name} celebration cakes and desserts`;
    return this.occasionRepository.create({
      ...payload,
      slug,
      description: defaultDesc,
      bannerImage: defaultImg,
      seoTitle: payload.seoTitle || payload.name,
      seoDescription: payload.seoDescription || defaultDesc,
    } as unknown as Occasion);
  }

  public async updateOccasion(id: string, payload: Partial<Occasion>): Promise<Occasion> {
    const objId = toObjectId(id);
    const occasion = await this.occasionRepository.findById(objId);
    if (!occasion) {
      throw new AppError("Occasion not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (payload.slug && payload.slug !== occasion.slug) {
      const existing = await this.occasionRepository.findBySlug(payload.slug);
      if (existing) {
        throw new AppError("Occasion with this slug already exists.", HTTP_STATUS.CONFLICT);
      }
    }
    const updated = await this.occasionRepository.update(objId, payload);
    if (!updated) {
      throw new AppError("Failed to update occasion.", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  public async softDeleteOccasion(id: string): Promise<Occasion> {
    const objId = toObjectId(id);
    const deleted = await this.occasionRepository.softDelete(objId);
    if (!deleted) {
      throw new AppError("Occasion not found.", HTTP_STATUS.NOT_FOUND);
    }
    return deleted;
  }
}
