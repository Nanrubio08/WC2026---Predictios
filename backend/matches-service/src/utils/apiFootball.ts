import axios from 'axios';

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
  timeout: 15000,
});

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
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
  };
}

export async function fetchFixtures(competition: string, season: number): Promise<FDMatch[]> {
  const res = await client.get<{ matches: FDMatch[] }>(
    `/competitions/${competition}/matches`,
    { params: { season } },
  );
  return res.data.matches;
}

export async function fetchLiveFixtures(competition: string): Promise<FDMatch[]> {
  const res = await client.get<{ matches: FDMatch[] }>(
    `/competitions/${competition}/matches`,
    { params: { status: 'IN_PLAY,PAUSED' } },
  );
  return res.data.matches;
}
