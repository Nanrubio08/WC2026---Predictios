import prisma from '../prisma';
import { fetchLiveFixtures } from '../utils/apiFootball';
import { triggerScoring } from '../clients/scoringClient';
import logger from '../utils/logger';


const COMPETITION = process.env.FOOTBALL_COMPETITION ?? 'WC';

function extractScores(match: { score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } }; status: string }) {
  const homeScore = match.score.fullTime.home ?? match.score.halfTime.home;
  const awayScore = match.score.fullTime.away ?? match.score.halfTime.away;
  return { homeScoreActual: homeScore, awayScoreActual: awayScore };
}

export async function pollLiveMatches(): Promise<void> {
  const liveOrScheduledCount = await prisma.match.count({
    where: { status: { in: ['live', 'scheduled'] } },
  });
  if (liveOrScheduledCount === 0) {
    return;
  }

  const liveMatches = await fetchLiveFixtures(COMPETITION);

  for (const match of liveMatches) {
    try {
      const stored = await prisma.match.findUnique({ where: { id: match.id } });
      if (!stored) continue;

      const wasFinished = stored.status === 'finished';
      const fromApi = match.status;
      const scores = extractScores(match);

      let newStatus: 'scheduled' | 'live' | 'finished' | undefined;
      let triggerScoringNow = false;

      if (fromApi === 'FINISHED') {
        if (!wasFinished) {
          newStatus = 'finished';
          triggerScoringNow = scores.homeScoreActual !== null && scores.awayScoreActual !== null;
        }
      } else if (['IN_PLAY', 'PAUSED'].includes(fromApi)) {
        newStatus = 'live';
      }

      if (newStatus || scores.homeScoreActual !== stored.homeScoreActual || scores.awayScoreActual !== stored.awayScoreActual) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            ...(newStatus ? { status: newStatus } : {}),
            homeScoreActual: scores.homeScoreActual,
            awayScoreActual: scores.awayScoreActual,
          },
        });
        logger.info('Match updated via poll', { matchId: match.id, status: newStatus, scores });
      }

      if (triggerScoringNow) {
        try {
          await triggerScoring(match.id);
          logger.info('Scoring triggered by pollLiveMatches', { matchId: match.id });
        } catch (err) {
          logger.error('Failed to trigger scoring from pollLiveMatches', { matchId: match.id, error: err });
        }
      }
    } catch (err) {
      logger.error('pollLiveMatches: error processing match', { matchId: match.id, error: err });
    }
  }
}
