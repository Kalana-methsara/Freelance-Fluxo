import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Return list of conversations for the authenticated user
router.get("/", authenticate, async (req, res) => {
  // Minimal stub — replace with real DB logic
  res.json({ success: true, data: [] });
});

// Create a new conversation
router.post("/", authenticate, async (req, res) => {
  const { participantId, jobId } = req.body;
  // Minimal stub — replace with real DB logic
  const convo = { id: Date.now().toString(), participants: [req.user?.id, participantId], jobId };
  res.status(201).json({ success: true, data: convo });
});

// Get messages for a conversation
router.get("/:id/messages", authenticate, async (req, res) => {
  // Minimal stub — replace with real DB logic
  res.json({ success: true, data: [] });
});

export default router;
