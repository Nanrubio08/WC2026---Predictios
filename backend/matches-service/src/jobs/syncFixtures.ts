import cron from 'node-cron';
import { syncFixtures } from '../services/syncFixtures';
import logger from '../utils/logger';

export function registerSyncFixturesJob(): void {
  cron.schedule('*/2 * * * *', async () => {
    logger.info('Starting fixture sync…');
    try {
      const result = await syncFixtures();
      logger.info(`Fixture sync done`, { upserted: result.upserted });
    } catch (err) {
      logger.error('Fixture sync error', { error: err });
    }
  });

  logger.info('Sync job registered (every 2 min)');
}
