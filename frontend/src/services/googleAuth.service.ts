import { apiClient } from "./api.client";
import type { UserProfileResponse } from "./auth.service";

export interface GoogleAuthResponse {
  user: UserProfileResponse;
}

export const googleAuthService = {
  /**
   * Verify Google OAuth ID Token with backend API
   */
  async loginWithGoogleToken(idToken: string): Promise<GoogleAuthResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: { user: UserProfileResponse };
    }>("/auth/google", {
      credential: idToken,
    });

    const user = response.data.data.user;
    localStorage.setItem("theonlinebakery_user", JSON.stringify(user));

    return { user };
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
