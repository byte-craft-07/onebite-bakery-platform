import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { ENV } from "@/config/env.config";

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const GUEST_SESSION_KEY = "theonlinebakery_guest_session_id";

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
      const activeRaw = localStorage.getItem("theonlinebakery_active_location") || localStorage.getItem("theonlinebakery_current_location");
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
    "/auth/send-otp",
    "/auth/verify-otp",
    "/auth/refresh",
    "/auth/logout",
    "/auth/logout-all",
  ].some((authPath) => url.includes(authPath));
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

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

    return Promise.reject(error);
  },
);
