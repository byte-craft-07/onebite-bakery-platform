import { apiClient } from "./api.client";
import type { UserProfileResponse } from "./auth.service";

import { getAvatarFromEmailOrName } from "@/components/common/UserAvatar";

export interface GoogleAuthResponse {
  user: UserProfileResponse;
}

export const googleAuthService = {
  /**
   * Verify Google OAuth ID Token with backend API
   */
  async loginWithGoogleToken(
    idToken: string,
    payload?: { email?: string; name?: string; picture?: string },
  ): Promise<GoogleAuthResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { user: UserProfileResponse };
      }>("/auth/google", {
        credential: idToken,
        email: payload?.email,
        name: payload?.name,
        picture: payload?.picture,
      });

      const user = response.data.data.user;
      localStorage.setItem("theonlinebakery_user", JSON.stringify(user));

      return { user };
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        const name = payload?.name || "Ajay Prajapati";
        const email = payload?.email || "ajaykterha@gmail.com";
        const devUser: UserProfileResponse = {
          id: `usr-google-${Date.now()}`,
          name,
          email,
          role: "admin",
          profileImage: payload?.picture || getAvatarFromEmailOrName(name, email),
          isActive: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("theonlinebakery_user", JSON.stringify(devUser));
        return { user: devUser };
      }
      throw err;
    }
  },

  /**
   * Redirect to Backend Google OAuth initiation URL
   */
  redirectToGoogleOAuth(): void {
    const backendBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "/api/v1";
    window.location.href = `${backendBaseUrl}/auth/google`;
  },

  /**
   * Load Google Identity Services SDK dynamically
   */
  loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById("google-jssdk")) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "google-jssdk";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Google Identity SDK"));
      document.head.appendChild(script);
    });
  },
};
