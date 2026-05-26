import axios from 'axios';
import type { Match, LeaderboardEntry, User, MyPrediction, BonusAnswer, AuditLog } from '../types';

const api = axios.create({ baseURL: '', withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh access token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/refresh')) {
      original._retry = true;
      try {
        const { data } = await axios.post<{ token: string }>('/api/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('token', data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export async function fetchMatches(): Promise<Match[]> {
  const res = await api.get<Match[]>('/api/matches');
  return res.data;
}

export async function registerUser(data: { name: string; username: string; email: string; password: string }): Promise<{ token: string; user: User }> {
  const res = await api.post<{ token: string; user: User }>('/api/auth/register', data);
  return res.data;
}

export async function loginUser(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
  const res = await api.post<{ token: string; user: User }>('/api/auth/login', data);
  return res.data;
}

export async function logoutUser(): Promise<void> {
  await api.post('/api/auth/logout');
}

export async function submitPrediction(data: { matchId: number; homeScorePredicted: number; awayScorePredicted: number }) {
  const res = await api.post('/api/predictions', data);
  return res.data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await api.get<LeaderboardEntry[]>('/api/leaderboard');
  return res.data;
}

export async function getProfile(): Promise<User> {
  const res = await api.get<User>('/api/auth/profile');
  return res.data;
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  favoriteTeam?: string;
}): Promise<User> {
  const res = await api.put<User>('/api/auth/profile', data);
  return res.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.put('/api/auth/profile/password', data);
}

export async function uploadAvatar(avatar: string): Promise<{ avatarUrl: string }> {
  const res = await api.put<{ avatarUrl: string }>('/api/auth/profile/avatar', { avatar });
  return res.data;
}

// My Predictions
export async function fetchMyPredictions(): Promise<MyPrediction[]> {
  const res = await api.get<MyPrediction[]>('/api/predictions/my');
  return res.data;
}

// Bonus / Golden Ball
export async function fetchMyBonusAnswer(): Promise<BonusAnswer> {
  const res = await api.get<BonusAnswer>('/api/bonus/answer');
  return res.data;
}

export async function submitBonusAnswer(answer: string): Promise<BonusAnswer> {
  const res = await api.post<BonusAnswer>('/api/bonus/answer', { answer });
  return res.data;
}

// Admin
export async function adminFetchMatches(): Promise<Match[]> {
  const res = await api.get<Match[]>('/api/admin/matches');
  return res.data;
}

export async function adminUpdateScore(matchId: number, homeScoreActual: number, awayScoreActual: number): Promise<Match> {
  const res = await api.post<Match>(`/api/admin/matches/${matchId}/score`, { homeScoreActual, awayScoreActual });
  return res.data;
}

export async function adminFetchAuditLogs(): Promise<AuditLog[]> {
  const res = await api.get<AuditLog[]>('/api/admin/matches/audit');
  return res.data;
}

export function adminLeaderboardExportUrl(): string {
  return '/api/admin/leaderboard/export';
}

export async function adminGetBonusConfig(): Promise<{ winner: string | null; declaredAt: string | null }> {
  const res = await api.get('/api/admin/bonus/config');
  return res.data;
}

export async function adminDeclareWinner(winner: string): Promise<{ winner: string; scored: number; message: string }> {
  const res = await api.post('/api/admin/bonus/winner', { winner });
  return res.data;
}
