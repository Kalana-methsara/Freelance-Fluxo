import { Router } from "express";
import { 
  registerUser, 
  loginUser, 
  getMyDetails, 
  registerAdmin, 
  getUsers,
  registerManager 
} from "../controller/userController"; 
import { validate } from "../middleware/validateMiddleware";
import { loginSchema, registerSchema} from "../schemas/authSchema";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), loginUser);

export default router;


