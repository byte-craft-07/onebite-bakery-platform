import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ToastType = "add" | "update" | "delete" | "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  image?: string;
  action?: ToastAction;
}

export interface ToastOptions {
  duration?: number;
  image?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, title: string, message?: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const GLOBAL_TOAST_EVENT = "onebitebakery_show_toast";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, options?: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration: options?.duration ?? (type === "error" ? 4500 : 3500),
        image: options?.image,
        action: options?.action,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 concurrent toasts
      return id;
    },
    [],
  );

  useEffect(() => {
    const handleGlobalToast = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: ToastType;
        title: string;
        message?: string;
        options?: ToastOptions;
      }>;
      if (customEvent.detail) {
        const { type, title, message, options } = customEvent.detail;
        addToast(type, title, message, options);
      }
    };

    window.addEventListener(GLOBAL_TOAST_EVENT, handleGlobalToast);
    return () => {
      window.removeEventListener(GLOBAL_TOAST_EVENT, handleGlobalToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Global standalone helper functions so any service or callback can trigger notifications directly!
export const toast = {
  add: (title: string, message?: string, options?: ToastOptions) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_TOAST_EVENT, {
          detail: { type: "add", title, message, options },
        }),
      );
    }
  },
  update: (title: string, message?: string, options?: ToastOptions) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_TOAST_EVENT, {
          detail: { type: "update", title, message, options },
        }),
      );
    }
  },
  delete: (title: string, message?: string, options?: ToastOptions) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_TOAST_EVENT, {
          detail: { type: "delete", title, message, options },
        }),
      );
    }
  },
  success: (title: string, message?: string, options?: ToastOptions) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_TOAST_EVENT, {
          detail: { type: "success", title, message, options },
        }),
      );
    }
  },
  error: (title: string, message?: string, options?: ToastOptions) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_TOAST_EVENT, {
          detail: { type: "error", title, message, options },
        }),
      );
    }
  },
  info: (title: string, message?: string, options?: ToastOptions) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_TOAST_EVENT, {
          detail: { type: "info", title, message, options },
        }),
      );
    }
  },
};
