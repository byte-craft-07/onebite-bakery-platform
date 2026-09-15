import { apiClient } from "@/services/api.client";

export type PushPermissionStatus = "granted" | "denied" | "default" | "unsupported";

export interface PushSubscriptionResult {
  success: boolean;
  message?: string;
  error?: string;
  subscription?: PushSubscription;
}

/**
 * Utility to convert URL-safe base64 string to Uint8Array for VAPID applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  /**
   * Checks whether the current browser supports Service Workers, Push API, and Notifications
   */
  public static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /**
   * Gets current Notification permission state
   */
  public static getPermissionState(): PushPermissionStatus {
    if (!this.isSupported()) {
      return "unsupported";
    }
    return Notification.permission;
  }

  /**
   * Registers the background service worker if not already registered
   */
  public static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error("[WebPush] Failed to register service worker:", error);
      return null;
    }
  }

  /**
   * Fetches backend VAPID public key
   */
  public static async getVapidPublicKey(): Promise<string> {
    const response = await apiClient.get<{ success: boolean; data: { publicKey: string } }>(
      "/notifications/vapid-public-key",
    );
    if (!response.data?.data?.publicKey) {
      throw new Error("VAPID public key not found in server response.");
    }
    return response.data.data.publicKey;
  }

  /**
   * Gets current active PushSubscription from the service worker
   */
  public static async getActiveSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error("[WebPush] Error getting current subscription:", error);
      return null;
    }
  }

  /**
   * Subscribes the current browser to Web Push notifications and registers with backend
   */
  public static async subscribe(): Promise<PushSubscriptionResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: "Web Push notifications are not supported in this browser.",
      };
    }

    try {
      // 1. Request permission if needed
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        return {
          success: false,
          error: "Notification permission was denied or dismissed.",
        };
      }

      // 2. Fetch server public key
      const vapidPublicKey = await this.getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // 3. Register service worker and subscribe
      let registration = await this.registerServiceWorker();
      if (!registration) {
        registration = await navigator.serviceWorker.ready;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });
      }

      const subscriptionJson = subscription.toJSON();
      if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
        throw new Error("Failed to serialize push subscription keys.");
      }

      // 4. Send subscription to backend
      await apiClient.post("/notifications/push-subscriptions", {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
        userAgent: navigator.userAgent,
        deviceInfo: {
          platform: navigator.platform,
          language: navigator.language,
          vendor: navigator.vendor,
        },
      });

      return {
        success: true,
        message: "Successfully subscribed to Web Push notifications.",
        subscription,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Subscription failed";
      console.error("[WebPush] Subscription error:", error);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Unsubscribes current device from Web Push and deactivates subscription on backend
   */
  public static async unsubscribe(): Promise<PushSubscriptionResult> {
    if (!this.isSupported()) {
      return { success: false, error: "Web Push is not supported." };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        // Unsubscribe locally
        await subscription.unsubscribe();

        // Inform backend
        try {
          await apiClient.delete("/notifications/push-subscriptions", {
            data: { endpoint },
          });
        } catch (apiError) {
          console.warn("[WebPush] Backend deactivation warning:", apiError);
        }
      }

      return {
        success: true,
        message: "Successfully unsubscribed from Web Push notifications.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unsubscribe failed";
      console.error("[WebPush] Unsubscribe error:", error);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Triggers a test push notification from backend
   */
  public static async sendTestPush(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string; data?: unknown }>(
      "/notifications/test-push",
    );
    return {
      success: response.data.success,
      message: response.data.message || "Test push dispatched.",
    };
  }

  /**
   * Automatically synchronizes browser subscription with backend if notification permission is already granted
   */
  public static async autoSyncSubscriptionIfGranted(): Promise<void> {
    if (!this.isSupported()) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    try {
      await this.subscribe();
    } catch (err) {
      console.debug("[WebPush] Auto-sync skipped or non-fatal error:", err);
    }
  }
}
