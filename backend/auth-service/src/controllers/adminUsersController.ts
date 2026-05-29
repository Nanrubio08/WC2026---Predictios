import { Response } from 'express';
import prisma from '../prisma';
import { AdminRequest } from '../middleware/requireAdmin';
import { deleteUserData } from '../clients/predictionsClient';
import { writeAuditLog } from '../clients/auditClient';


export async function listUsersController(_req: AdminRequest, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, email: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
}

export async function deleteUserController(req: AdminRequest, res: Response): Promise<void> {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  if (userId === req.adminUserId) {
    res.status(400).json({ error: 'You cannot delete yourself' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.isAdmin) {
    res.status(400).json({ error: 'Cannot delete an admin user' });
    return;
  }

  // Delete predictions, leaderboard, and bonus data in predictions-service first
  try {
    await deleteUserData(userId);
  } catch (err) {
    console.error('Failed to delete user data in predictions-service', err);
  }

  // Delete the user (Cascade handles RefreshTokens)
  await prisma.user.delete({ where: { id: userId } });

  await writeAuditLog({
    adminUserId: req.adminUserId ?? 'unknown',
    service:     'auth',
    action:      'DELETE_USER',
    detail: { targetUserId: userId, username: user.username, email: user.email },
  });

  res.json({ ok: true });
}
