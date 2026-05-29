import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';
import { sendPasswordResetEmail } from '../utils/mailer';

export async function forgotPasswordController(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  // Always respond 200 — prevents email enumeration
  if (!email || typeof email !== 'string') {
    res.json({ ok: true });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (user) {
      // Invalidate any existing unused tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      const rawToken  = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { tokenHash, userId: user.id, expiresAt },
      });

      const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:8080').split(',')[0];
      const resetUrl    = `${frontendUrl}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        console.error('[forgotPassword] Failed to send email:', err);
      }
    }
  } catch (err) {
    console.error('[forgotPassword] DB error:', err);
    // Always return 200 to prevent enumeration
  }

  res.json({ ok: true });
}
