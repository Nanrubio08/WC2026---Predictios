import { Request, Response } from 'express';
import { listLeaderboard } from '../services/listLeaderboard';
import { getUsersByIds } from '../clients/authClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getLeaderboardController(_req: Request, res: Response): Promise<void> {
  const entries = await listLeaderboard();

  const userIds = entries.map((e) => e.userId);
  const validUuids = userIds.filter((id) => UUID_RE.test(id));
  let usernameMap: Record<string, string> = {};
  let nameMap: Record<string, string | null> = {};
  let adminSet = new Set<string>();

  try {
    if (validUuids.length > 0) {
      const users = await getUsersByIds(validUuids);
      usernameMap = Object.fromEntries(users.map((u) => [u.id, u.username]));
      nameMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
      adminSet = new Set(users.filter((u) => u.isAdmin).map((u) => u.id));
    }
  } catch (err) {
    console.error('Failed to fetch usernames for leaderboard', err);
  }

  const result = entries
    .filter((e) => !adminSet.has(e.userId))
    .map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      username: usernameMap[e.userId] ?? 'Unknown',
      name: nameMap[e.userId] ?? null,
      totalPoints: e.totalPoints,
    }));

  res.json(result);
}
