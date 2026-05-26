import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { listLeaderboard } from '../services/listLeaderboard';
import { getUsersByIds } from '../clients/authClient';

const router = Router();

router.get('/export', requireAdmin, async (_req, res) => {
  try {
    const entries = await listLeaderboard();
    const userIds = entries.map((e) => e.userId);
    let usernameMap: Record<string, string> = {};

    try {
      if (userIds.length > 0) {
        const users = await getUsersByIds(userIds);
        usernameMap = Object.fromEntries(users.map((u) => [u.id, u.username]));
      }
    } catch (err) {
      console.error('Failed to fetch usernames for CSV export', err);
    }

    const rows = entries.map((e) => ({
      rank: e.rank,
      username: usernameMap[e.userId] ?? 'Unknown',
      userId: e.userId,
      totalPoints: e.totalPoints,
    }));

    const csv = [
      'Rank,Username,User ID,Total Points',
      ...rows.map((r) => `${r.rank},"${r.username}","${r.userId}",${r.totalPoints}`),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leaderboard.csv"');
    res.send(csv);
  } catch (err) {
    console.error('leaderboard export error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
