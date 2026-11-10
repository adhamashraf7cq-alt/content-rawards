'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { VideoCard } from '@/components/dashboard/VideoCard';
import { Button } from '@/components/ui/Button';
import { Video, Project } from '@/types';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const ytUrl = searchParams?.get('url');

  useEffect(() => {
    loadData();
    if (ytUrl) setShowUpload(true);
  }, []);

  useEffect(() => {
    const processing = videos.filter((v) =>
      ['uploading', 'processing', 'transcribing', 'analyzing'].includes(v.status),
    );
    if (processing.length === 0) return;
    const timer = setInterval(async () => { await loadData(); }, 3000);
    return () => clearInterval(timer);
  }, [videos]);

  async function loadData() {
    try {
      const pRes = await fetch('/api/projects');
      const pData = await pRes.json();
      const loadedProjects: Project[] = pData.projects ?? [];
      setProjects(loadedProjects);

      if (loadedProjects.length > 0) {
        const videoResponses = await Promise.all(
          loadedProjects.map((p) => fetch(`/api/videos?projectId=${p.id}`).catch(() => null)),
        );
        const allVideos: Video[] = [];
        for (const res of videoResponses) {
          if (res?.ok) {
            const vd = await res.json();
            allVideos.push(...(vd.videos ?? []));
          }
        }
        allVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setVideos(allVideos);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName.trim() }),
    });
    const data = await res.json();
    if (data.project) {
      setProjects((prev) => [...prev, data.project]);
      setNewProjectName('');
    }
    setCreating(false);
  }

  function onVideoCreated(video: Video) {
    setVideos((prev) => [video, ...prev]);
    setShowUpload(false);
    if (video.status === 'ready') {
      router.push(`/workspace/${video.id}`);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Your AI video workspace</p>
            </div>
            <Button
              onClick={() => setShowUpload(!showUpload)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              New Video
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Projects', value: projects.length },
              { label: 'Videos', value: videos.length },
              { label: 'Clips', value: projects.reduce((a, p) => a + (p.clipCount ?? 0), 0) },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {showUpload && (
            <div className="mb-8">
              <UploadZone onVideoCreated={onVideoCreated} />
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300">Projects</h2>
            </div>
            {projects.length === 0 && !loading ? (
              <div className="flex items-center gap-3 mb-4">
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  placeholder="My first project"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                <Button size="sm" loading={creating} onClick={createProject}>Create</Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    <span className="text-zinc-200 font-medium">{p.name}</span>
                    <span className="text-zinc-500 text-xs">{p.clipCount} clips</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300">
                Videos {videos.length > 0 && <span className="text-zinc-500">({videos.length})</span>}
              </h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse">
                    <div className="aspect-video bg-zinc-800 rounded-t-xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-zinc-800 rounded w-3/4" />
                      <div className="h-2 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div
                className="border-2 border-dashed border-zinc-800 rounded-xl py-16 text-center cursor-pointer hover:border-zinc-600 transition-colors"
                onClick={() => setShowUpload(true)}
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-300 font-medium mb-1">No videos yet</p>
                <p className="text-xs text-zinc-500">Upload a video or paste a YouTube link to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
