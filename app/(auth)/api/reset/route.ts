import { NextResponse } from 'next/server';
import { assertJsonContentType, verifySameOrigin, jsonError } from '@/lib/security';
import { z } from 'zod';
import crypto from 'node:crypto';
import { getPasswordResetByHash, deletePasswordResetById, setUserPasswordHash } from '@/lib/db/queries';

const ResetSchema = z.object({
  token: z.string().min(32),
  user: z.string().uuid(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const originCheck = verifySameOrigin(req);
    if (!originCheck.ok) return jsonError(403, 'Forbidden: origin not allowed');
    if (!assertJsonContentType(req)) return jsonError(415, 'Unsupported Media Type: application/json required');
    const body = await req.json();
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const { token, user: userId, password } = parsed.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pr = await getPasswordResetByHash({ userId, tokenHash });
    if (!pr || pr.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    const { hash } = await import('bcrypt-ts');
    const passwordHash = await hash(password, 10);
    await setUserPasswordHash({ userId, passwordHash });
    await deletePasswordResetById({ id: pr.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Reset error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
