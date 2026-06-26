import prisma from '../prisma';
import { fetchLiveFixtures, fetchTodaysFixtures, fetchRecentFixtures, type FDMatch } from '../utils/apiFootball';
import { triggerScoring } from '../clients/scoringClient';
import logger from '../utils/logger';


const COMPETITION = process.env.FOOTBALL_COMPETITION ?? 'WC';

function extractScores(match: { score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } }; status: string }) {
  const isLive = ['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(match.status);
  const homeScore = match.score.fullTime.home ?? (isLive ? match.score.halfTime.home : null);
  const awayScore = match.score.fullTime.away ?? (isLive ? match.score.halfTime.away : null);
  return { homeScoreActual: homeScore, awayScoreActual: awayScore };
}

function liveStatus(value: string): 'scheduled' | 'live' | 'finished' | undefined {
  if (value === 'FINISHED') return 'finished';
  if (['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(value)) return 'live';
  return undefined;
}

async function processMatch(match: { id: number; status: string; minute: number | null; injuryTime: number | null; score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } } }): Promise<void> {
  try {
    const stored = await prisma.match.findUnique({ where: { id: match.id } });
    if (!stored) return;

    const wasFinished = stored.status === 'finished';
    const newStatus = liveStatus(match.status);
    const scores = extractScores(match);
    const triggerScoringNow = newStatus === 'finished' && !wasFinished
      && scores.homeScoreActual !== null && scores.awayScoreActual !== null;

    if (newStatus || scores.homeScoreActual !== stored.homeScoreActual || scores.awayScoreActual !== stored.awayScoreActual || match.minute !== stored.minute || match.injuryTime !== stored.injuryTime) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          ...(newStatus ? { status: newStatus } : {}),
          homeScoreActual: scores.homeScoreActual,
          awayScoreActual: scores.awayScoreActual,
          minute: match.minute ?? null,
          injuryTime: match.injuryTime ?? null,
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

  let liveFixtures: FDMatch[] = [];
  let todaysFixtures: FDMatch[] = [];
  let recentFixtures: FDMatch[] = [];

  try {
    liveFixtures = await fetchLiveFixtures(COMPETITION);
  } catch (err) {
    logger.error('pollLiveMatches: failed to fetch live fixtures', { error: err });
  }

  try {
    todaysFixtures = await fetchTodaysFixtures(COMPETITION);
  } catch (err) {
    logger.error('pollLiveMatches: failed to fetch today fixtures', { error: err });
  }

  try {
    recentFixtures = await fetchRecentFixtures(COMPETITION, 3);
  } catch (err) {
    logger.error('pollLiveMatches: failed to fetch recent fixtures', { error: err });
  }

  const seen = new Set<number>();
  const allMatches = [...liveFixtures, ...todaysFixtures, ...recentFixtures];

  // If both fetches failed, try to process any match that is still in 'live' status in DB
  // by fetching them from the season fixtures
  if (allMatches.length === 0) {
    logger.warn('pollLiveMatches: no fixtures from API, cannot update live matches');
    return;
  }

  for (const match of allMatches) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    await processMatch(match);
  }
}
