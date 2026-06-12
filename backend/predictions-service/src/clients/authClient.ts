import axios from 'axios';

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

export interface UserInfo {
  id: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
}

export interface UserInfoFull {
  id: string;
  username: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export async function getUsersByIds(userIds: string[]): Promise<UserInfo[]> {
  if (!userIds.length) return [];
  const res = await axios.post<UserInfo[]>(
    `${AUTH_URL}/internal/users/batch`,
    { userIds },
    {
      headers: { 'x-internal-token': INTERNAL_TOKEN },
      timeout: 5000,
    }
  );
  return res.data;
}

export async function getAllUsers(): Promise<UserInfoFull[]> {
  const res = await axios.get<UserInfoFull[]>(
    `${AUTH_URL}/internal/users/all`,
    {
      headers: { 'x-internal-token': INTERNAL_TOKEN },
      timeout: 10000,
    }
  );
  return res.data;
}
