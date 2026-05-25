import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AdminJwtPayload {
  userId: string;
  username: string;
  role?: string;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  let payload: AdminJwtPayload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as AdminJwtPayload;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  if (payload.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
