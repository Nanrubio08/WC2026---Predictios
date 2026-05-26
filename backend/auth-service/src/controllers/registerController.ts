import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { provisionUserLeaderboard } from '../clients/predictionsClient';

const prisma = new PrismaClient();

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function registerController(req: Request, res: Response): Promise<void> {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    res.status(409).json({ error: 'username or email already taken' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(email.toLowerCase());

  const user = await prisma.user.create({
    data: { name, username, email, passwordHash, isAdmin },
  });

  try {
    await provisionUserLeaderboard(user.id);
  } catch (err) {
    console.error('Failed to provision leaderboard row for user', user.id, err);
  }

  const role = user.isAdmin ? 'admin' : 'user';
  const token = signToken({ userId: user.id, username: user.username, role });

  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role },
  });
}
