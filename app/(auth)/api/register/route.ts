import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, createLocalUser } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  // Allow empty string or omitted name; normalize later
  name: z.string().max(64).optional().or(z.literal('')),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const email = parsed.data.email.trim().toLowerCase();
    const rawName = parsed.data.name;
    const nameNorm =
      typeof rawName === 'string' ? rawName.trim() : undefined;
    const name = nameNorm && nameNorm.length > 0 ? nameNorm : null;
    const password = parsed.data.password;

    // Best-effort ensure required columns exist (for legacy DBs)
    try {
      await db.execute(sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now() NOT NULL`);
      await db.execute(sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" varchar(256)`);
    } catch (e) {
      // ignore, migration may not be permitted by role
      console.warn('Column ensure failed (safe to ignore if already exists)');
    }

    const existing = await getUserByEmail(email);
    if (existing.length > 0 && existing[0]?.passwordHash) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 },
      );
    }

    const { hash } = await import('bcrypt-ts');
    const passwordHash = await hash(password, 10);

    if (existing.length > 0 && !existing[0]?.passwordHash) {
      // User exists (from OAuth) — create a new row with password hash is not desired.
      // Instead, we can update by inserting with same email; but schema has unique constraints? Not shown.
      // Safer: create user only if none exists with email.
      return NextResponse.json(
        { error: 'Email already in use via social login' },
        { status: 409 },
      );
    }

    await createLocalUser({ email, name, passwordHash });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Register error', e);
    const message = typeof e?.message === 'string' ? e.message : 'unknown';
    const code = typeof e?.code === 'string' ? e.code : undefined;
    return NextResponse.json(
      { error: 'Server error', message, code },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
