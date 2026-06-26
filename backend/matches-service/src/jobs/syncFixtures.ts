import cron from 'node-cron';
import { syncFixtures } from '../services/syncFixtures';
import logger from '../utils/logger';

export function registerSyncFixturesJob(): void {
  // Full sync every 10 min — catches TBD matches, metadata changes, & recovers state.
  // Live scores & finished transitions are handled by pollLiveMatches (every 1 min).
  // Initial sync also runs on startup via the first cron tick.
  cron.schedule('*/10 * * * *', async () => {
    logger.info('Starting full fixture sync…');
    try {
      const result = await syncFixtures();
      logger.info(`Full fixture sync done`, { upserted: result.upserted });
    } catch (err) {
      logger.error('Full fixture sync error', { error: err });
    }
  });

  logger.info('Sync job registered (every 10 min)');
}
