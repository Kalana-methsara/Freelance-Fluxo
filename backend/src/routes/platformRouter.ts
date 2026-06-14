import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  getFreelancers,
  getFreelancerById,
  search,
} from "../controller/platformController";

const router = Router();

router.get("/search", search);
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.get("/freelancers", getFreelancers);
router.get("/freelancers/:id", getFreelancerById);

export default router;
