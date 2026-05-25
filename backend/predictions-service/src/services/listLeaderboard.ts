import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  rank: number;
}

type LeaderboardRow = {
  userId: string;
  totalPoints: number;
};

export async function listLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = (await prisma.leaderboard.findMany({
    orderBy: { totalPoints: 'desc' },
  })) as LeaderboardRow[];

  return rows.map((row: LeaderboardRow, index: number) => ({
    userId: row.userId,
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}
