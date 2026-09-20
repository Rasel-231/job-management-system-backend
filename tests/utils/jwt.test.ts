import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/jwt";

describe("jwt utils", () => {
  const payload = { userId: "user-123", role: "USER" };

  it("round-trips a signed access token", () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe("user-123");
    expect(decoded.role).toBe("USER");
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("round-trips a signed refresh token", () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe("user-123");
  });

  it("rejects verification with the wrong secret (access vs refresh)", () => {
    const token = generateRefreshToken(payload);
    // verifyAccessToken uses the access secret, so a refresh token must fail.
    expect(() => verifyAccessToken(token)).toThrow();
  });
});