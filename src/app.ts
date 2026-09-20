import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Application } from "express";
import helmet from "helmet";
import { env } from "./config/config";
import prisma from "./config/db";
import router from "./routes";
import requestId from "./middlewares/requestId.middleware";
import { apiLimiter } from "./middlewares/rateLimiter.middleware";
import notFound from "./middlewares/notFound.middleware";
import globalErrorHandler from "./middlewares/error.middleware";

const app: Application = express();

app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

app.use(requestId);
app.use(helmet());

// CORS fixed for a single trusted cross-domain frontend, with credentials
// enabled so the httpOnly auth cookies are actually sent/received.
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiLimiter);

app.get("/", (_req, res) => {
  res.send("Job Management System API is running");
});

// Liveness + readiness probe for orchestrators/load balancers.
app.get("/health", async (_req, res) => {
  const dbUp = await prisma
    .$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);

  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? "OK" : "Database connection failed",
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;