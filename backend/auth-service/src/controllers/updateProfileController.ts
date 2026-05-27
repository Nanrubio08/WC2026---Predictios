import { Response } from 'express';
import { PrismaClient } from '../generated/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';

const prisma = new PrismaClient();

const UpdateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  favoriteTeam: z.string().max(100).optional(),
});

export async function updateProfileController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, email, phone, favoriteTeam } = parsed.data;

  if (email) {
    const conflict = await prisma.user.findFirst({ where: { email, NOT: { id: req.userId! } } });
    if (conflict) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(favoriteTeam !== undefined && { favoriteTeam }),
    },
    select: { id: true, username: true, email: true, name: true, phone: true, favoriteTeam: true, avatarUrl: true, isAdmin: true },
  });

  res.json({ ...updated, role: updated.isAdmin ? 'admin' : 'user' });
}
