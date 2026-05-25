import cron from 'node-cron';
import { syncFixtures } from '../services/syncFixtures';

export function registerSyncFixturesJob(): void {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[syncFixtures] Starting fixture sync…');
    try {
      const result = await syncFixtures();
      console.log(`[syncFixtures] Done — upserted ${result.upserted} fixtures`);
    } catch (err) {
      console.error('[syncFixtures] Error:', err);
    }
  });

  console.log('[syncFixtures] Sync job registered (every 6 h: 00:00, 06:00, 12:00, 18:00 UTC)');
}
