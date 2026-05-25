import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JwtPayload {
  userId: string;
  username: string;
  role?: string;
}

export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, secret) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}
