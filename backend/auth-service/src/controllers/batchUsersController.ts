import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';


const BatchUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(200),
});

export async function batchUsersController(req: Request, res: Response): Promise<void> {
  const parsed = BatchUsersSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { userIds } = parsed.data;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, name: true, isAdmin: true, createdAt: true },
  });

  res.json(users);
}
