import { NextResponse } from 'next/server';

/** Google OAuth removed */
export async function GET() {
  return NextResponse.redirect(new URL('/auth/signin', 'http://localhost:3000'));
}
