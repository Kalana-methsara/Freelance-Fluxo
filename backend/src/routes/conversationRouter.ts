import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  getConversations,
  createConversation,
  getMessages,
  addParticipant,
  markConversationRead,
} from "../controller/conversationController";

const router = Router();

router.get("/", authenticate, getConversations);
router.post("/", authenticate, createConversation);
router.get("/:id/messages", authenticate, getMessages);
router.post("/:id/participants", authenticate, addParticipant);
router.patch("/:id/read", authenticate, markConversationRead);

export default router;
