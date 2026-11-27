import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import * as controller from "./customer.controller.js";
import {
  customerCreateSchema,
  customerIdSchema,
  customerListSchema,
} from "./customer.validators.js";

const router = Router();
router.use(requireAuth);
router.get("/", validate(customerListSchema), controller.list);
router.post("/", validate(customerCreateSchema), controller.create);
router.get("/:customerId", validate(customerIdSchema), controller.details);
export default router;
