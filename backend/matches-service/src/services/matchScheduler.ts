import prisma from '../prisma';

export interface PollPlan {
  intervalMs: number;
  fetchLive: boolean;
  fetchToday: boolean;
  reason: string;
}

const ONE_MIN = 60_000;
const FIVE_MIN = 300_000;
const ONE_HOUR = 3_600_000;
const SIX_HOURS = 21_600_000;

export async function calculateSchedule(): Promise<PollPlan> {
  const matches = await prisma.match.findMany({
    where: { status: { in: ['live', 'scheduled'] } },
    select: { status: true, kickoffTime: true },
    orderBy: { kickoffTime: 'asc' },
  });

  const now = Date.now();
  const liveCount = matches.filter((m) => m.status === 'live').length;
  const scheduled = matches.filter((m) => m.status === 'scheduled');
  const nextKickoff = scheduled.length > 0
    ? Math.min(...scheduled.map((m) => m.kickoffTime.getTime()))
    : Infinity;
  const timeUntilNext = nextKickoff - now;

  if (liveCount > 0) {
    return { intervalMs: ONE_MIN, fetchLive: true, fetchToday: true, reason: 'live matches' };
  }

  if (timeUntilNext <= 15 * ONE_MIN) {
    return { intervalMs: ONE_MIN, fetchLive: true, fetchToday: true, reason: 'match imminent' };
  }

  if (timeUntilNext <= 2 * ONE_HOUR) {
    return { intervalMs: FIVE_MIN, fetchLive: false, fetchToday: true, reason: 'match approaching' };
  }

  if (nextKickoff < Infinity) {
    return { intervalMs: ONE_HOUR, fetchLive: false, fetchToday: true, reason: 'matches later today or tomorrow' };
  }

  return { intervalMs: SIX_HOURS, fetchLive: false, fetchToday: true, reason: 'no matches scheduled' };
}
