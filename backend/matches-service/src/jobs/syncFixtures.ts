import cron from 'node-cron';
import { syncFixtures } from '../services/syncFixtures';
import logger from '../utils/logger';

const DAILY_SYNC_CRON = '0 3 * * *';

export function registerSyncFixturesJob(): void {
  cron.schedule(DAILY_SYNC_CRON, async () => {
    logger.info('Starting daily full fixture sync…');
    try {
      const result = await syncFixtures();
      logger.info('Daily full fixture sync done', { upserted: result.upserted });
    } catch (err) {
      logger.error('Daily full fixture sync error', { error: err });
    }
  });

  logger.info('Sync job registered (daily at 03:00 UTC)');
}

export async function runInitialSync(): Promise<void> {
  logger.info('Running initial full fixture sync…');
  try {
    const result = await syncFixtures();
    logger.info('Initial full fixture sync done', { upserted: result.upserted });
  } catch (err) {
    logger.error('Initial full fixture sync error', { error: err });
  }
}
