
export const parseExpiresInToMs = (value: string | undefined, fallbackMs: number): number => {
  const match = /^(\d+)(s|m|h|d|w|y)$/.exec(value?.trim() || "");

  if (!match) {
    if (value) {
      console.warn(
        `[parseExpiresInToMs] Invalid expiry format: "${value}". Falling back to ${fallbackMs}ms.`
      );
    }
    return fallbackMs;
  }

  const n = Number(match[1]);

  if (!Number.isFinite(n) || n <= 0) {
    console.warn(
      `[parseExpiresInToMs] Non-positive expiry value: "${value}". Falling back to ${fallbackMs}ms.`
    );
    return fallbackMs;
  }

  const unitMs: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 7 * 86_400_000,
    y: 365 * 86_400_000,
  };

  return n * unitMs[match[2]];
};

export const ACCESS_TOKEN_FALLBACK_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_FALLBACK_MS = 30 * 24 * 60 * 60 * 1000;