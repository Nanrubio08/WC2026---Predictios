import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';

const prisma = new PrismaClient();

export async function getProfileController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, username: true, email: true, name: true, phone: true, favoriteTeam: true, avatarUrl: true, isAdmin: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ ...user, role: user.isAdmin ? 'admin' : 'user' });
}
