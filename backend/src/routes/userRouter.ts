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
router.patch("/users/:id/approval", authenticate, requireRole([UserRole.ADMIN]), updateUserApproval);

export default router;