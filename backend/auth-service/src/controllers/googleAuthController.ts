import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '../generated/client';
import { signToken, generateRefreshToken } from '../utils/jwt';

const prisma = new PrismaClient();
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');
  return new OAuth2Client(clientId);
}

// Derive a unique username from an email address.
// e.g. "john.doe@gmail.com" → "john.doe", and if taken → "john.doe_a1b2"
function usernameFromEmail(email: string): string {
  return email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase();
}

export async function googleAuthController(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential?: string };
  if (!credential) {
    res.status(400).json({ error: 'Missing Google credential' });
    return;
  }

  // Verify the ID token with Google
  let payload: { sub: string; email: string; name?: string; picture?: string };
  try {
    const client = getClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.email || !p?.sub) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }
    payload = { sub: p.sub, email: p.email, name: p.name, picture: p.picture };
  } catch {
    res.status(401).json({ error: 'Failed to verify Google token' });
    return;
  }

  // Find existing user by googleId, then fall back to email
  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (user) {
      // Existing email/password account → link Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }
  }

  if (!user) {
    // New user — derive a unique username
    let base = usernameFromEmail(payload.email);
    let username = base;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      username = `${base}_${Math.random().toString(36).slice(2, 6)}`;
    }

    user = await prisma.user.create({
      data: {
        email: payload.email,
        username,
        name: payload.name ?? username,
        googleId: payload.sub,
        avatarUrl: payload.picture ?? null,
        passwordHash: null,
      },
    });
  }

  const role = user.isAdmin ? 'admin' : 'user';
  const accessToken = signToken({ userId: user.id, username: user.username, role });

  const refreshTokenValue = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { token: refreshTokenValue, userId: user.id, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
  });

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/api/auth',
  });

  res.json({
    token: accessToken,
    user: { id: user.id, username: user.username, email: user.email, role },
  });
}
