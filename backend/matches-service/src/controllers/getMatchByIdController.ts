import { Request, Response } from 'express';
import prisma from '../prisma';


export async function getMatchByIdController(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid match id' });
    return;
  }

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  res.json(match);
}
