import axios from 'axios';

const MATCHES_URL = process.env.MATCHES_SERVICE_URL ?? 'http://localhost:3002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

if (!INTERNAL_TOKEN) {
  console.warn('[matchesClient] INTERNAL_SERVICE_TOKEN is not set — internal calls will fail');
}

export interface MatchInfo {
  id: number;
  kickoffTime: string;
  status: string;
}

export async function getMatch(matchId: number): Promise<MatchInfo> {
  const res = await axios.get<MatchInfo>(`${MATCHES_URL}/internal/matches/${matchId}`, {
    headers: { 'x-internal-token': INTERNAL_TOKEN ?? '' },
    timeout: 5000,
  });
  return res.data;
}
