declare global {
  interface Window {
    configuration?: {
      widgetId: string;
      tokenAuth?: string;
      exposeMethods: boolean;
      success?: (data: unknown) => void;
      failure?: (error: unknown) => void;
      [key: string]: unknown;
    };
    initSendOTP?: (config: Record<string, unknown>) => void;
    sendOtp?: (
      identifier: string,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
    ) => void;
    retryOtp?: (
      channel?: string | number,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
      reqId?: string,
    ) => void;
    resendOtp?: (
      channel?: string | number,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
    ) => void;
    verifyOtp?: (
      otp: string,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
      reqId?: string,
    ) => void;
  }
}

export const MSG91_WIDGET_ID =
  import.meta.env.VITE_MSG91_WIDGET_ID || "366841727443373439393035";

export const MSG91_TOKEN_AUTH =
  import.meta.env.VITE_MSG91_TOKEN_AUTH || "564874Al3fU5np26a9bad56P1";

const SCRIPT_URL = "https://verify.msg91.com/otp-provider.js";
const SCRIPT_ID = "msg91-otp-provider-script";

let scriptLoadingPromise: Promise<void> | null = null;

const createDefaultConfig = () => ({
  widgetId: MSG91_WIDGET_ID,
  tokenAuth: MSG91_TOKEN_AUTH,
  exposeMethods: true,
  success: (_data: unknown) => {},
  failure: (_error: unknown) => {},
});

/**
 * Normalizes Indian mobile number to MSG91 required format:
 * 10 digits prefixed with 91 (e.g. 919999999999) without + sign.
 */
export const formatPhoneForMsg91 = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  return digits;
};

/**
 * Polls for MSG91 methods to be mounted onto window
 */
const waitForMsg91Methods = (timeoutMs = 8000): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (typeof window.sendOtp === "function") {
        resolve();
        return;
      }

      // If initSendOTP exists but sendOtp hasn't appeared yet, trigger initSendOTP
      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP(window.configuration || createDefaultConfig());
        } catch {
          // Ignore repeated calls
        }
      }

      if (Date.now() - startTime > timeoutMs) {
        if (typeof window.sendOtp === "function") {
          resolve();
        } else {
          reject(
            new Error(
              "MSG91 OTP service initialization timed out. Please refresh or try again.",
            ),
          );
        }
        return;
      }

      setTimeout(check, 60);
    };

    check();
  });
};

/**
 * Loads MSG91 script dynamically and configures Custom UI mode
 */
export const loadMsg91Script = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (typeof window.sendOtp === "function") {
    return Promise.resolve();
  }

  // Set global configuration object expected by MSG91 otp-provider.js
  window.configuration = createDefaultConfig();

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const onScriptReady = () => {
      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP(window.configuration || createDefaultConfig());
        } catch {
          // Ignore
        }
      }

      waitForMsg91Methods()
        .then(() => resolve())
        .catch((err) => {
          scriptLoadingPromise = null;
          reject(err);
        });
    };

    if (existingScript) {
      if (typeof window.sendOtp === "function") {
        resolve();
        return;
      }
      onScriptReady();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      onScriptReady();
    };

    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error("Failed to load MSG91 OTP widget script from CDN."));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Triggers MSG91 SMS OTP dispatch
 */
