import { generateOtp, hashOtp, isOtpValid } from "../src/utils/otp";
import { parseExpiresInToMs } from "../src/utils/duration";
import { calculatePagination, buildMeta } from "../src/utils/paginationHelper";

describe("otp util", () => {
  it("generates a 6-digit code", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("never stores the plaintext code in the DB-side value", () => {
    const code = generateOtp();
    const digest = hashOtp(code);
    expect(digest).not.toBe(code);
    expect(digest).toHaveLength(64);
  });

  it("hashes deterministically", () => {
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
    expect(hashOtp("123456")).not.toBe(hashOtp("654321"));
  });

  it("validates a correct code against its stored hash", () => {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    expect(isOtpValid(code, hashOtp(code), expiresAt)).toBe(true);
  });

  it("rejects a wrong code", () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    expect(isOtpValid("999999", hashOtp("123456"), expiresAt)).toBe(false);
  });

  it("rejects an expired code", () => {
    const code = generateOtp();
    const past = new Date(Date.now() - 1000);
    expect(isOtpValid(code, hashOtp(code), past)).toBe(false);
  });

  it("returns false for missing stored value / expiry", () => {
    expect(isOtpValid("123456", null, new Date(Date.now() + 1000))).toBe(false);
    expect(isOtpValid("123456", "abc", null)).toBe(false);
  });

  it("accepts a legacy plaintext stored value for backward compat", () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    expect(isOtpValid("654321", "654321", expiresAt)).toBe(true);
  });
});

describe("duration parser (cookie/token alignment)", () => {
  it("parses common JWT expiry strings", () => {
    expect(parseExpiresInToMs("15m", 0)).toBe(15 * 60 * 1000);
    expect(parseExpiresInToMs("1h", 0)).toBe(60 * 60 * 1000);
    expect(parseExpiresInToMs("30d", 0)).toBe(30 * 24 * 60 * 60 * 1000);
    expect(parseExpiresInToMs("5s", 0)).toBe(5000);
  });

  it("falls back for unparseable input", () => {
    expect(parseExpiresInToMs("", 1234)).toBe(1234);
    expect(parseExpiresInToMs("banana", 1234)).toBe(1234);
    expect(parseExpiresInToMs(undefined, 1234)).toBe(1234);
  });
});

describe("pagination helper", () => {
  it("defaults to page 1 / limit 10", () => {
    expect(calculatePagination({})).toMatchObject({ page: 1, limit: 10, skip: 0, sortOrder: "desc" });
  });

  it("computes skip from page/limit and clamps bad input", () => {
    expect(calculatePagination({ page: "3", limit: "20" }).skip).toBe(40);
    expect(calculatePagination({ page: "0", limit: "-2" })).toMatchObject({ page: 1, limit: 10 });
  });

  it("builds meta incl. totalPages", () => {
    expect(buildMeta(1, 10, 25)).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
    expect(buildMeta(1, 10, 0).totalPages).toBe(1);
  });
});