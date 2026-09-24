import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PWAProvider, usePWA } from "@/contexts/pwa.context";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { IosInstallModal } from "@/components/pwa/IosInstallModal";
import { PwaUpdateToast } from "@/components/pwa/PwaUpdateToast";
import { PushNotificationModal } from "@/components/pwa/PushNotificationModal";

const TestPwaConsumer: React.FC = () => {
  const { isOnline, isStandalone, isInstalled, setShowIosModal, setShowPushModal } = usePWA();
  return (
    <div>
      <span data-testid="online-status">{isOnline ? "online" : "offline"}</span>
      <span data-testid="standalone-status">{isStandalone ? "standalone" : "browser"}</span>
      <span data-testid="installed-status">{isInstalled ? "installed" : "not-installed"}</span>
      <button data-testid="btn-ios" onClick={() => setShowIosModal(true)}>Open iOS</button>
      <button data-testid="btn-push" onClick={() => setShowPushModal(true)}>Open Push</button>
    </div>
  );
};

describe("PWA Context and Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PWAProvider and provides initial state", () => {
    render(
      <PWAProvider>
        <TestPwaConsumer />
      </PWAProvider>
    );

    expect(screen.getByTestId("online-status").textContent).toBe("online");
    expect(screen.getByTestId("standalone-status").textContent).toBe("browser");
    expect(screen.getByTestId("installed-status").textContent).toBe("not-installed");
  });

  it("shows offline banner when offline event fires", () => {
    render(
      <PWAProvider>
        <OfflineBanner />
      </PWAProvider>
    );

    // Trigger offline window event
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText(/You are offline/i)).toBeInTheDocument();

    // Trigger online window event
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.getByText(/You're back online/i)).toBeInTheDocument();
  });

  it("opens and closes Push notification opt-in modal", () => {
    render(
      <PWAProvider>
        <TestPwaConsumer />
        <PushNotificationModal />
      </PWAProvider>
    );

    expect(screen.queryByText(/Get Real-Time Order Updates/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("btn-push"));
    expect(screen.getByText(/Get Real-Time Order Updates/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Not Now/i));
    expect(screen.queryByText(/Get Real-Time Order Updates/i)).not.toBeInTheDocument();
  });

  it("triggers native prompt.prompt() directly when beforeinstallprompt event is captured", async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: promptMock,
      userChoice: mockChoice,
      platforms: ["web"],
    };

    const TestPromptButton: React.FC = () => {
      const { promptInstall } = usePWA();
      return <button data-testid="btn-prompt-install" onClick={() => promptInstall()}>Install App Button</button>;
    };

    (window as unknown as { __PWA_PROMPT__?: unknown }).__PWA_PROMPT__ = mockPromptEvent;

    render(
      <PWAProvider>
        <TestPromptButton />
        <IosInstallModal />
      </PWAProvider>
    );

    // Click install app button
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-prompt-install"));
    });

    // Native prompt should be triggered directly
    expect(promptMock).toHaveBeenCalledTimes(1);

    // Clean up
    delete (window as unknown as { __PWA_PROMPT__?: unknown }).__PWA_PROMPT__;
  });

  it("does not render any instructions modal when promptInstall is called", async () => {
    delete (window as unknown as { __PWA_PROMPT__?: unknown }).__PWA_PROMPT__;

    const TestPromptButton: React.FC = () => {
      const { promptInstall } = usePWA();
      return <button data-testid="btn-prompt-install" onClick={() => promptInstall()}>Install App Button</button>;
    };

    render(
      <PWAProvider>
        <TestPromptButton />
        <IosInstallModal />
      </PWAProvider>
    );

    // Click install app button without native prompt
    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-prompt-install"));
    });

    // Modal should NOT be opened
    expect(screen.queryByText(/Install on iPhone \/ iPad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Install on Android/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Install app on your/i)).not.toBeInTheDocument();
  });

  it("opens InstallAppModal and allows adding mobile shortcut and downloading desktop shortcut", async () => {
    const { InstallAppModal } = await import("@/components/pwa/InstallAppModal");

    const TestInstallerOpener: React.FC = () => {
      const { setShowInstallModal } = usePWA();
      return <button data-testid="btn-open-install-modal" onClick={() => setShowInstallModal(true)}>Open Install Modal</button>;
    };

    render(
      <PWAProvider>
        <TestInstallerOpener />
        <InstallAppModal />
      </PWAProvider>
    );

    expect(screen.queryByText(/Add App Shortcut/i)).not.toBeInTheDocument();

    // Open modal
    fireEvent.click(screen.getByTestId("btn-open-install-modal"));
    expect(screen.getByText(/Add App Shortcut/i)).toBeInTheDocument();
    expect(screen.getByText(/Add to Phone Home Screen/i)).toBeInTheDocument();
    expect(screen.getByText(/Download Desktop Shortcut/i)).toBeInTheDocument();

    // Trigger Desktop shortcut download
    fireEvent.click(screen.getByText(/Download Desktop Shortcut/i));
    expect(screen.getByText(/Shortcut Downloaded!/i)).toBeInTheDocument();

    // Trigger Phone shortcut
    await act(async () => {
      fireEvent.click(screen.getByText(/Add to Phone Home Screen/i));
    });

    // Close modal
    fireEvent.click(screen.getByText(/Close/i));
    expect(screen.queryByText(/Add App Shortcut/i)).not.toBeInTheDocument();
  });
});
