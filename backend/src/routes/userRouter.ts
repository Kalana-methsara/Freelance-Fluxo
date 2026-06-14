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
    updateUserRole,
} from "../controller/userController";
import { validate } from "../middleware/validateMiddleware";
import { loginSchema, registerSchema, registerAdminSchema } from "../schemas/authSchema";
import passport from "../config/passport";
import { signAccessToken, signRefreshToken } from "../utils/generateToken";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../enums/userRole";

const router = Router();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// Public routes
router.post("/register/freelancer", validate(registerSchema), registerFreelancer);
router.post("/register/client", validate(registerSchema), registerClient);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshToken);

// --- GOOGLE AUTH ---
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

// --- GITHUB AUTH ---
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
// Protected routes
router.get("/me", authenticate, getMyDetails);
router.get("/", authenticate, requireRole([UserRole.ADMIN]), getUsers);
router.post("/register/admin", authenticate, requireRole([UserRole.ADMIN]), validate(registerAdminSchema), registerAdmin);
router.patch("/users/:id/profile", authenticate, updateUserProfile);
router.patch("/users/:id/approval", authenticate, requireRole([UserRole.ADMIN]), updateUserApproval);
router.patch("/users/:id/role", authenticate, requireRole([UserRole.ADMIN]), updateUserRole);

// Development helper: return an access token for the first user in DB
router.get('/dev/token', async (req, res) => {
  try {
    const roleParam = (req.query.role as string) || '';
    const { UserRole } = await import('../enums/userRole');
    let role = UserRole.CLIENT;
    if (roleParam.toLowerCase() === 'admin') role = UserRole.ADMIN;
    if (roleParam.toLowerCase() === 'freelancer') role = UserRole.FREELANCER;

    const { signAccessToken } = await import('../utils/generateToken');
    // Prefer using an existing user's _id so Mongoose lookups work; fallback to first user
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

export default router;