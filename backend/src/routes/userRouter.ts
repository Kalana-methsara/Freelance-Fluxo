import { Router } from "express";
import {
    loginUser,
    getMyDetails,
    registerAdmin,
    getUsers,
    registerFreelancer,
    registerClient,
    refreshToken,
    updateUserApproval,
    updateUserProfile,
    updateMyProfile,
    updateUserRole,
    deleteUser,                         // ✅ super admin delete user
} from "../controller/userController";
import {
    getAdminDashboard,
    getAllJobs,
    deleteJob,
    flagJob,
    getAllReports,
    resolveReport,
    deleteReport,
    createReport,
    getPlatformStats,
} from "../controller/adminController";
import { validate } from "../middleware/validateMiddleware";
import { loginSchema, registerSchema, registerAdminSchema, updateProfileSchema } from "../schemas/authSchema";
import passport from "../config/passport";
import { signAccessToken, signRefreshToken } from "../utils/generateToken";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../enums/userRole";

const router = Router();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// ======================== Public Routes ========================
router.post("/register/freelancer", validate(registerSchema), registerFreelancer);
router.post("/register/client", validate(registerSchema), registerClient);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshToken);

// ======================== OAuth Routes ========================
router.get("/google", (req, res, next) => {
  const role = req.query.role || "client";
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    session: false,
    state: JSON.stringify({ role }) 
  })(req, res, next);
});

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login", session: false }), 
  (req: any, res: any) => {
    const accessToken = signAccessToken(req.user);
    const refreshTokenValue = signRefreshToken(req.user);
    res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}&refresh=${refreshTokenValue}`);
  }
);

router.get("/github", (req, res, next) => {
  const role = req.query.role || "client";
  passport.authenticate("github", { 
    session: false,
    state: JSON.stringify({ role }) 
  })(req, res, next);
});

router.get("/github/callback", passport.authenticate("github", { failureRedirect: "/login", session: false }), 
  (req: any, res: any) => {
    const accessToken = signAccessToken(req.user);
    const refreshTokenValue = signRefreshToken(req.user);
    res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}&refresh=${refreshTokenValue}`);
  }
);

// ======================== Protected Routes ========================
router.get("/me", authenticate, getMyDetails);
router.patch("/users/profile", authenticate, validate(updateProfileSchema), updateMyProfile);
router.patch("/users/:id/profile", authenticate, validate(updateProfileSchema), updateUserProfile);

// ======================== Admin-Only Routes ========================
router.get("/", authenticate, requireRole([UserRole.ADMIN]), getUsers);
router.post("/register/admin", authenticate, requireRole([UserRole.ADMIN]), validate(registerAdminSchema), registerAdmin);
router.patch("/users/:id/approval", authenticate, requireRole([UserRole.ADMIN]), updateUserApproval);
router.patch("/users/:id/role", authenticate, requireRole([UserRole.ADMIN]), updateUserRole);

// ─── Admin Dashboard & Management ──────────────────────────────
router.get(
    "/dashboard/admin",
    authenticate,
    requireRole([UserRole.ADMIN]),
    getAdminDashboard
);

router.get(
    "/admin/jobs",
    authenticate,
    requireRole([UserRole.ADMIN]),
    getAllJobs
);

router.delete(
    "/admin/jobs/:jobId",
    authenticate,
    requireRole([UserRole.ADMIN]),
    deleteJob
);

router.post(
    "/admin/jobs/:jobId/flag",
    authenticate,
    requireRole([UserRole.ADMIN]),
    flagJob
);

router.get(
    "/admin/reports",
    authenticate,
    requireRole([UserRole.ADMIN]),
    getAllReports
);

router.patch(
    "/admin/reports/:reportId/resolve",
    authenticate,
    requireRole([UserRole.ADMIN]),
    resolveReport
);

router.delete(
    "/admin/reports/:reportId",
    authenticate,
    requireRole([UserRole.ADMIN]),
    deleteReport
);

router.get(
    "/admin/stats",
    authenticate,
    requireRole([UserRole.ADMIN]),
    getPlatformStats
);

router.post("/reports", authenticate, createReport);

// ─── Super Admin only ──────────────────────────────────────────
router.delete(
    "/users/:userId",
    authenticate,
    requireRole([UserRole.SUPER_ADMIN]),
    deleteUser
);

// ======================== Development Helper ========================
if (process.env.NODE_ENV !== "production") {
router.get('/dev/token', async (req, res) => {
  try {
    const roleParam = (req.query.role as string) || '';
    let role = UserRole.CLIENT;
    if (roleParam.toLowerCase() === 'admin') role = UserRole.ADMIN;
    if (roleParam.toLowerCase() === 'freelancer') role = UserRole.FREELANCER;

    const { signAccessToken } = await import('../utils/generateToken');
    const { UserModel } = await import('../models/userModel');
    const existing = await UserModel.findOne().lean();
    const subjectId = existing?._id?.toString() || undefined;

    const fakeUser: any = {
      _id: subjectId || '000000000000000000000000',
      userRole: [role],
      email: existing?.email || `dev+${role.toLowerCase()}@local`,
    };
    const token = signAccessToken(fakeUser);
    res.json({ success: true, accessToken: token, role: role });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Dev token error', error: err });
  }
});
}

export default router;