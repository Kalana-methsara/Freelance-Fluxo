import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 7, 
  standardHeaders: true, 
  legacyHeaders: false, 
  
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      status: 429,
      error: "Too Many Requests",
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
});