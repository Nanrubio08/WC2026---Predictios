import { PrismaClient } from '../generated/client';
import { fetchFixtures, FDMatch } from '../utils/apiFootball';

const prisma = new PrismaClient();

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
    await prisma.match.upsert({
      where: { id: match.id },
      update: data,
      create: { id: match.id, ...data },
    });
    upserted++;
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
