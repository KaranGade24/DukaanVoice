import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { env } from "./config/env.js";

const app = express();
app.disable("x-powered-by");
app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.get("/health", (_req, res) =>
  res.status(200).json({ success: true, data: { status: "ok" } }),
);
app.use("/api/auth", authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
