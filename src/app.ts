import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Application } from "express";
import helmet from "helmet";
import { env } from "./config/config";
import router from "./routes";
import requestId from "./middlewares/requestId.middleware";
import { apiLimiter } from "./middlewares/rateLimiter.middleware";
import notFound from "./middlewares/notFound.middleware";
import globalErrorHandler from "./middlewares/error.middleware";

const app: Application = express();

app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

app.use(requestId);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.CLIENT_URL.split(","),
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.get("/", (_req, res) => {
  res.send("Job Management System API is running");
});

app.use("/api/v1", apiLimiter, router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;