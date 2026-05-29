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
  stage: string | null;
  group: string | null;
  matchday: number | null;
  userPrediction?: { homeScorePredicted: number; awayScorePredicted: number } | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string | null;
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

export interface MyPrediction {
  matchId: number;
  homeScorePredicted: number;
  awayScorePredicted: number;
  pointsEarned: number;
  match: {
    homeTeam: string;
    awayTeam: string;
    homeLogoUrl: string | null;
    awayLogoUrl: string | null;
    kickoffTime: string;
    homeScoreActual: number | null;
    awayScoreActual: number | null;
    status: string;
    stage: string | null;
    group: string | null;
  } | null;
}

export interface BonusAnswer {
  question: string;
  answer: string | null;
  points: number;
  tournamentWinner: string | null;
}

export interface AuditLog {
  id:           string;
  adminUserId:  string;
  service:      string;
  action:       string;
  matchId:      number | null;
  previousHome: number | null;
  previousAway: number | null;
  newHome:      number | null;
  newAway:      number | null;
  detail:       string | null;
  createdAt:    string;
}

export interface AdminPrediction {
  id:                 string;
  userId:             string;
  username:           string;
  name:               string | null;
  matchId:            number;
  homeScorePredicted: number;
  awayScorePredicted: number;
  pointsEarned:       number;
  updatedAt:          string;
}

