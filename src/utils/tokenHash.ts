import { createHash } from "crypto";

// Refresh tokens are only ever stored as an SHA-256 hash — if the token table
// leaks, the raw tokens are not recoverable and the stored value cannot be
// replayed to forge a session.
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");