import { NextRequest, NextResponse } from 'next/server';
import {
  getPageViews,
  getActiveSessions,
  getAllSessions,
  getUserAccounts,
  getAllProjects,
  getAllVideos,
  getAllClips,
} from '@/lib/db';

// Simple admin key check — set ADMIN_KEY in .env.local
function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key');
  const expected = process.env.ADMIN_KEY ?? 'admin1234';
  return key === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const views = getPageViews();
  const activeSessions = getActiveSessions();
  const allSessions = getAllSessions();
  const users = getUserAccounts();
  const projects = getAllProjects();
  const videos = getAllVideos();
  const clips = getAllClips();

  const now = Date.now();

  // ── Page view bucketing ───────────────────────────────────────────────────
  const last24h = views.filter(
    (v) => now - new Date(v.timestamp).getTime() < 24 * 60 * 60 * 1000,
  );
  const last7d = views.filter(
    (v) => now - new Date(v.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000,
  );

  // ── Hourly chart (last 24h) ───────────────────────────────────────────────
  const hourlyMap: Record<string, number> = {};
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 60 * 60 * 1000);
    const key = `${d.getHours().toString().padStart(2, '0')}:00`;
    hourlyMap[key] = 0;
  }
  last24h.forEach((v) => {
    const d = new Date(v.timestamp);
    const key = `${d.getHours().toString().padStart(2, '0')}:00`;
    if (key in hourlyMap) hourlyMap[key]++;
  });
  const hourlyChart = Object.entries(hourlyMap).map(([hour, count]) => ({ hour, count }));

  // ── Daily chart (last 7 days) ─────────────────────────────────────────────
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[key] = 0;
  }
  last7d.forEach((v) => {
    const key = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (key in dailyMap) dailyMap[key]++;
  });
  const dailyChart = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

  // ── Top pages ─────────────────────────────────────────────────────────────
  const pageCount: Record<string, number> = {};
  last7d.forEach((v) => { pageCount[v.path] = (pageCount[v.path] ?? 0) + 1; });
  const topPages = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  // ── Unique visitors ───────────────────────────────────────────────────────
  const uniqueVisitors24h = new Set(last24h.map((v) => v.sessionId)).size;
  const uniqueVisitors7d = new Set(last7d.map((v) => v.sessionId)).size;

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentViews = [...views]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return NextResponse.json({
    // Live
    activeNow: activeSessions.length,
    activeSessions: activeSessions.slice(0, 20),

    // Totals
    totalPageViews: views.length,
    totalPageViews24h: last24h.length,
    totalPageViews7d: last7d.length,
    uniqueVisitors24h,
    uniqueVisitors7d,

    // Accounts & content
    totalUsers: users.length,
    totalProjects: projects.length,
    totalVideos: videos.length,
    totalClips: clips.length,

    // Charts
    hourlyChart,
    dailyChart,
    topPages,

    // Recent
    recentActivity: recentViews,

    // Sessions
    totalSessions: allSessions.length,
  });
}
