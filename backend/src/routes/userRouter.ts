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

const router = Router();

// Public routes
router.post("/register/freelancer", validate(registerSchema), registerFreelancer);
router.post("/register/client", validate(registerSchema), registerClient);
router.post("/login", validate(loginSchema), loginUser);

// Protected routes
router.get("/me", getMyDetails);
router.get("/", getUsers);
router.post("/register/admin", validate(registerAdminSchema), registerAdmin);

export default router;