import { Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { writeAuditLog } from '../clients/auditClient';
import { AdminRequest } from '../middleware/requireAdmin';

const UpdateUserSchema = z.object({
  username:    z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos').optional(),
  name:        z.string().min(1).max(80).optional().nullable(),
  email:       z.string().email().optional(),
  isAdmin:     z.boolean().optional(),
});

export async function updateUserController(req: AdminRequest, res: Response): Promise<void> {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  if (userId === req.adminUserId) {
    res.status(400).json({ error: 'No puedes editar tu propia cuenta desde el panel admin' });
    return;
  }

  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { username, name, email, isAdmin } = parsed.data;

  if (!username && name === undefined && !email && isAdmin === undefined) {
    res.status(400).json({ error: 'Se requiere al menos un campo para actualizar' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Check uniqueness for username / email changes
  if (username && username !== existing.username) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) {
      res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
      return;
    }
  }
  if (email && email.toLowerCase() !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (taken) {
      res.status(409).json({ error: 'Ese correo electrónico ya está en uso' });
      return;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username !== undefined && { username }),
      ...(name      !== undefined && { name }),
      ...(email     !== undefined && { email: email.toLowerCase() }),
      ...(isAdmin   !== undefined && { isAdmin }),
    },
    select: { id: true, username: true, name: true, email: true, isAdmin: true, createdAt: true },
  });

  await writeAuditLog({
    adminUserId: req.adminUserId ?? 'unknown',
    service:     'auth',
    action:      'UPDATE_USER',
    detail: {
      targetUserId: userId,
      changes: { username, name, email, isAdmin },
    },
  });

  res.json(updated);
}
