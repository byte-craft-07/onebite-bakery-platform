import { bannerRepository, type BannerRepository } from "../repository/banner.repository.js";
import type { Banner } from "../model/banner.model.js";

export class BannerService {
  constructor(private readonly repo: BannerRepository = bannerRepository) {}

  async getActiveBanners(placement: string = "home_hero"): Promise<Banner[]> {
    return this.repo.findActiveBanners(placement);
  }

  async getAllBanners(): Promise<Banner[]> {
    return this.repo.findAllBanners();
  }

  async getBannerById(id: string): Promise<Banner | null> {
    return this.repo.findBannerById(id);
  }

  async createBanner(data: Partial<Banner>): Promise<Banner> {
    if (!data.title || !data.desktopImage) {
      throw new Error("Title and Desktop Image are required.");
    }
    return this.repo.createBanner(data);
  }

  async updateBanner(id: string, data: Partial<Banner>): Promise<Banner | null> {
    return this.repo.updateBanner(id, data);
  }

  async deleteBanner(id: string): Promise<boolean> {
    return this.repo.deleteBanner(id);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<Banner | null> {
    return this.repo.toggleStatus(id, isActive);
  }

  async reorderBanners(orderedIds: string[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id) {
        await this.repo.updateBanner(id, { displayOrder: i });
      }
    }
    return true;
  }
}

export const bannerService = new BannerService();
