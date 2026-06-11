import prisma from '../prisma';
import { fetchLiveFixtures } from '../utils/apiFootball';
import logger from '../utils/logger';


const COMPETITION = process.env.FOOTBALL_COMPETITION ?? 'WC';

export async function pollLiveMatches(): Promise<void> {
  const liveCount = await prisma.match.count({ where: { status: 'live' } });
  if (liveCount === 0) {
    return;
  }

  // fetchLiveFixtures only returns IN_PLAY/PAUSED — use this to mark matches as live quickly.
  // Finished transitions (live → finished + scoring) are handled by syncFixtures.
  const liveMatches = await fetchLiveFixtures(COMPETITION);

  for (const match of liveMatches) {
    const stored = await prisma.match.findUnique({ where: { id: match.id } });
    if (!stored || stored.status === 'finished') {
      continue;
    }

    if (['IN_PLAY', 'PAUSED'].includes(match.status)) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'live' },
      });
      logger.debug('Match status updated to live', { matchId: match.id });
    }
  }
}
