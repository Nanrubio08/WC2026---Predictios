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
    const data = buildMatchData(match);
    const newStatus = data.status;

    // Read current DB state before upserting to detect state transitions
    const existing = await prisma.match.findUnique({ where: { id: match.id } });
    const wasNotFinished = !existing || existing.status !== 'finished';
    const wasFinishedWithNullScores =
      existing?.status === 'finished' &&
      (existing.homeScoreActual === null || existing.awayScoreActual === null);

    const isAlreadyFinished = existing?.status === 'finished';

    // If the match is already finished with scores set (by API or admin), NEVER overwrite those
    // scores via automated sync — only the admin endpoint may change them.
    const preserveExistingScores =
      isAlreadyFinished &&
      existing.homeScoreActual !== null &&
      existing.awayScoreActual !== null;

    const updateData = {
      ...data,
      // Never revert a finished match back to live/scheduled via automated sync
      status: isAlreadyFinished ? ('finished' as const) : data.status,
      homeScoreActual: preserveExistingScores
        ? existing.homeScoreActual
        : (data.homeScoreActual ?? existing?.homeScoreActual ?? null),
      awayScoreActual: preserveExistingScores
        ? existing.awayScoreActual
        : (data.awayScoreActual ?? existing?.awayScoreActual ?? null),
    };
    const finalHasScores =
      updateData.homeScoreActual !== null && updateData.awayScoreActual !== null;

    await prisma.match.upsert({
      where: { id: match.id },
      update: updateData,
      create: { id: match.id, ...data },
    });
    upserted++;

    // Trigger scoring when:
    // (a) match just transitioned to finished with scores, OR
    // (b) match was already finished but had null scores and now has scores
    const shouldScore = newStatus === 'finished' && finalHasScores &&
      (wasNotFinished || wasFinishedWithNullScores);

    if (shouldScore) {
      try {
        await triggerScoring(match.id);
        logger.info('Scoring triggered by syncFixtures', { matchId: match.id, wasFinishedWithNullScores });
      } catch (err) {
        logger.error('Failed to trigger scoring', { matchId: match.id, error: err });
      }
    }
  }

  return { upserted };
}

function buildMatchData(match: FDMatch) {
  const status = mapStatus(match.status);
  // For live matches use halfTime scores if fullTime not yet available
  const homeScore = match.score.fullTime.home ??
    (status === 'live' ? match.score.halfTime.home : null);
  const awayScore = match.score.fullTime.away ??
    (status === 'live' ? match.score.halfTime.away : null);

  return {
    homeTeam: match.homeTeam.name ?? 'Por definir',
    awayTeam: match.awayTeam.name ?? 'Por definir',
    homeLogoUrl: match.homeTeam.crest ?? null,
    awayLogoUrl: match.awayTeam.crest ?? null,
    kickoffTime: new Date(match.utcDate),
    status,
    homeScoreActual: homeScore,
    awayScoreActual: awayScore,
    stage: match.stage ?? null,
    group: match.group ?? null,
    matchday: match.matchday ?? null,
  };
}
