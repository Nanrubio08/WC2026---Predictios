import axios from 'axios';

const PREDICTIONS_URL = process.env.PREDICTIONS_SERVICE_URL ?? 'http://localhost:3003';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

export async function provisionUserLeaderboard(userId: string): Promise<void> {
  await axios.post(
    `${PREDICTIONS_URL}/internal/users`,
    { userId },
    {
      headers: {
        'x-internal-token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }
  );
}
