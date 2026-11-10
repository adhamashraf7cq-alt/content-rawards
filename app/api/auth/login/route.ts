import { NextRequest, NextResponse } from 'next/server';
import { signInOrRegister, makeSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, mode } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const result = signInOrRegister({ email, password, name, mode: mode ?? 'signin' });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true, user: result.user });
    res.headers.set('Set-Cookie', makeSessionCookie(result.user));
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
