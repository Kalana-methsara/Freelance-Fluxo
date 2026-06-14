import { Request, Response, NextFunction } from "express";
import { UserRole } from "../enums/userRole";
import { AuthRequest } from "./authMiddleware";

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    if (authReq.user.userRole?.includes(UserRole.SUPER_ADMIN)) {
      return next();
    }

    const hasRole = authReq.user.userRole?.some(
      (role) => allowedRoles.includes(role as UserRole)
    );

    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: You don't have permission" });
    }

    next();
  };
};