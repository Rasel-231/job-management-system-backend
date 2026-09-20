jest.mock("../src/config/db", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

import request from "supertest";
import app from "../src/app";

describe("app (production surface)", () => {
  it("serves the root banner", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("running");
  });

  it("reports healthy when the database responds", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upTime ?? res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns 404 JSON contract for unknown routes", async () => {
    const res = await request(app).get("/no-such-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found");
  });

  it("tags every response with X-Request-Id (tracing)", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("applies helmet security headers", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("rejects invalid login bodies with a 400 validation error", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("engages the auth rate limiter on the credential surface", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("x-forwarded-for", "203.0.113.9")
      .send({ email: "a@b.c", password: "x".repeat(6) });
    expect(res.status).toBe(400); // validation rejects the fake email first
    expect(res.headers["ratelimit-limit"] ?? res.headers["ratelimit"]).toBeDefined();
  });
});