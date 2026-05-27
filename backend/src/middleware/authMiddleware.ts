import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { 
    _id: string;
    userRole: string[];
    email: string;
  }
}
 
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
 
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
 
    req.user = { 
      _id: decoded.sub, 
      userRole: decoded.roles || [], 
      email: decoded.email
    };
    
    return next();  
  } catch (error: any) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
