import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';

const prisma = new PrismaClient();

// Accept base64 data URIs (jpeg/png/webp), max ~1MB base64 ≈ 750KB image
const AvatarSchema = z.object({
  avatar: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/, 'Must be a base64 image (jpeg/png/webp)')
    .max(1_400_000, 'Image must be under 1 MB'),
});

export async function uploadAvatarController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = AvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: { avatarUrl: parsed.data.avatar },
    select: { avatarUrl: true },
  });

  res.json({ avatarUrl: updated.avatarUrl });
}
