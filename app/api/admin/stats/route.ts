import { NextRequest, NextResponse } from 'next/server';
import {
  getPageViews, getActiveSessions, getAllSessions,
  getUserAccounts, getAllProjects, getAllVideos, getAllClips,
} from '@/lib/db';

function auth(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key') ?? req.nextUrl.searchParams.get('key');
  return key === (process.env.ADMIN_KEY ?? 'admin1234');
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const views    = getPageViews();
  const active   = getActiveSessions();
  const users    = getUserAccounts();
  const projects = getAllProjects();
  const videos   = getAllVideos();
  const clips    = getAllClips();
  const now      = Date.now();

  const last24h = views.filter(v => now - new Date(v.timestamp).getTime() < 86400000);
  const last7d  = views.filter(v => now - new Date(v.timestamp).getTime() < 7 * 86400000);

  // Hourly chart
  const hMap: Record<string, number> = {};
  for (let i = 23; i >= 0; i--) {
    const k = `${new Date(now - i * 3600000).getHours().toString().padStart(2,'0')}:00`;
    hMap[k] = 0;
  }
  last24h.forEach(v => {
    const k = `${new Date(v.timestamp).getHours().toString().padStart(2,'0')}:00`;
    if (k in hMap) hMap[k]++;
  });

  // Daily chart
  const dMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const k = new Date(now - i * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dMap[k] = 0;
  }
  last7d.forEach(v => {
    const k = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (k in dMap) dMap[k]++;
  });

  // Top pages
  const pg: Record<string, number> = {};
  last7d.forEach(v => { pg[v.path] = (pg[v.path] ?? 0) + 1; });
  const topPages = Object.entries(pg).sort((a,b) => b[1]-a[1]).slice(0,8)
    .map(([path, count]) => ({ path, count }));

  return NextResponse.json({
    activeNow:          active.length,
    activeSessions:     active.slice(0, 30),
    totalPageViews24h:  last24h.length,
    totalPageViews7d:   last7d.length,
    uniqueVisitors24h:  new Set(last24h.map(v => v.sessionId)).size,
    totalUsers:         users.length,
    totalVideos:        videos.length,
    totalClips:         clips.length,
    hourlyChart:        Object.entries(hMap).map(([hour, count]) => ({ hour, count })),
    dailyChart:         Object.entries(dMap).map(([day,  count]) => ({ day,  count })),
    topPages,
    customers:          users,   // name + email + createdAt + lastLogin
  });
}
