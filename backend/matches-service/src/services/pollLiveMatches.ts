import prisma from '../prisma';
import { fetchTodaysFixtures } from '../utils/apiFootball';
import { triggerScoring } from '../clients/scoringClient';
import logger from '../utils/logger';


const COMPETITION = process.env.FOOTBALL_COMPETITION ?? 'WC';

function extractScores(match: { score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } }; status: string }) {
  const homeScore = match.score.fullTime.home ?? match.score.halfTime.home;
  const awayScore = match.score.fullTime.away ?? match.score.halfTime.away;
  return { homeScoreActual: homeScore, awayScoreActual: awayScore };
}

function liveStatus(value: string): 'scheduled' | 'live' | 'finished' | undefined {
  if (value === 'FINISHED') return 'finished';
  if (['IN_PLAY', 'PAUSED'].includes(value)) return 'live';
  return undefined;
}

async function processMatch(match: { id: number; status: string; score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } } }): Promise<void> {
  try {
    const stored = await prisma.match.findUnique({ where: { id: match.id } });
    if (!stored) return;

    const wasFinished = stored.status === 'finished';
    const newStatus = liveStatus(match.status);
    const scores = extractScores(match);
    const triggerScoringNow = newStatus === 'finished' && !wasFinished
      && scores.homeScoreActual !== null && scores.awayScoreActual !== null;

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

export async function pollLiveMatches(): Promise<void> {
  const liveOrScheduledCount = await prisma.match.count({
    where: { status: { in: ['live', 'scheduled'] } },
  });
  if (liveOrScheduledCount === 0) {
    return;
  }

  const matches = await fetchTodaysFixtures(COMPETITION);

  for (const match of matches) {
    await processMatch(match);
  }
}
