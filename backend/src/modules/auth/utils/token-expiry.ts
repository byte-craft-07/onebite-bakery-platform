const TIME_UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

type TimeUnit = keyof typeof TIME_UNIT_MS;

export const durationToMs = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());

  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2] as TimeUnit;

  return value * TIME_UNIT_MS[unit];
};

export const durationToSeconds = (duration: string): number => {
  return Math.floor(durationToMs(duration) / 1000);
};
