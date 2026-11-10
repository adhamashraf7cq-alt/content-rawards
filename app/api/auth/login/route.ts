import { NextRequest, NextResponse } from 'next/server';
import { signInOrRegister, makeSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, name, mode } = await req.json();
  const result = signInOrRegister({ email, password, name, mode: mode ?? 'signin' });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, user: result.user });
  res.headers.set('Set-Cookie', makeSessionCookie(result.user));
  return res;
}
