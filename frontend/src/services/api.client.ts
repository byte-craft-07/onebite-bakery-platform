import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { ENV } from "@/config/env.config";
import { toast } from "@/contexts/toast.context";

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const GUEST_SESSION_KEY = "onebitebakery_guest_session_id";

export const getOrCreateGuestSessionId = (): string => {
  try {
    let sid = localStorage.getItem(GUEST_SESSION_KEY);
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_SESSION_KEY, sid);
    }
    return sid;
  } catch (_err) {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    config.headers.set("x-request-id", requestId);
    config.headers.set("x-session-id", getOrCreateGuestSessionId());

    try {
      const activeRaw = localStorage.getItem("onebitebakery_active_location") || localStorage.getItem("onebitebakery_current_location");
      if (activeRaw) {
        const loc = JSON.parse(activeRaw);
        if (loc?.villageId) config.headers.set("x-village-id", loc.villageId);
        if (loc?.district) config.headers.set("x-district-name", loc.district);
        if (loc?.villageName) config.headers.set("x-village-name", loc.villageName);
      }
    } catch (_err) {
      // Ignore
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const isAuthLifecycleRequest = (url?: string): boolean => {
  if (!url) return false;
  return [
    "/auth/refresh",
    "/auth/logout",
    "/auth/logout-all",
  ].some((authPath) => url.includes(authPath));
};

/**
 * Track whether we've already shown a global toast for a particular status code
 * within a short window, to avoid spamming the user with duplicate notifications.
 */
const recentGlobalToasts = new Map<number, number>();
const TOAST_DEBOUNCE_MS = 3000;

const shouldShowGlobalToast = (status: number): boolean => {
  const now = Date.now();
  const lastShown = recentGlobalToasts.get(status);
  if (lastShown && now - lastShown < TOAST_DEBOUNCE_MS) {
    return false;
  }
  recentGlobalToasts.set(status, now);
  return true;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── 401 Unauthorized: Attempt silent token refresh ──
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthLifecycleRequest(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 Forbidden: Notify about missing permissions ──
    if (error.response?.status === 403 && shouldShowGlobalToast(403)) {
      toast.error(
        "Access Denied",
        "You don't have permission to perform this action.",
      );
    }

    // ── 429 Rate Limited: Ask user to slow down ──
    if (error.response?.status === 429 && shouldShowGlobalToast(429)) {
      toast.info(
        "Too Many Requests",
        "Please wait a moment before trying again.",
      );
    }

    // ── 500+ Server Errors: Notify about server issues ──
    if (
      error.response &&
      error.response.status >= 500 &&
      shouldShowGlobalToast(error.response.status)
    ) {
      toast.error(
        "Server Error",
        "Something went wrong on our end. Please try again later.",
      );
    }

    // ── Network / Timeout Errors (no response at all) ──
    if (!error.response && shouldShowGlobalToast(0)) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error(
          "Request Timeout",
          "The server is taking too long. Please try again.",
        );
      } else if (!navigator.onLine) {
        toast.info(
          "You're Offline",
          "Please check your internet connection.",
        );
      } else {
        toast.error(
          "Connection Error",
          "Unable to reach the server. Please try again later.",
        );
      }
    }

    return Promise.reject(error);
  },
);
