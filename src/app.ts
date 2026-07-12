import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Application } from "express";
import { env } from "./config/env";
import router from "./routes";
import notFound from "./middlewares/notFound.middleware";
import globalErrorHandler from "./middlewares/error.middleware";

const app: Application = express();

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

app.get("/", (_req, res) => {
  res.send("Job Management System API is running");
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
