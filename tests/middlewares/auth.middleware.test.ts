import request from "supertest";
import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import { authenticate } from "../../src/middlewares/auth.middleware";
import { generateAccessToken } from "../../src/utils/jwt";

const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.get("/protected", authenticate, (req: Request, res: Response) =>
    res.json({ user: req.user })
  );
  return app;
};

describe("authenticate middleware", () => {
  it("rejects requests without a token with 401", async () => {
    const res = await request(buildTestApp()).get("/protected");
    expect(res.status).toBe(401);
  });

  it("accepts a valid signed token and attaches req.user", async () => {
    const token = generateAccessToken({ userId: "u1", role: "USER" });
    const res = await request(buildTestApp())
      .get("/protected")
      .set("Cookie", [`accessToken=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ userId: "u1", role: "USER" });
  });

  it("rejects a tampered token with 401 via the global error handler", async () => {
    const app = express();
    app.use(express.json());
    app.get("/protected", authenticate, (_req: Request, res: Response) => res.json({ ok: true }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const globalErrorHandler = require("../../src/middlewares/error.middleware").default;
    app.use(globalErrorHandler);

    const res = await request(app)
      .get("/protected")
      .set("Cookie", ["accessToken=garbage.token.value"]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});