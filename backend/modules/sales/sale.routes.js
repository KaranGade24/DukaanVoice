import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { saleCreateSchema } from "./sale.validators.js";
import * as controller from "./sale.controller.js";
const router = Router();
router.use(requireAuth);
router.post("/", validate(saleCreateSchema), controller.create);
export default router;
