import axios from 'axios';

const PREDICTIONS_URL = process.env.PREDICTIONS_SERVICE_URL ?? 'http://localhost:3003';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

export interface UserPrediction {
  matchId: number;
  homeScorePredicted: number;
  awayScorePredicted: number;
  pointsEarned: number;
}

export async function getUserPredictions(userId: string): Promise<UserPrediction[]> {
  const res = await axios.get<UserPrediction[]>(
    `${PREDICTIONS_URL}/internal/predictions/summary`,
    {
      params: { userId },
      headers: { 'x-internal-token': INTERNAL_TOKEN },
      timeout: 5000,
    }
  );
  return res.data;
}
