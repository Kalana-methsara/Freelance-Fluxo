import { Router } from "express";
import {
    loginUser,
    getMyDetails,
    registerAdmin,
    getUsers,
    registerFreelancer,
    registerClient
} from "../controller/userController";
import { validate } from "../middleware/validateMiddleware";
import { loginSchema, registerSchema, registerAdminSchema } from "../schemas/authSchema";
import passport from "../config/passport";
import { signAccessToken, signRefreshToken } from "../utils/generateToken";

const router = Router();
console.log('--------router--------------')

// Public routes
router.post("/register/freelancer", validate(registerSchema), registerFreelancer);
router.post("/register/client", validate(registerSchema), registerClient);
router.post("/login", validate(loginSchema), loginUser);

// --- GOOGLE AUTH ---
router.get("/google", (req, res, next) => {
  const role = req.query.role || "client"; // Frontend එකෙන් එවපු role එක ගන්නවා
  // Passport authenticate එකට state එකක් විදිහට role එක පාස් කරනවා
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    session: false,
    state: JSON.stringify({ role }) 
  })(req, res, next);
});

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login", session: false }), 
  (req: any, res: any) => {
    const accessToken = signAccessToken(req.user);
    const refreshToken = signRefreshToken(req.user);
    res.redirect(`http://localhost:5173/oauth-callback?token=${accessToken}&refresh=${refreshToken}`);
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
    const refreshToken = signRefreshToken(req.user);
    res.redirect(`http://localhost:5173/oauth-callback?token=${accessToken}&refresh=${refreshToken}`);
  }
);

// Protected routes
router.get("/me", getMyDetails);
router.get("/", getUsers);
router.post("/register/admin", validate(registerAdminSchema), registerAdmin);

export default router;