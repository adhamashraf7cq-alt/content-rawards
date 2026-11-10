'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Customer {
  id: string; email: string; name?: string; createdAt: string; lastLogin?: string;
}
interface Stats {
  activeNow: number;
  totalPageViews24h: number;
  totalPageViews7d: number;
  uniqueVisitors24h: number;
  totalUsers: number;
  totalVideos: number;
  totalClips: number;
  hourlyChart: Array<{ hour: string; count: number }>;
  dailyChart:  Array<{ day: string;  count: number }>;
  topPages: Array<{ path: string; count: number }>;
  customers: Customer[];
  activeSessions: Array<{ sessionId: string; path: string; lastSeen: string; ip?: string }>;
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth: (k: string) => void }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`);
    if (r.ok) { localStorage.setItem('cr_ak', key); onAuth(key); }
    else setErr('Wrong key');
  }
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <p className="text-base font-bold text-white">Admin</p>
        </div>
        <input type="password" value={key} onChange={e => { setKey(e.target.value); setErr(''); }}
          placeholder="Admin key…" autoFocus
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
        {err && <p className="text-xs text-red-400">{err}</p>}
        <button type="submit" className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all">Enter</button>
        <p className="text-center text-[10px] text-zinc-600">Default: <span className="text-zinc-400 font-mono">admin1234</span></p>
      </form>
    </div>
  );
}

// ─── Bar ─────────────────────────────────────────────────────────────────────
function Bar({ data, lk, vk }: { data: any[]; lk: string; vk: string }) {
  const max = Math.max(...data.map(d => d[vk]), 1);
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-200 bg-zinc-800 px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
            {d[lk]}: {d[vk]}
          </div>
          <div className="w-full bg-violet-600/70 hover:bg-violet-400 rounded-t transition-all"
            style={{ height: `${Math.max((d[vk] / max) * 100, 3)}%` }} />
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function S({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-white'}`}>{Number(value).toLocaleString()}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [tab, setTab]           = useState<'overview' | 'customers' | 'live'>('overview');
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [lastUp, setLastUp]     = useState<Date | null>(null);

  useEffect(() => {
    const k = localStorage.getItem('cr_ak');
    if (k) setAdminKey(k);
  }, []);

  const fetch_ = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`);
      if (r.ok) { setStats(await r.json()); setLastUp(new Date()); }
      else if (r.status === 401) { localStorage.removeItem('cr_ak'); setAdminKey(null); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!adminKey) return;
    fetch_(adminKey);
    const t = setInterval(() => fetch_(adminKey), 20000);
    return () => clearInterval(t);
  }, [adminKey, fetch_]);

  if (!adminKey) return <LoginGate onAuth={k => setAdminKey(k)} />;

  const customers = (stats?.customers ?? []).filter(c =>
    !search || c.email.includes(search) || (c.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">Content Rawards Admin</span>
          {stats && (
            <span className="ml-2 flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {stats.activeNow} live
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastUp && <span className="text-[10px] text-zinc-500">{lastUp.toLocaleTimeString()}</span>}
          <button onClick={() => adminKey && fetch_(adminKey)} disabled={loading}
            className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 disabled:opacity-40">
            {loading ? '...' : 'Refresh'}
          </button>
          <button onClick={() => { localStorage.removeItem('cr_ak'); setAdminKey(null); }}
            className="text-xs text-zinc-500 hover:text-white">Sign out</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-5">
        {(['overview', 'customers', 'live'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-3 px-4 text-xs font-medium capitalize border-b-2 transition-all ${
              tab === t ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {t}{t === 'customers' && stats ? ` (${stats.totalUsers})` : ''}
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <S label="Active Now"    value={stats.activeNow}          color="text-emerald-400" />
                <S label="Views (24h)"  value={stats.totalPageViews24h}   color="text-violet-400" />
                <S label="Unique (24h)" value={stats.uniqueVisitors24h} />
                <S label="Views (7d)"   value={stats.totalPageViews7d} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <S label="Users"   value={stats.totalUsers}  color="text-blue-400" />
                <S label="Videos"  value={stats.totalVideos} />
                <S label="Clips"   value={stats.totalClips}  color="text-amber-400" />
                <S label="Sessions" value={stats.activeSessions.length} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-zinc-300 mb-3">Views – Last 24h</p>
                  <Bar data={stats.hourlyChart} lk="hour" vk="count" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-zinc-300 mb-3">Views – Last 7 Days</p>
                  <Bar data={stats.dailyChart} lk="day" vk="count" />
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs font-medium text-zinc-300 mb-3">Top Pages</p>
                <div className="space-y-2">
                  {stats.topPages.length === 0
                    ? <p className="text-xs text-zinc-600">No data yet — visit pages first.</p>
                    : stats.topPages.map((p, i) => (
                    <div key={p.path} className="flex items-center gap-3 text-xs">
                      <span className="text-zinc-600 w-4">{i + 1}</span>
                      <span className="font-mono text-zinc-300 flex-1 truncate">{p.path}</span>
                      <span className="text-zinc-400 shrink-0">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CUSTOMERS ── */}
          {tab === 'customers' && (
            <>
              <div className="flex items-center gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
                <span className="text-xs text-zinc-500 shrink-0">{customers.length} accounts</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Joined</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-600">No accounts yet.</td></tr>
                    ) : customers.map(c => (
                      <tr key={c.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-200 font-medium">{c.name ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-400 font-mono">{c.email}</td>
                        <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">
                          {c.lastLogin ? new Date(c.lastLogin).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── LIVE ── */}
          {tab === 'live' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-zinc-200">{stats.activeSessions.length} active sessions</span>
              </div>
              {stats.activeSessions.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-zinc-600">Nobody online right now.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="px-4 py-3 text-left font-medium">Page</th>
                      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">IP</th>
                      <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.activeSessions.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-violet-400">{s.path}</td>
                        <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">{s.ip ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-500">{new Date(s.lastSeen).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
