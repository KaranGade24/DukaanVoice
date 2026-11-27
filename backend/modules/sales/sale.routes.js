import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  creditPaymentSchema,
  frequentlySoldSchema,
  saleCreateSchema,
  saleIdSchema,
  saleListSchema,
  saleSummarySchema,
} from "./sale.validators.js";
import * as controller from "./sale.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", validate(saleSummarySchema), controller.summary);

router.get(
  "/frequently-sold",
  validate(frequentlySoldSchema),
  controller.frequentlySold,
);

router.get("/", validate(saleListSchema), controller.list);

router.get("/:saleId", validate(saleIdSchema), controller.details);

router.post(
  "/:saleId/credit-payments",
  validate(creditPaymentSchema),
  controller.creditPayment,
);

router.post("/", validate(saleCreateSchema), controller.create);

export default router;
