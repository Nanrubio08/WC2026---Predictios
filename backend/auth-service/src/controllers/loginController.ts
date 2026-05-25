import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyPassword } from '../utils/password';
import { signToken, generateRefreshToken } from '../utils/jwt';

const prisma = new PrismaClient();

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginController(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const role = user.isAdmin ? 'admin' : 'user';
  const accessToken = signToken({ userId: user.id, username: user.username, role });

  const refreshTokenValue = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.refreshToken.create({
    data: { token: refreshTokenValue, userId: user.id, expiresAt },
  });

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/api/auth',
  });

  res.json({
    token: accessToken,
    user: { id: user.id, username: user.username, email: user.email, role },
  });
}
