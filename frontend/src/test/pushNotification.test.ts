import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  PushNotificationService,
  urlBase64ToUint8Array,
} from "@/services/pushNotification.service";
import { apiClient } from "@/services/api.client";

describe("PushNotificationService & utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("urlBase64ToUint8Array converts URL safe base64 to Uint8Array correctly", () => {
    // Standard test vector
    const base64UrlString = "BMockPublicKeyForTest-1234_abcd";
    const uint8Array = urlBase64ToUint8Array(base64UrlString);
    expect(uint8Array).toBeInstanceOf(Uint8Array);
    expect(uint8Array.length).toBeGreaterThan(0);
  });

  it("isSupported returns false when PushManager or ServiceWorker is absent", () => {
    const originalServiceWorker = (navigator as any).serviceWorker;
    delete (navigator as any).serviceWorker;

    expect(PushNotificationService.isSupported()).toBe(false);

    (navigator as any).serviceWorker = originalServiceWorker;
  });

  it("getVapidPublicKey calls backend endpoint and returns key", async () => {
    const mockKey = "BMockPublicKeyReturnedFromServer123456";
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: { success: true, data: { publicKey: mockKey } },
    });

    const result = await PushNotificationService.getVapidPublicKey();
    expect(result).toBe(mockKey);
    expect(apiClient.get).toHaveBeenCalledWith("/notifications/vapid-public-key");
  });

  it("sendTestPush calls backend test-push endpoint", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: { success: true, message: "Test push sent" },
    });

    const result = await PushNotificationService.sendTestPush();
    expect(result.success).toBe(true);
    expect(result.message).toBe("Test push sent");
    expect(apiClient.post).toHaveBeenCalledWith("/notifications/test-push");
  });
});
