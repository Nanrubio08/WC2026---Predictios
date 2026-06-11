import prisma from '../prisma';
import { fetchLiveFixtures } from '../utils/apiFootball';
import { triggerScoring } from '../clients/scoringClient';
import logger from '../utils/logger';


const COMPETITION = process.env.FOOTBALL_COMPETITION ?? 'WC';

function isFullTime(status: string): boolean {
  return status === 'FINISHED';
}

export async function pollLiveMatches(): Promise<void> {
  const liveCount = await prisma.match.count({ where: { status: 'live' } });
  if (liveCount === 0) {
    return;
  }

  const liveMatches = await fetchLiveFixtures(COMPETITION);

  for (const match of liveMatches) {
    const stored = await prisma.match.findUnique({ where: { id: match.id } });
    if (!stored || stored.status === 'finished') {
      continue;
    }

    if (isFullTime(match.status) && match.score.fullTime.home !== null && match.score.fullTime.away !== null) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScoreActual: match.score.fullTime.home,
          awayScoreActual: match.score.fullTime.away,
          status: 'finished',
        },
      });

      try {
        await triggerScoring(match.id);
        logger.info(`Scoring triggered for match`, { matchId: match.id });
      } catch (err) {
        logger.error(`Failed to trigger scoring for match`, { matchId: match.id, error: err });
      }
    } else if (['IN_PLAY', 'PAUSED'].includes(match.status)) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'live' },
      });
    }
  }
}
