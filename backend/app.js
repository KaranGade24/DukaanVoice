import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import supplierRoutes from "./modules/suppliers/supplier.routes.js";
import purchaseRoutes from "./modules/purchases/purchase.routes.js";
import saleRoutes from "./modules/sales/sale.routes.js";
import aiAgentRoutes from "./modules/ai-agent/ai-agent.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { env } from "./config/env.js";

const app = express();

app.disable("x-powered-by");
app.set("etag", false);

app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/health", (_req, res) =>
  res.status(200).json({ success: true, data: { status: "ok" } }),
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/ai-agent", aiAgentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
