import { Request, Response } from 'express';
import { listLeaderboard, type LeaderboardEntry } from '../services/listLeaderboard';
import { getUsersByIds } from '../clients/authClient';
import logger from '../utils/logger';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isTiedOnMain(a: LeaderboardEntry, b: LeaderboardEntry): boolean {
  return a.totalPoints === b.totalPoints
    && a.exactMatches === b.exactMatches
    && a.correctOutcomes === b.correctOutcomes
    && a.totalPredictions === b.totalPredictions;
}

export async function getLeaderboardController(_req: Request, res: Response): Promise<void> {
  const entries = await listLeaderboard();

  const userIds = entries.map((e) => e.userId);
  const validUuids = userIds.filter((id) => UUID_RE.test(id));
  let usernameMap: Record<string, string> = {};
  let nameMap: Record<string, string | null> = {};
  let adminSet = new Set<string>();
  let createdAtMap = new Map<string, string>();

  try {
    if (validUuids.length > 0) {
      const users = await getUsersByIds(validUuids);
      usernameMap = Object.fromEntries(users.map((u) => [u.id, u.username]));
      nameMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
      adminSet = new Set(users.filter((u) => u.isAdmin).map((u) => u.id));
      for (const u of users) {
        createdAtMap.set(u.id, u.createdAt);
      }
    }
  } catch (err) {
    logger.error('Failed to fetch user info for leaderboard — hiding all unresolved users to prevent admin leak', { error: err });
    res.json([]);
    return;
  }

  // Filter out admins, enrich with user data
  const enriched = entries
    .filter((e) => !adminSet.has(e.userId))
    .map((e) => ({
      ...e,
      username: usernameMap[e.userId] ?? 'Unknown',
      name: nameMap[e.userId] ?? null,
      createdAt: createdAtMap.get(e.userId) ?? '',
    }));

  // Sort by: totalPoints DESC → exactMatches DESC → correctOutcomes DESC → totalPredictions DESC → createdAt ASC
  enriched.sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.exactMatches !== b.exactMatches) return b.exactMatches - a.exactMatches;
    if (a.correctOutcomes !== b.correctOutcomes) return b.correctOutcomes - a.correctOutcomes;
    if (a.totalPredictions !== b.totalPredictions) return b.totalPredictions - a.totalPredictions;
    return a.createdAt.localeCompare(b.createdAt);
  });

  // Assign ranks:
  //   Positions 1 and 2 are always singletons (super tiebreaker ensures uniqueness)
  //   Position 3+ can share if tied on main criteria
  type Enriched = LeaderboardEntry & {
    username: string;
    name: string | null;
    createdAt: string;
  };

  const result: (Enriched & { rank: number })[] = [];

  for (let i = 0; i < enriched.length; i++) {
    const e = enriched[i];
    let rank: number;
    if (i === 0) {
      rank = 1;
    } else if (i === 1) {
      rank = 2;
    } else {
      const prev = result[i - 1];
      if (isTiedOnMain(e, prev)) {
        rank = prev.rank <= 2 ? prev.rank + 1 : prev.rank;
      } else {
        rank = prev.rank + 1;
      }
    }
    result.push({ ...e, rank });
  }

  res.json(result.map((e) => ({
    rank: e.rank,
    userId: e.userId,
    username: e.username,
    name: e.name,
    totalPoints: e.totalPoints,
    exactMatches: e.exactMatches,
    correctOutcomes: e.correctOutcomes,
    totalPredictions: e.totalPredictions,
  })));
}
