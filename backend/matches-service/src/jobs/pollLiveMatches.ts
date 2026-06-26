import { pollLiveMatches } from '../services/pollLiveMatches';
import { calculateSchedule } from '../services/matchScheduler';
import logger from '../utils/logger';

let pollingTimer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  try {
    await pollLiveMatches();
  } catch (err) {
    logger.error('pollLiveMatches job error', { error: err });
  }

  try {
    const plan = await calculateSchedule();
    logger.debug('Next poll scheduled', { intervalMs: plan.intervalMs, reason: plan.reason });
    pollingTimer = setTimeout(tick, plan.intervalMs);
  } catch (err) {
    logger.error('Failed to reschedule poll, retrying in 60s', { error: err });
    pollingTimer = setTimeout(tick, 60_000);
  }
}

export function registerPollLiveMatchesJob(): void {
  tick();
  logger.info('Dynamic match polling started');
}

export function stopPollLiveMatchesJob(): void {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
  logger.info('Dynamic match polling stopped');
}
