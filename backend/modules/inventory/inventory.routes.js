import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  alertsSchema,
  historyListSchema,
  historyProductSchema,
  stockAdjustSchema,
  stockInSchema,
  stockOutSchema,
} from "./inventory.validators.js";
import * as controller from "./inventory.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", controller.summary);
router.post("/stock-in", validate(stockInSchema), controller.stockIn);
router.post("/stock-out", validate(stockOutSchema), controller.stockOut);
router.post("/adjust", validate(stockAdjustSchema), controller.adjust);
router.get("/history", validate(historyListSchema), controller.history);
router.get(
  "/history/:productId",
  validate(historyProductSchema),
  controller.productHistory,
);
router.get("/alerts", validate(alertsSchema), controller.alerts);

export default router;
