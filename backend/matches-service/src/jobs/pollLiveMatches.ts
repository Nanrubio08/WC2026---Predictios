import cron from 'node-cron';
import { pollLiveMatches } from '../services/pollLiveMatches';

export function registerPollLiveMatchesJob(): void {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await pollLiveMatches();
    } catch (err) {
      console.error('[pollLiveMatches] Error:', err);
    }
  });

  console.log('[pollLiveMatches] Live poll job registered (every 5 min)');
}
