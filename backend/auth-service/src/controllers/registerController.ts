import { Request, Response } from 'express';
import { PrismaClient } from '../generated/client';
import { z } from 'zod';
import { hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { provisionUserLeaderboard } from '../clients/predictionsClient';

const prisma = new PrismaClient();

const RegisterSchema = z.object({
  name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres').max(80, 'El nombre es demasiado largo'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(30, 'El usuario es demasiado largo')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos (sin espacios)'),
  email: z.string().email('Ingresá un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128, 'La contraseña es demasiado larga'),
});

export async function registerController(req: Request, res: Response): Promise<void> {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0] as string | undefined;
    res.status(400).json({ error: issue.message, field });
    return;
  }

  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    if (existing.username === username) {
      res.status(409).json({ error: 'Ese nombre de usuario ya está en uso', field: 'username' });
    } else {
      res.status(409).json({ error: 'Ese correo ya está registrado', field: 'email' });
    }
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
