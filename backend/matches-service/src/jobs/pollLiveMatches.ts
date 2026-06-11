import cron from 'node-cron';
import { pollLiveMatches } from '../services/pollLiveMatches';
import logger from '../utils/logger';

export function registerPollLiveMatchesJob(): void {
  cron.schedule('* * * * *', async () => {
    try {
      await pollLiveMatches();
    } catch (err) {
      logger.error('pollLiveMatches job error', { error: err });
    }
  });

  logger.info('Live poll job registered (every 1 min)');
}
