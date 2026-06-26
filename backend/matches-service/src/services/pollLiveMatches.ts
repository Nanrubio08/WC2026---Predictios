import prisma from '../prisma';
import { fetchLiveFixtures, fetchTodaysFixtures, type FDMatch } from '../utils/apiFootball';
import { triggerScoring } from '../clients/scoringClient';
import { calculateSchedule } from './matchScheduler';
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

function mapStatus(value: string): 'scheduled' | 'live' | 'finished' {
  if (['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(value)) return 'live';
  if (value === 'FINISHED') return 'finished';
  return 'scheduled';
}

async function upsertMatch(match: FDMatch): Promise<void> {
  const status = mapStatus(match.status);
  const isLive = ['IN_PLAY', 'PAUSED', 'SUSPENDED'].includes(match.status);
  const homeScore = match.score.fullTime.home ?? (isLive ? match.score.halfTime.home : null);
  const awayScore = match.score.fullTime.away ?? (isLive ? match.score.halfTime.away : null);

  await prisma.match.upsert({
    where: { id: match.id },
    update: {
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
    },
    create: {
      id: match.id,
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
    },
  });

  const isNowFinished = status === 'finished' && homeScore !== null && awayScore !== null;
  if (isNowFinished) {
    try {
      await triggerScoring(match.id);
      logger.info('Scoring triggered by upsert in pollLiveMatches', { matchId: match.id });
    } catch (err) {
      logger.error('Failed to trigger scoring from pollLiveMatches upsert', { matchId: match.id, error: err });
    }
  }
}

async function processMatch(match: FDMatch): Promise<boolean> {
  try {
    const stored = await prisma.match.findUnique({ where: { id: match.id } });
    if (!stored) return false;

    const isAlreadyFinished = stored.status === 'finished';
    const preserveScores = isAlreadyFinished &&
      stored.homeScoreActual !== null && stored.awayScoreActual !== null;

    const newStatus = liveStatus(match.status);
    const kickoffTime = new Date(match.utcDate).getTime();
    const kickoffPassed = Date.now() - kickoffTime;
    // Time-based fallback: if kickoff passed 15+ min ago but API still shows
    // SCHEDULED/TIMED (not IN_PLAY or FINISHED), assume it's live.
    // This handles API delays in updating match status.
    const effectiveStatus = newStatus ?? (
      stored.status === 'scheduled' && kickoffPassed > 15 * 60_000
        ? 'live'
        : undefined
    );
    const scores = extractScores(match);
    const triggerScoringNow = newStatus === 'finished' && !isAlreadyFinished
      && scores.homeScoreActual !== null && scores.awayScoreActual !== null;

    const safeStatus = isAlreadyFinished ? 'finished' as const :
      stored.status === 'live' && effectiveStatus !== 'live' ? 'live' as const :
      effectiveStatus;

    const safeHomeScore = preserveScores ? stored.homeScoreActual : scores.homeScoreActual;
    const safeAwayScore = preserveScores ? stored.awayScoreActual : scores.awayScoreActual;

    const changes: Record<string, unknown> = {};

    if (safeStatus) changes.status = safeStatus;

    if (!preserveScores) {
      if (safeHomeScore !== stored.homeScoreActual) changes.homeScoreActual = safeHomeScore;
      if (safeAwayScore !== stored.awayScoreActual) changes.awayScoreActual = safeAwayScore;
    }

    if (match.minute !== stored.minute) changes.minute = match.minute ?? null;
    if (match.injuryTime !== stored.injuryTime) changes.injuryTime = match.injuryTime ?? null;

    const apiHomeTeam = match.homeTeam.name ?? 'Por definir';
    const apiAwayTeam = match.awayTeam.name ?? 'Por definir';
    const apiHomeLogo = match.homeTeam.crest ?? null;
    const apiAwayLogo = match.awayTeam.crest ?? null;

    if (apiHomeTeam !== stored.homeTeam) changes.homeTeam = apiHomeTeam;
    if (apiAwayTeam !== stored.awayTeam) changes.awayTeam = apiAwayTeam;
    if (apiHomeLogo !== stored.homeLogoUrl) changes.homeLogoUrl = apiHomeLogo;
    if (apiAwayLogo !== stored.awayLogoUrl) changes.awayLogoUrl = apiAwayLogo;
    if (match.stage !== null && match.stage !== stored.stage) changes.stage = match.stage;
    if (match.group !== null && match.group !== stored.group) changes.group = match.group;
    if (match.matchday !== null && match.matchday !== stored.matchday) changes.matchday = match.matchday;

    const newKickoff = new Date(match.utcDate);
    if (newKickoff.getTime() !== stored.kickoffTime.getTime()) changes.kickoffTime = newKickoff;

    if (Object.keys(changes).length > 0) {
      await prisma.match.update({ where: { id: match.id }, data: changes });
      logger.info('Match updated via poll', { matchId: match.id, changes: Object.keys(changes) });
    }

    if (triggerScoringNow) {
      try {
        await triggerScoring(match.id);
        logger.info('Scoring triggered by pollLiveMatches', { matchId: match.id });
      } catch (err) {
        logger.error('Failed to trigger scoring from pollLiveMatches', { matchId: match.id, error: err });
      }
      return true;
    }
  } catch (err) {
    logger.error('pollLiveMatches: error processing match', { matchId: match.id, error: err });
  }
  return false;
}

export async function pollLiveMatches(): Promise<void> {
  const plan = await calculateSchedule();

  let allMatches: FDMatch[] = [];

  if (plan.fetchLive) {
    try {
      allMatches = await fetchLiveFixtures(COMPETITION);
    } catch (err) {
      logger.error('pollLiveMatches: failed to fetch live fixtures', { error: err });
    }
  }

  if (plan.fetchToday) {
    try {
      const today = await fetchTodaysFixtures(COMPETITION);
      const seen = new Set(allMatches.map((m) => m.id));
      for (const m of today) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);

        const stored = await prisma.match.findUnique({ where: { id: m.id } });
        if (stored) {
          allMatches.push(m);
        } else {
          await upsertMatch(m);
        }
      }
    } catch (err) {
      logger.error('pollLiveMatches: failed to fetch today fixtures', { error: err });
    }
  }

  if (allMatches.length === 0) {
    logger.debug('pollLiveMatches: no data to fetch per schedule', { reason: plan.reason });
    return;
  }

  for (const match of allMatches) {
    await processMatch(match);
  }
}
