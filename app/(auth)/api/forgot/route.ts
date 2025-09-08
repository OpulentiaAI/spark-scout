import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, createPasswordResetToken } from '@/lib/db/queries';
import crypto from 'node:crypto';

const ForgotSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const users = await getUserByEmail(email);
    const u = users?.[0];
    // Always respond success to avoid user enumeration
    if (!u) return NextResponse.json({ ok: true });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await createPasswordResetToken({ userId: u.id, tokenHash, expiresAt });

    // TODO: Send email with reset link. For now, log link to console.
    const urlBase = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || '';
    const origin = typeof urlBase === 'string' && urlBase.startsWith('http')
      ? urlBase
      : `https://${urlBase}`;
    const resetUrl = `${origin}/reset?token=${rawToken}&user=${u.id}`;
    console.log('[Password Reset] URL:', resetUrl);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Forgot error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
