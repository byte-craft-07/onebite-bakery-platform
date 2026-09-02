import crypto from "crypto";

const DEFAULT_ITERATIONS = 100000;
const LEGACY_ITERATIONS = 1000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export const hashPassword = (password: string, iterations = DEFAULT_ITERATIONS): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
  return `${iterations}:${salt}:${hash}`;
};

export const verifyPassword = (password: string, combined: string): boolean => {
  try {
    const parts = combined.split(":");
    let iterations = DEFAULT_ITERATIONS;
    let salt: string;
    let originalHash: string;

    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      iterations = Number.parseInt(parts[0], 10) || DEFAULT_ITERATIONS;
      salt = parts[1];
      originalHash = parts[2];
    } else if (parts.length === 2 && parts[0] && parts[1]) {
      // Legacy format support
      iterations = LEGACY_ITERATIONS;
      salt = parts[0];
      originalHash = parts[1];
    } else {
      return false;
    }

    if (!salt || !originalHash) return false;

    const hash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
    const hashBuffer = Buffer.from(hash, "hex");
    const originalBuffer = Buffer.from(originalHash, "hex");

    if (hashBuffer.length !== originalBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, originalBuffer);
  } catch (_err) {
    return false;
  }
};
