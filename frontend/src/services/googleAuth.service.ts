import { apiClient } from "./api.client";
import type { UserProfileResponse } from "./auth.service";

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
    const response = await apiClient.post<{
      success: boolean;
      data: {
        user: UserProfileResponse;
        tokens?: { accessToken?: string; refreshToken?: string };
      };
    }>("/auth/google", {
      credential: idToken,
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
    });

    const { user, tokens } = response.data.data;
    if (tokens?.accessToken) {
      localStorage.setItem("onebitebakery_token", tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      localStorage.setItem("onebitebakery_refresh_token", tokens.refreshToken);
    }
    localStorage.setItem("onebitebakery_user", JSON.stringify(user));

    return { user };
  },

  /**
   * Redirect to Backend Google OAuth initiation URL
   */
  redirectToGoogleOAuth(): void {
    const backendBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "/api/v1";
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    const redirectParam =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("onebitebakery_auth_redirect") || ""
        : "";

    const url = new URL(`${backendBaseUrl}/auth/google`);
    if (currentOrigin) {
      url.searchParams.set("origin", currentOrigin);
    }
    if (redirectParam) {
      url.searchParams.set("redirect", redirectParam);
    }
    window.location.href = url.toString();
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
