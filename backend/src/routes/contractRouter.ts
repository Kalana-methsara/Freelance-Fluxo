import { Router } from "express";
import { sendHireOffer, getMyContracts, respondToOffer } from "../controller/contractController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

// POST /api/contracts/hire — client sends offer
router.post("/hire", sendHireOffer);

// GET /api/contracts — logged-in user's contracts
router.get("/", getMyContracts);

// PATCH /api/contracts/:id/respond — freelancer accepts/declines
router.patch("/:id/respond", respondToOffer);

export default router;