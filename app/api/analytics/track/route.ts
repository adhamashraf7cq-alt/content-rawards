import { NextRequest, NextResponse } from 'next/server';
import { recordPageView, upsertSession, PageView, ActiveSession } from '@/lib/db';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      path: string;
      sessionId: string;
      userId?: string;
      referrer?: string;
    };

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') ?? '';
    const now = new Date().toISOString();

    const view: PageView = {
      id: generateId(),
      path: body.path,
      sessionId: body.sessionId,
      userId: body.userId,
      referrer: body.referrer,
      ip,
      userAgent,
      timestamp: now,
    };
    recordPageView(view);

    const session: ActiveSession = {
      sessionId: body.sessionId,
      userId: body.userId,
      path: body.path,
      lastSeen: now,
      startedAt: now,
      userAgent,
      ip,
    };
    upsertSession(session);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
