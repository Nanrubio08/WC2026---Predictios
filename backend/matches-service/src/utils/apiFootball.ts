import axios, { AxiosError } from 'axios';

const BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? '';

if (!API_KEY) {
  console.warn('[footballData] WARNING: FOOTBALL_DATA_API_KEY is not set — fixture sync will fail');
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Auth-Token': API_KEY,
  },
  timeout: 30000,
});

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  minute: number | null;
  injuryTime: number | null;
  homeTeam: {
    id: number;
    name: string;
    crest: string | null;
  };
  awayTeam: {
    id: number;
    name: string;
    crest: string | null;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      console.warn(`[footballData] API error (attempt ${attempt}/${retries}), retrying in ${delay}ms:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

export async function fetchFixtures(competition: string, season: number): Promise<FDMatch[]> {
  const res = await withRetry(() =>
    client.get<{ matches: FDMatch[] }>(
      `/competitions/${competition}/matches`,
      { params: { season } },
    )
  );
  return res.data.matches;
}

export async function fetchLiveFixtures(competition: string): Promise<FDMatch[]> {
  const res = await withRetry(() =>
    client.get<{ matches: FDMatch[] }>(
      `/competitions/${competition}/matches`,
      { params: { status: 'IN_PLAY,PAUSED' } },
    )
  );
  return res.data.matches;
}

export async function fetchTodaysFixtures(competition: string): Promise<FDMatch[]> {
  const today = new Date().toISOString().split('T')[0];
  const res = await withRetry(() =>
    client.get<{ matches: FDMatch[] }>(
      `/competitions/${competition}/matches`,
      { params: { dateFrom: today, dateTo: today } },
    )
  );
  return res.data.matches;
}
