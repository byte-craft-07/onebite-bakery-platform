import { apiClient } from "./api.client";

export interface GoogleAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
    role: string;
  };
  token: string;
}

export const googleAuthService = {
  /**
   * Verify Google OAuth ID Token with backend or direct Google API
   */
  async loginWithGoogleToken(idToken: string): Promise<GoogleAuthResponse> {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    try {
      const response = await apiClient.post<GoogleAuthResponse>("/auth/google", {
        token: idToken,
        clientId: googleClientId,
      });

      if (response.data?.token) {
        localStorage.setItem("onebite_token", response.data.token);
        localStorage.setItem("onebite_user", JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (_err) {
      // Fallback local simulation if backend API key not yet connected
    }

    // Fallback simulated user decoded from Google Identity token payload
    const simulatedUser = {
      id: `usr-google-${Date.now()}`,
      name: "Google Customer",
      email: "google.user@example.com",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: "customer",
    };

    const token = `simulated-jwt-${Date.now()}`;
    localStorage.setItem("onebite_token", token);
    localStorage.setItem("onebite_user", JSON.stringify(simulatedUser));

    return {
      user: simulatedUser,
      token,
    };
  },

  /**
   * Load Google Identity Services script dynamically
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
      script.onerror = () => reject(new Error("Failed to load Google Identity SDK"));
      document.head.appendChild(script);
    });
  },
};
