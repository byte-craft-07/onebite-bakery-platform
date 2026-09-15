import { describe, expect, it, beforeEach } from "vitest";

import {
  getSoundSettings,
  playOrderNotificationSound,
  setNotificationsEnabled,
  setSoundEnabled,
  setSoundVolume,
} from "@/utils/sound.util";

describe("Sound & Notification Utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default sound settings when localStorage is empty", () => {
    const settings = getSoundSettings();
    expect(settings.soundEnabled).toBe(true);
    expect(settings.notificationsEnabled).toBe(true);
    expect(settings.volume).toBe(0.8);
  });

  it("updates sound enabled setting and persists in localStorage", () => {
    setSoundEnabled(false);
    expect(getSoundSettings().soundEnabled).toBe(false);

    setSoundEnabled(true);
    expect(getSoundSettings().soundEnabled).toBe(true);
  });

  it("updates notifications enabled setting and persists in localStorage", () => {
    setNotificationsEnabled(false);
    expect(getSoundSettings().notificationsEnabled).toBe(false);

    setNotificationsEnabled(true);
    expect(getSoundSettings().notificationsEnabled).toBe(true);
  });

  it("clamps sound volume between 0 and 1", () => {
    setSoundVolume(1.5);
    expect(getSoundSettings().volume).toBe(1);

    setSoundVolume(-0.5);
    expect(getSoundSettings().volume).toBe(0);

    setSoundVolume(0.5);
    expect(getSoundSettings().volume).toBe(0.5);
  });

  it("safely handles audio playback when sound is disabled", async () => {
    setSoundEnabled(false);
    const played = await playOrderNotificationSound();
    expect(played).toBe(false);
  });

  it("gracefully catches and handles missing audio context without throwing", async () => {
    setSoundEnabled(true);
    // In test environment without full Web Audio API audio rendering, it should return false or handle cleanly without throwing
    const played = await playOrderNotificationSound();
    expect(typeof played).toBe("boolean");
  });
});
