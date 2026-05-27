import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/enums/userRole";
import { AuthRequest } from "./authMiddleware"; 

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }
    const hasRole = req.user.userRole?.some((role) => allowedRoles.includes(role as UserRole));

    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: You don't have permission" });
    }

    next();
  };
};


