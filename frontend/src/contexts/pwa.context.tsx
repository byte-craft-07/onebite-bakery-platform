import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { downloadAndroidApk, downloadWindowsInstaller, downloadWebShortcut } from "@/utils/appInstaller";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAContextValue {
  isOnline: boolean;
  wasOffline: boolean;
  isStandalone: boolean;
  isInstallable: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  showIosModal: boolean;
  setShowIosModal: (show: boolean) => void;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  showPushModal: boolean;
  setShowPushModal: (show: boolean) => void;
  promptInstall: () => Promise<boolean>;
  downloadApk: () => Promise<{ success: boolean; fileName: string }>;
  downloadDesktopInstaller: () => { success: boolean; fileName: string };
  downloadWebShortcut: () => { success: boolean; fileName: string };
  applyUpdate: () => void;
  dismissInstallBanner: () => void;
  isInstallBannerDismissed: boolean;
}

const PWAContext = createContext<PWAContextValue | null>(null);

const DISMISSED_INSTALL_KEY = "onebitebakery_pwa_install_dismissed";

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== "undefined" && (window as unknown as { __PWA_PROMPT__?: BeforeInstallPromptEvent }).__PWA_PROMPT__) {
      return (window as unknown as { __PWA_PROMPT__?: BeforeInstallPromptEvent }).__PWA_PROMPT__ || null;
    }
    return null;
  });
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showPushModal, setShowPushModal] = useState<boolean>(false);
  const [isInstallBannerDismissed, setIsInstallBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_INSTALL_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Detect iOS platform
  const isIos = typeof window !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  // Detect Android platform
  const isAndroid = typeof window !== "undefined" && /Android/i.test(navigator.userAgent);

  // 1. Detect Standalone Mode
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));

      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handler = () => checkStandalone();
    try {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } catch {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  // 2. Online / Offline listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Intercept `beforeinstallprompt` event
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if early capture in index.html already recorded an event
    if ((window as unknown as { __PWA_PROMPT__?: BeforeInstallPromptEvent }).__PWA_PROMPT__) {
      setDeferredPrompt((window as unknown as { __PWA_PROMPT__?: BeforeInstallPromptEvent }).__PWA_PROMPT__ || null);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default automatic mini-infobar so our button can invoke the real native prompt
      e.preventDefault();
      const promptEvt = e as BeforeInstallPromptEvent;
      (window as unknown as { __PWA_PROMPT__?: BeforeInstallPromptEvent }).__PWA_PROMPT__ = promptEvt;
      setDeferredPrompt(promptEvt);
    };

    const handlePromptReady = (e: Event) => {
      const customEvt = e as CustomEvent<BeforeInstallPromptEvent>;
      if (customEvt.detail) {
        setDeferredPrompt(customEvt.detail);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __PWA_PROMPT__?: null }).__PWA_PROMPT__ = null;
      console.log("[PWA] Onebite Bakery was successfully installed!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa_prompt_available", handlePromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa_prompt_available", handlePromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 4. Register Service Worker & Listen for Updates
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // If a service worker is already waiting, an update is ready
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setIsUpdateAvailable(true);
        }

        // Detect update finding
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("[PWA] Service Worker registration skipped or failed:", err);
      });

    // Listen for controller changes (when new worker takes over)
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  // 5. Prompt Install Trigger
  const promptInstall = useCallback(async (): Promise<boolean> => {
    // 1. If already running as standalone or marked installed
    if (isStandalone || isInstalled) {
      return true;
    }

    // 2. Fetch active native beforeinstallprompt event
    const activePrompt =
      deferredPrompt ||
      (typeof window !== "undefined"
        ? (window as unknown as { __PWA_PROMPT__?: BeforeInstallPromptEvent }).__PWA_PROMPT__
        : null);

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        setDeferredPrompt(null);
        if (typeof window !== "undefined") {
          (window as unknown as { __PWA_PROMPT__?: null }).__PWA_PROMPT__ = null;
        }
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          return true;
        }
        return false;
      } catch (err) {
        console.error("[PWA] Native install prompt failed:", err);
      }
    }

    return false;
  }, [deferredPrompt, isStandalone, isInstalled]);

  // 6. Apply waiting Service Worker update
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  // 7. Dismiss Install Banner
  const dismissInstallBanner = useCallback(() => {
    setIsInstallBannerDismissed(true);
    try {
      localStorage.setItem(DISMISSED_INSTALL_KEY, "true");
    } catch {
      // ignore storage errors
    }
  }, []);

  const isInstallable =
    !isStandalone &&
    !isInstalled &&
    (Boolean(deferredPrompt) ||
      (typeof window !== "undefined" && Boolean((window as unknown as { __PWA_PROMPT__?: unknown }).__PWA_PROMPT__)));

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        wasOffline,
        isStandalone,
        isInstallable,
        isIos,
        isAndroid,
        isInstalled,
        isUpdateAvailable,
        showIosModal: showInstallModal,
        setShowIosModal: setShowInstallModal,
        showInstallModal,
        setShowInstallModal,
        showPushModal,
        setShowPushModal,
        promptInstall,
        downloadApk: downloadAndroidApk,
        downloadDesktopInstaller: downloadWindowsInstaller,
        downloadWebShortcut: downloadWebShortcut,
        applyUpdate,
        dismissInstallBanner,
        isInstallBannerDismissed,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextValue => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
};
