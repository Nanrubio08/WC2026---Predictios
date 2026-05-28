import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../prisma';
import { signToken, generateRefreshToken } from '../utils/jwt';
import { provisionUserLeaderboard } from '../clients/predictionsClient';
import { claimInviteCode } from '../utils/inviteCodes';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');
  return new OAuth2Client(clientId);
}

function usernameFromEmail(email: string): string {
  return email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase();
}

export async function googleAuthController(req: Request, res: Response): Promise<void> {
  const { credential, code } = req.body as { credential?: string; code?: string };
  if (!credential) {
    res.status(400).json({ error: 'Missing Google credential' });
    return;
  }

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
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }
  }

  if (!user) {
    // New user — require an invite code (unless they are an admin email)
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(payload.email.toLowerCase());

    if (!isAdmin) {
      if (!code) {
        res.status(400).json({ error: 'Se requiere un código de acceso para crear una cuenta', field: 'code' });
        return;
      }
      if (!/^\d{6}$/.test(code)) {
        res.status(400).json({ error: 'El código de acceso debe tener 6 dígitos', field: 'code' });
        return;
      }
    }

    let base = usernameFromEmail(payload.email);
    let username = base;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      username = `${base}_${Math.random().toString(36).slice(2, 6)}`;
    }

    try {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: payload.email,
            username,
            name: payload.name ?? username,
            googleId: payload.sub,
            avatarUrl: payload.picture ?? null,
            passwordHash: null,
            isAdmin,
          },
        });

        if (!isAdmin) {
          const codeError = await claimInviteCode(tx, code!, newUser.id);
          if (codeError) throw Object.assign(new Error(codeError.error), { field: 'code', status: 400 });
        }

        return newUser;
      });
    } catch (err: any) {
      res.status(err.status ?? 400).json({ error: err.message, field: err.field });
      return;
    }

    try {
      await provisionUserLeaderboard(user.id);
    } catch (err) {
      console.error('Failed to provision leaderboard for Google user', user.id, err);
    }
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
