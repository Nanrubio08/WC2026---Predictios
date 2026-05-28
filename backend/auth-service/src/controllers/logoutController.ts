import { Request, Response } from 'express';
import prisma from '../prisma';


export async function logoutController(req: Request, res: Response): Promise<void> {
  const refreshTokenValue = req.cookies?.refreshToken as string | undefined;

  if (refreshTokenValue) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } });
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(204).send();
}
