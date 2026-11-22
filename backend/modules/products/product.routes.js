import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  productCreateSchema,
  productIdSchema,
  productListSchema,
  productUpdateSchema,
  statusSchema,
} from "../inventory/inventory.validators.js";
import * as controller from "./product.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(productCreateSchema), controller.create);
router.get("/", validate(productListSchema), controller.list);
router.get("/:id", validate(productIdSchema), controller.get);
router.put("/:id", validate(productUpdateSchema), controller.update);
router.delete("/:id", validate(productIdSchema), controller.remove);
router.patch("/:id/status", validate(statusSchema), controller.setStatus);

export default router;
