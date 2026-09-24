const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    if (!isLocalhost && envUrl && envUrl.includes("localhost")) {
      return "/api/v1";
    }
  }
  return envUrl || "/api/v1";
};

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  APP_NAME: "Onebite Bakery",
  IS_DEV: import.meta.env.DEV,
} as const;

