import axios from 'axios';
import type { Match, LeaderboardEntry, User, MyPrediction, BonusAnswer, AuditLog, AdminPrediction } from '../types';

export const api = axios.create({ baseURL: '', withCredentials: true });

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

export async function registerUser(data: { name: string; username: string; email: string; password: string; code: string }): Promise<{ token: string; user: User }> {
  const res = await api.post<{ token: string; user: User }>('/api/auth/register', data);
  return res.data;
}

export async function loginUser(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
  const res = await api.post<{ token: string; user: User }>('/api/auth/login', data);
  return res.data;
}

export async function googleAuth(credential: string, code?: string): Promise<{ token: string; user: User }> {
  const res = await api.post<{ token: string; user: User }>('/api/auth/google', { credential, code });
  return res.data;
}

export async function logoutUser(): Promise<void> {
  await api.post('/api/auth/logout');
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/api/auth/reset-password', { token, newPassword });
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

// Any user's finished-match predictions (visible to all authenticated users)
export async function fetchUserPredictions(userId: string): Promise<MyPrediction[]> {
  const res = await api.get<MyPrediction[]>(`/api/predictions/user/${userId}`);
  return res.data;
}


// Bonus / Golden Ball
export async function fetchUserBonusAnswer(userId: string): Promise<{ answer: string | null }> {
  const res = await api.get(`/api/bonus/answer/${userId}`);
  return res.data;
}

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

export async function adminExportLeaderboardCsv(): Promise<void> {
  const res = await api.get('/api/admin/leaderboard/export', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leaderboard.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function adminGetBonusConfig(): Promise<{ winner: string | null; declaredAt: string | null }> {
  const res = await api.get('/api/admin/bonus/config');
  return res.data;
}

export async function adminDeclareWinner(winner: string): Promise<{ winner: string; scored: number; message: string }> {
  const res = await api.post('/api/admin/bonus/winner', { winner });
  return res.data;
}

export async function adminFetchUsers(): Promise<{ id: string; username: string; name: string | null; email: string; phone: string | null; isAdmin: boolean; createdAt: string }[]> {
  const res = await api.get('/api/admin/users');
  return Array.isArray(res.data) ? res.data : [];
}

export async function adminUpdateUser(
  userId: string,
  data: { username?: string; name?: string | null; email?: string; isAdmin?: boolean },
): Promise<void> {
  await api.patch(`/api/admin/users/${userId}`, data);
}

export async function adminDeleteUser(userId: string): Promise<void> {
  await api.delete(`/api/admin/users/${userId}`);
}

export async function adminFetchAllPredictions(): Promise<AdminPrediction[]> {
  const res = await api.get<AdminPrediction[]>('/api/admin/predictions/all');
  return Array.isArray(res.data) ? res.data : [];
}

export interface AdminPredictionDetail {
  id: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  kickoffTime: string | null;
  matchStatus: string | null;
  homeScoreActual: number | null;
  awayScoreActual: number | null;
  homeScorePredicted: number;
  awayScorePredicted: number;
  pointsEarned: number;
  updatedAt: string;
}

export interface AdminUserPredictionSummary {
  userId: string;
  username: string;
  name: string | null;
  email: string;
  totalPredictions: number;
  predictions: AdminPredictionDetail[];
}

export async function adminFetchPredictionsByUser(): Promise<AdminUserPredictionSummary[]> {
  const res = await api.get<AdminUserPredictionSummary[]>('/api/admin/predictions/by-user');
  return Array.isArray(res.data) ? res.data : [];
}

export interface AdminBonusAnswer {
  userId: string;
  username: string;
  name: string | null;
  email: string;
  answer: string | null;
  points: number;
  submittedAt: string | null;
}

export async function adminFetchBonusAnswers(): Promise<AdminBonusAnswer[]> {
  const res = await api.get<AdminBonusAnswer[]>('/api/admin/bonus/answers');
  return Array.isArray(res.data) ? res.data : [];
}


export async function adminRemoveFromLeaderboard(userId: string): Promise<void> {
  await api.delete(`/api/admin/leaderboard/${userId}`);
}


export type InviteCodeRow = { code: string; status: 'used' | 'available'; username: string | null; email: string | null; usedAt: string | null; createdAt: string };

export async function adminFetchInviteCodes(): Promise<InviteCodeRow[]> {
  const res = await api.get<InviteCodeRow[]>('/api/admin/invite-codes');
  return Array.isArray(res.data) ? res.data : [];
}

export async function adminGenerateCodes(count: number): Promise<{ generated: number; codes: string[] }> {
  const res = await api.post('/api/admin/invite-codes/generate', { count });
  return res.data;
}

export async function adminExportInviteCodesCsv(): Promise<void> {
  const res = await api.get('/api/admin/invite-codes/export', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invite-codes.csv';
  a.click();
  URL.revokeObjectURL(url);
}