export const sendMsg91Otp = async (
  rawPhone: string,
): Promise<{ message?: string; reqId?: string }> => {
  await loadMsg91Script();

  const formattedIdentifier = formatPhoneForMsg91(rawPhone);

  return new Promise((resolve, reject) => {
    if (typeof window.sendOtp !== "function") {
      reject(new Error("MSG91 sendOtp function is not available."));
      return;
    }

    window.sendOtp(
      formattedIdentifier,
      (response: unknown) => {
        const res = response as Record<string, unknown> | string | undefined;
        if (typeof res === "object" && res !== null) {
          if (
            res.type === "error" ||
            res.message === "AuthenticationFailure" ||
            res.code === "401" ||
            res.code === 401 ||
            res.hasError === true
          ) {
            reject(new Error((res.message as string) || "AuthenticationFailure"));
            return;
          }
          resolve({
            message: (res.message as string) || "OTP sent successfully.",
            reqId: (res.reqId as string) || (res.requestId as string),
          });
        } else {
          if (typeof res === "string" && (res.includes("AuthenticationFailure") || res.includes("error"))) {
            reject(new Error(res));
            return;
          }
          resolve({ message: String(res || "OTP sent successfully.") });
        }
      },
      (error: unknown) => {
        const err = error as Record<string, unknown> | string | undefined;
        let errorMessage = "Failed to send OTP SMS.";
        if (typeof err === "object" && err !== null) {
          errorMessage = (err.message as string) || (err.error as string) || errorMessage;
        } else if (typeof err === "string" && err.trim()) {
          errorMessage = err;
        }
        reject(new Error(errorMessage));
      },
    );
  });
};

/**
 * Retries/resends MSG91 OTP
 */
export const retryMsg91Otp = async (
  channel: string | number = 11, // 11 is SMS channel in MSG91
  reqId?: string,
): Promise<{ message?: string }> => {
  await loadMsg91Script();

  return new Promise((resolve, reject) => {
    const retryFn = window.retryOtp || window.resendOtp;
    if (typeof retryFn !== "function") {
      reject(new Error("MSG91 retryOtp function is not available."));
      return;
    }

    retryFn(
      channel,
      (response: unknown) => {
        const res = response as Record<string, unknown> | string | undefined;
        if (typeof res === "object" && res !== null) {
          if (
            res.type === "error" ||
            res.message === "AuthenticationFailure" ||
            res.code === "401" ||
            res.code === 401 ||
            res.hasError === true
          ) {
            reject(new Error((res.message as string) || "Failed to resend OTP"));
            return;
          }
        }
        const msg = typeof res === "object" && res !== null ? (res.message as string) : String(res || "");
        resolve({ message: msg || "OTP resent successfully." });
      },
      (error: unknown) => {
        const err = error as Record<string, unknown> | string | undefined;
        let errorMessage = "Failed to resend OTP.";
        if (typeof err === "object" && err !== null) {
          errorMessage = (err.message as string) || (err.error as string) || errorMessage;
        } else if (typeof err === "string" && err.trim()) {
          errorMessage = err;
        }
        reject(new Error(errorMessage));
      },
      reqId,
    );
  });
};

/**
 * Verifies entered OTP with MSG91 and retrieves access token
 */
export const verifyMsg91Otp = async (
  otp: string,
  reqId?: string,
): Promise<{ accessToken: string }> => {
  await loadMsg91Script();

  return new Promise((resolve, reject) => {
    if (typeof window.verifyOtp !== "function") {
      reject(new Error("MSG91 verifyOtp function is not available."));
      return;
    }

    window.verifyOtp(
      otp.trim(),
      (response: unknown) => {
        let token: string | undefined;

        if (typeof response === "object" && response !== null) {
          const res = response as Record<string, unknown>;
          token =
            (res["access-token"] as string) ||
            (res.accessToken as string) ||
            (res.jwtToken as string) ||
            (res.token as string) ||
            (res.message as string);
        } else if (typeof response === "string" && response.trim()) {
          token = response.trim();
        }

        if (token) {
          resolve({ accessToken: token });
        } else {
          reject(new Error("Verification succeeded but no access token was returned by MSG91."));
        }
      },
      (error: unknown) => {
        const err = error as Record<string, unknown> | string | undefined;
        let errorMessage = "Invalid OTP verification code.";
        if (typeof err === "object" && err !== null) {
          errorMessage = (err.message as string) || (err.error as string) || errorMessage;
        } else if (typeof err === "string" && err.trim()) {
          errorMessage = err;
        }
        reject(new Error(errorMessage));
      },
      reqId,
    );
  });
};
