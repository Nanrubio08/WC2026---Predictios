import cron from 'node-cron';
import { syncFixtures } from '../services/syncFixtures';
import logger from '../utils/logger';

export function registerSyncFixturesJob(): void {
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Starting fixture sync…');
    try {
      const result = await syncFixtures();
      logger.info(`Fixture sync done`, { upserted: result.upserted });
    } catch (err) {
      logger.error('Fixture sync error', { error: err });
    }
  });

  logger.info('Sync job registered (every 6 h: 00:00, 06:00, 12:00, 18:00 UTC)');
}
