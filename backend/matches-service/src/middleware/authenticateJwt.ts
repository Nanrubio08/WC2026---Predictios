import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuthenticateJwt(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = payload.userId;
    } catch {
      // Token invalid — treat as unauthenticated, continue
    }
  }
  next();
}
