import prisma from '../prisma';


export interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  exactMatches: number;
  correctOutcomes: number;
  totalPredictions: number;
  rank: number;
}

export async function listLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = await prisma.leaderboard.findMany();

  const predCounts = await prisma.prediction.groupBy({
    by: ['userId'],
    _count: { id: true },
  });
  const countMap = new Map(predCounts.map((c) => [c.userId, c._count.id]));

  return rows.map((row, index) => ({
    userId: row.userId,
    totalPoints: row.totalPoints,
    exactMatches: row.exactMatches,
    correctOutcomes: row.correctOutcomes,
    totalPredictions: countMap.get(row.userId) ?? 0,
    rank: index + 1,
  }));
}
