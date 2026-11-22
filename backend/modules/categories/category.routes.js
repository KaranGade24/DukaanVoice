import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  categoryCreateSchema,
  categoryIdSchema,
  categoryListSchema,
  categoryUpdateSchema,
  statusSchema,
} from "../inventory/inventory.validators.js";
import * as controller from "./category.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(categoryCreateSchema), controller.create);
router.get("/", validate(categoryListSchema), controller.list);
router.get("/:id", validate(categoryIdSchema), controller.get);
router.put("/:id", validate(categoryUpdateSchema), controller.update);
router.delete("/:id", validate(categoryIdSchema), controller.remove);
router.patch("/:id/status", validate(statusSchema), controller.setStatus);

export default router;
