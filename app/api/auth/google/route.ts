import { NextResponse } from 'next/server';

/** Google OAuth removed -- returns 410 Gone */
export async function GET() {
  return NextResponse.json({ error: 'Google OAuth is not enabled.' }, { status: 410 });
}
