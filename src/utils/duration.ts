// Parses JWT-style expiry strings ("15m", "1h", "30d") into milliseconds.
// Central so cookie lifetime and token exp could never drift apart.
export const parseExpiresInToMs = (value: string | undefined, fallbackMs: number): number => {
  const match = /^(\d+)([smhd])$/.exec(value || "");
  if (!match) return fallbackMs;
  const n = Number(match[1]);
  const unitMs: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * unitMs[match[2]];
};

export const ACCESS_TOKEN_FALLBACK_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_FALLBACK_MS = 30 * 24 * 60 * 60 * 1000;