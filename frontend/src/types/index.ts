export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  kickoffTime: string;
  homeScoreActual: number | null;
  awayScoreActual: number | null;
  status: 'scheduled' | 'live' | 'finished';
  userPrediction?: { homeScorePredicted: number; awayScorePredicted: number } | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  name?: string;
  phone?: string;
  favoriteTeam?: string;
  avatarUrl?: string | null;
}
