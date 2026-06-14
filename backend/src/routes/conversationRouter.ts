import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// Return list of conversations for the authenticated user
router.get("/", authenticate, async (req, res) => {
  // Minimal stub — replace with real DB logic
  res.json({ success: true, data: [] });
});

// Create a new conversation
router.post("/", authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const { participantId, jobId } = req.body;
  // Use _id instead of id
  const convo = { 
    id: Date.now().toString(), 
    participants: [authReq.user?._id, participantId],
    jobId 
  };
  res.status(201).json({ success: true, data: convo });
});

// Get messages for a conversation
router.get("/:id/messages", authenticate, async (req, res) => {
  // Minimal stub — replace with real DB logic
  res.json({ success: true, data: [] });
});

export default router;