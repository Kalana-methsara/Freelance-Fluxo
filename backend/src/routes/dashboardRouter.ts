import { Router } from "express";
import {
  getFreelancerDashboard,
  getClientDashboard,
  getAdminDashboard,
} from "../controller/dashboardController";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../enums/userRole";

const router = Router();

router.get(
  "/freelancer",
  authenticate,
  requireRole([UserRole.FREELANCER]),
  getFreelancerDashboard
);
router.get("/client", authenticate, requireRole([UserRole.CLIENT]), getClientDashboard);
router.get("/admin", authenticate, requireRole([UserRole.ADMIN]), getAdminDashboard);

export default router;
