import { Router } from "express";
import {
  getJobs,
  getJobById,
  createJob,
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getClientJobs,
  getFreelancerJobs,
} from "../controller/jobController";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../enums/userRole";

const router = Router();

router.get("/", getJobs);
router.get("/my/client", authenticate, requireRole([UserRole.CLIENT]), getClientJobs);
router.get("/my/freelancer", authenticate, requireRole([UserRole.FREELANCER]), getFreelancerJobs);
router.get("/applications/me", authenticate, requireRole([UserRole.FREELANCER]), getMyApplications);
router.get("/:id", getJobById);
router.post("/", authenticate, requireRole([UserRole.CLIENT]), createJob);
router.post("/:id/apply", authenticate, requireRole([UserRole.FREELANCER]), applyToJob);
router.get("/:id/applications", authenticate, requireRole([UserRole.CLIENT]), getJobApplications);
router.patch(
  "/applications/:id/status",
  authenticate,
  requireRole([UserRole.CLIENT]),
  updateApplicationStatus
);

export default router;
