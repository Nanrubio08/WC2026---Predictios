import prisma from '../prisma';
import { fetchFixtures, FDMatch } from '../utils/apiFootball';
import { triggerScoring } from '../clients/scoringClient';
import logger from '../utils/logger';


const COMPETITION = process.env.FOOTBALL_COMPETITION ?? 'WC';
const SEASON = parseInt(process.env.FOOTBALL_SEASON ?? '2026', 10);

type MatchStatusValue = 'scheduled' | 'live' | 'finished';

function mapStatus(status: string): MatchStatusValue {
  if (['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(status)) return 'live';
  if (status === 'FINISHED') return 'finished';
  return 'scheduled';
}

export async function syncFixtures(): Promise<{ upserted: number }> {
  const matches = await fetchFixtures(COMPETITION, SEASON);
  let upserted = 0;

  for (const match of matches) {
    // Skip matches where teams aren't determined yet (knockout stage TBDs)
    if (!match.homeTeam.name || !match.awayTeam.name) {
      continue;
    }

    const data = buildMatchData(match);
    const newStatus = data.status;
    const hasScores = data.homeScoreActual !== null && data.awayScoreActual !== null;

    // Read current DB state before upserting to detect finished transition
    const existing = await prisma.match.findUnique({ where: { id: match.id } });
    const wasNotFinished = !existing || existing.status !== 'finished';

    await prisma.match.upsert({
      where: { id: match.id },
      update: data,
      create: { id: match.id, ...data },
    });
    upserted++;

    // Trigger scoring exactly once when a match transitions to finished
    if (wasNotFinished && newStatus === 'finished' && hasScores) {
      try {
        await triggerScoring(match.id);
        logger.info('Scoring triggered by syncFixtures', { matchId: match.id });
      } catch (err) {
        logger.error('Failed to trigger scoring', { matchId: match.id, error: err });
      }
    }
  }

  return { upserted };
}

function buildMatchData(match: FDMatch) {
  return {
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    homeLogoUrl: match.homeTeam.crest ?? null,
    awayLogoUrl: match.awayTeam.crest ?? null,
    kickoffTime: new Date(match.utcDate),
    status: mapStatus(match.status),
    homeScoreActual: match.score.fullTime.home,
    awayScoreActual: match.score.fullTime.away,
    stage: match.stage ?? null,
    group: match.group ?? null,
    matchday: match.matchday ?? null,
  };
}
