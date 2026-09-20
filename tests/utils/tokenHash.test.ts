import { hashToken } from "../../src/utils/tokenHash";

describe("hashToken", () => {
  it("returns 64-char hex digest", () => {
    expect(hashToken("random-jwt-value")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("does not store the raw token verbatim", () => {
    expect(hashToken("abc")).not.toContain("abc");
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});