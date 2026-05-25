import axios from 'axios';

const PREDICTIONS_URL = process.env.PREDICTIONS_SERVICE_URL ?? 'http://localhost:3003';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

export async function triggerScoring(matchId: number): Promise<void> {
  await axios.post(
    `${PREDICTIONS_URL}/internal/scoring/${matchId}`,
    {},
    {
      headers: { 'x-internal-token': INTERNAL_TOKEN },
      timeout: 30000,
    }
  );
}
