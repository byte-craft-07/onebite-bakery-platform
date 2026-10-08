import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

import { CustomCakeService } from "./custom-cake.service.js";
import { CustomCakeInquiryModel } from "../model/custom-cake-inquiry.model.js";
import type { CustomCakeRepository } from "../repository/custom-cake.repository.js";
import type { CustomCakeInquiry } from "../model/custom-cake-inquiry.model.js";

describe("CustomCake Module & Service", () => {
  it("schema must reference 'User' and 'Product' models by name, not collection names", () => {
    const userIdRef = (CustomCakeInquiryModel.schema.path("userId") as any)?.options?.ref;
    const prodIdRef = (
      CustomCakeInquiryModel.schema.path("adminRecommendation.recommendedProductId") as any
    )?.options?.ref;

    expect(userIdRef).toBe("User");
    expect(prodIdRef).toBe("Product");
  });

  it("creates inquiry with valid sanitized fields", async () => {
    const mockRepo: Partial<CustomCakeRepository> = {
      createInquiry: vi.fn().mockImplementation((data: any) => Promise.resolve({ ...data, _id: new Types.ObjectId() })),
    };
    const service = new CustomCakeService(mockRepo as CustomCakeRepository);

    const result = await service.createInquiry({
      customerName: "Pooja Sharma",
      customerPhone: "9876543210",
      queryText: "Need a 3-tier wedding cake",
      userId: "invalid-user-id" as any,
      eventDate: "not-a-date" as any,
    });

    expect(mockRepo.createInquiry).toHaveBeenCalled();
    const calledWith = (mockRepo.createInquiry as any).mock.calls[0][0];
    expect(calledWith.inquiryNumber).toMatch(/^CC-\d{4}-\d+[A-Z0-9]+$/);
    expect(calledWith.status).toBe("PENDING");
    expect(calledWith.userId).toBeUndefined();
    expect(calledWith.eventDate).toBeUndefined();
  });

  it("retrieves inquiries via repository", async () => {
    const sampleInquiries: Partial<CustomCakeInquiry>[] = [
      {
        inquiryNumber: "CC-2026-1001",
        customerName: "Ajay Kumar",
        customerPhone: "9876543210",
        queryText: "Vanilla berry cake",
        status: "PENDING",
      },
    ];

    const mockRepo: Partial<CustomCakeRepository> = {
      findAllInquiries: vi.fn().mockResolvedValue(sampleInquiries),
    };
    const service = new CustomCakeService(mockRepo as CustomCakeRepository);

    const res = await service.getInquiries({ status: "PENDING" });
    expect(mockRepo.findAllInquiries).toHaveBeenCalledWith({ status: "PENDING" });
    expect(res).toHaveLength(1);
    expect(res[0]!.inquiryNumber).toBe("CC-2026-1001");
  });

  it("updates inquiry recommendation correctly", async () => {
    const prodId = new Types.ObjectId();
    const mockRepo: Partial<CustomCakeRepository> = {
      updateInquiry: vi.fn().mockImplementation((_id: string, update: any) =>
        Promise.resolve({ _id, ...update }),
      ),
    };
    const service = new CustomCakeService(mockRepo as CustomCakeRepository);

    const inqId = new Types.ObjectId().toString();
    await service.updateInquiry(inqId, {
      status: "QUOTED",
      adminNotes: "Special rush order",
      adminRecommendation: {
        recommendedProductId: prodId.toString(),
        recommendedCakeTitle: "Belgian Chocolate 3-Tier",
        quotedPrice: 3500,
        message: "We can prepare this with artisanal finishing.",
      },
    });

    expect(mockRepo.updateInquiry).toHaveBeenCalled();
    const updateArgs = (mockRepo.updateInquiry as any).mock.calls[0][1];
    expect(updateArgs.status).toBe("QUOTED");
    expect(updateArgs.adminNotes).toBe("Special rush order");
    expect(updateArgs.adminRecommendation.quotedPrice).toBe(3500);
    expect(updateArgs.adminRecommendation.recommendedProductId.toString()).toBe(prodId.toString());
  });
});
