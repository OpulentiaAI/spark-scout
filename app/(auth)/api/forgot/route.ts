import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, createPasswordResetToken } from '@/lib/db/queries';
import { Resend } from 'resend';
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
    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset?token=${rawToken}&user=${u.id}`;

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
    if (resendKey) {
      const resend = new Resend(resendKey);
      try {
        await resend.emails.send({
          from,
          to: email,
          subject: 'Reset your Opulent OS password',
          html: `
            <p>We received a request to reset your password.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link will expire in 1 hour. If you didn\'t request this, you can ignore this email.</p>
          `,
          text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`,
        });
      } catch (e) {
        console.error('Resend email send failed', e);
      }
    } else {
      console.warn('RESEND_API_KEY not set; password reset URL:', resetUrl);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Forgot error', e);
    const message = typeof e?.message === 'string' ? e.message : 'unknown';
    const code = typeof e?.code === 'string' ? e.code : undefined;
    return NextResponse.json(
      { error: 'Server error', message, code },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
