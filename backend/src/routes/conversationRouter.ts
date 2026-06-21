import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  getConversations,
  createConversation,
  getMessages,
} from "../controller/conversationController";

const router = Router();

router.get("/", authenticate, getConversations);
router.post("/", authenticate, createConversation);
router.get("/:id/messages", authenticate, getMessages);

export default router;