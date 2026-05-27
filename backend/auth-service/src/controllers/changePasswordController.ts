import { Response } from 'express';
import { PrismaClient } from '../generated/client';
import { z } from 'zod';
import { verifyPassword, hashPassword } from '../utils/password';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';

const prisma = new PrismaClient();

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function changePasswordController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!user.passwordHash) {
    res.status(400).json({ error: 'This account uses Google Sign-In and has no password.' });
    return;
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: req.userId! }, data: { passwordHash } });

  res.json({ message: 'Password updated successfully' });
}
