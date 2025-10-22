import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  req.userId = userId;
  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  
  if (userId) {
    req.userId = userId;
  }
  
  next();
}
