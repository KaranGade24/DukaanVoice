import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import * as controller from "./ai-agent.controller.js";
import {
  cancelSchema,
  chatSchema,
  confirmSchema,
  conversationSchema,
  updateDraftSchema,
} from "./ai-agent.validators.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
});

router.use(requireAuth);
router.post("/chat", chatLimiter, validate(chatSchema), controller.chat);
router.post(
  "/chat/stream",
  chatLimiter,
  validate(chatSchema),
  controller.chatStream,
);
router.get("/conversations", controller.list);
router.get("/conversations/:id", validate(conversationSchema), controller.get);
router.put("/conversations/:id/draft", validate(updateDraftSchema), controller.updateDraft);
router.delete(
  "/conversations/:id",
  validate(conversationSchema),
  controller.archive,
);
router.post("/confirm-action", validate(confirmSchema), controller.confirm);
router.post("/cancel-action", validate(cancelSchema), controller.cancel);

export default router;
