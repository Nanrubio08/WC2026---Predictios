import { PrismaClient } from '../generated/client';
import prisma from '../prisma';


/** Validates and atomically claims an invite code within an existing transaction. */
export async function claimInviteCode(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  code: string,
  userId: string
): Promise<{ error: string } | null> {
  const invite = await tx.inviteCode.findUnique({ where: { code } });

  if (!invite) return { error: 'Código de acceso inválido' };
  if (invite.usedBy) return { error: 'Este código ya fue utilizado' };

  await tx.inviteCode.update({
    where: { code },
    data: { usedBy: userId, usedAt: new Date() },
  });

  return null;
}

/** Generates N unique 6-digit codes not already in the DB. */
export async function generateCodes(count: number): Promise<string[]> {
  const existing = new Set(
    (await prisma.inviteCode.findMany({ select: { code: true } })).map((r) => r.code)
  );

  const codes: string[] = [];
  let attempts = 0;
  while (codes.length < count && attempts < count * 10) {
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    if (!existing.has(code) && !codes.includes(code)) codes.push(code);
    attempts++;
  }

  await prisma.inviteCode.createMany({ data: codes.map((code) => ({ code })) });
  return codes;
}
