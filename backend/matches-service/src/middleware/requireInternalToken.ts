import { Request, Response, NextFunction } from 'express';

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'];
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expected || token !== expected) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
