import { Request, Response } from 'express';
import prisma from '../prisma';
import { signToken } from '../utils/jwt';


export async function refreshController(req: Request, res: Response): Promise<void> {
  const refreshTokenValue = req.cookies?.refreshToken as string | undefined;

  if (!refreshTokenValue) {
    res.status(401).json({ error: 'No refresh token provided' });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const role = stored.user.isAdmin ? 'admin' : 'user';
  const accessToken = signToken({
    userId: stored.user.id,
    username: stored.user.username,
    role,
  });

  res.json({ token: accessToken });
}
