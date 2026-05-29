import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../prisma';
import { hashPassword } from '../utils/password';

const ResetSchema = z.object({
  token:       z.string().min(1),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

export async function resetPasswordController(req: Request, res: Response): Promise<void> {
  const parsed = ResetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    res.status(400).json({ error: 'El enlace es inválido o ya expiró. Solicita uno nuevo.' });
    return;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    // Update password
    prisma.user.update({
      where: { id: record.userId },
      data:  { passwordHash },
    }),
    // Mark token as used
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data:  { usedAt: new Date() },
    }),
    // Invalidate all sessions (force re-login on all devices)
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  res.json({ ok: true });
}
