import { NextRequest, NextResponse } from 'next/server';
import { makeSessionCookie } from '@/lib/auth';
import { generateId } from '@/lib/utils';

/**
 * On Vercel serverless, the filesystem resets between invocations.
 * We skip DB persistence for auth and issue a session cookie directly.
 * Users are identified by their email -- no password check in this demo.
 * For production: use Vercel Postgres or PlanetScale.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, mode } = body as {
      email: string;
      password: string;
      name?: string;
      mode?: 'signin' | 'signup';
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create session for the user (stateless -- no DB needed)
    const user = {
      id: Buffer.from(email).toString('base64url').slice(0, 16),
      email,
      name: name ?? email.split('@')[0],
    };

    // Try to persist to DB (may fail on Vercel -- that's ok)
    try {
      const { upsertUserAccount } = await import('@/lib/db');
      const now = new Date().toISOString();
      upsertUserAccount({ id: user.id, email: user.email, name: user.name, createdAt: now, lastLogin: now });
    } catch {
      // DB write failed (Vercel /tmp) -- session still works
    }

    const res = NextResponse.json({ ok: true, user });
    res.headers.set('Set-Cookie', makeSessionCookie(user));
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
