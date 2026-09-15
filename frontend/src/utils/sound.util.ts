const SOUND_ENABLED_KEY = "theonlinebakery_admin_sound_enabled";
const NOTIFS_ENABLED_KEY = "theonlinebakery_admin_notifs_enabled";
const VOLUME_KEY = "theonlinebakery_admin_sound_volume";

export interface SoundSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  volume: number; // 0 to 1
}

export const getSoundSettings = (): SoundSettings => {
  try {
    const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== "false";
    const notificationsEnabled = localStorage.getItem(NOTIFS_ENABLED_KEY) !== "false";
    const volumeStr = localStorage.getItem(VOLUME_KEY);
    const volume = volumeStr !== null ? Math.max(0, Math.min(1, parseFloat(volumeStr))) : 0.8;

    return {
      soundEnabled,
      notificationsEnabled,
      volume: isNaN(volume) ? 0.8 : volume,
    };
  } catch (_err) {
    return {
      soundEnabled: true,
      notificationsEnabled: true,
      volume: 0.8,
    };
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? "true" : "false");
    window.dispatchEvent(new CustomEvent("theonlinebakery_sound_settings_changed"));
  } catch (_err) {
    // Ignore
  }
};

export const setNotificationsEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(NOTIFS_ENABLED_KEY, enabled ? "true" : "false");
    window.dispatchEvent(new CustomEvent("theonlinebakery_sound_settings_changed"));
  } catch (_err) {
    // Ignore
  }
};

export const setSoundVolume = (volume: number): void => {
  try {
    const clamped = Math.max(0, Math.min(1, volume));
    localStorage.setItem(VOLUME_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent("theonlinebakery_sound_settings_changed"));
  } catch (_err) {
    // Ignore
  }
};

/**
 * Plays a pleasant, bakery-themed harmonic notification chime using the Web Audio API.
 * Gracefully handles blocked audio contexts / permissions without crashing or throwing errors.
 */
export const playOrderNotificationSound = async (): Promise<boolean> => {
  const settings = getSoundSettings();
  if (!settings.soundEnabled) {
    return false;
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return false;
    }

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(settings.volume * 0.35, now);
    masterGain.connect(ctx.destination);

    // Warm 3-tone harmonic chime: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz)
    const notes = [
      { freq: 659.25, time: 0, duration: 0.28 },
      { freq: 830.61, time: 0.09, duration: 0.3 },
      { freq: 987.77, time: 0.18, duration: 0.45 },
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      noteGain.gain.setValueAtTime(0.001, now + note.time);
      noteGain.gain.exponentialRampToValueAtTime(1.0, now + note.time + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });

    // Cleanup audio context after chime finishes
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);

    return true;
  } catch (error) {
    // Autoplay restrictions or browser errors handled gracefully
    console.debug("[SoundUtil] Audio playback prevented or unavailable:", error);
    return false;
  }
};
