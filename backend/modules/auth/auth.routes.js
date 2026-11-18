import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { signupSchema, loginSchema } from "./auth.validators.js";
import {
  signupController,
  loginController,
  meController,
} from "./auth.controller.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Try again later.",
    },
  },
});

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), signupController);

router.post("/login", authLimiter, validate(loginSchema), loginController);

router.get("/me", requireAuth, meController);
export default router;
