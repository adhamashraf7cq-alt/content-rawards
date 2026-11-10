'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { VideoPlayer } from '@/components/workspace/VideoPlayer';
import { AITaskPanel } from '@/components/workspace/AITaskPanel';
import { ClipCard } from '@/components/workspace/ClipCard';
import { Timeline } from '@/components/workspace/Timeline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Video, Clip } from '@/types';
import { formatDuration } from '@/lib/utils';

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'clips' | 'ai' | 'edit'>('clips');

  useEffect(() => {
    if (!id) return;
    loadWorkspace();
  }, [id]);

  async function loadWorkspace() {
    try {
      // Fetch video by id
      const vidRes = await fetch(`/api/videos?id=${id}`);
      if (vidRes.ok) {
        const vd = await vidRes.json();
        setVideo(vd.video ?? null);
      }

      const clipsRes = await fetch(`/api/clips?videoId=${id}`);
      if (clipsRes.ok) {
        const data = await clipsRes.json();
        setClips(data.clips ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(clipId: string) {
    setSelectedClips((prev) => {
      const next = new Set(prev);
      next.has(clipId) ? next.delete(clipId) : next.add(clipId);
      return next;
    });
  }

  async function exportClip(clip: Clip) {
    setExporting(clip.id);
    // Simulate export — in production call /api/clips/export
    await new Promise((r) => setTimeout(r, 2500));
    alert(`Clip "${clip.title}" exported! In production this downloads an MP4 file.`);
    setExporting(null);
  }

  async function exportSelected() {
    const toExport = clips.filter((c) => selectedClips.has(c.id));
    for (const clip of toExport) await exportClip(clip);
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A0A0A]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Loading workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 border-b border-zinc-800 flex items-center px-4 gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-zinc-200 truncate flex-1">{video?.title ?? 'Workspace'}</h1>
          <Badge variant="green">Ready</Badge>
          {selectedClips.size > 0 && (
            <Button size="sm" onClick={exportSelected}>
              Export {selectedClips.size} clip{selectedClips.size > 1 ? 's' : ''}
            </Button>
          )}
        </header>

        {/* Main workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: video + timeline */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4 min-w-0">
            {video && (
              <VideoPlayer
                src={video.url}
                onTimeUpdate={setCurrentTime}
                startTime={selectedClip?.startTime}
                endTime={selectedClip?.endTime}
              />
            )}

            {/* Clip info banner */}
            {selectedClip && (
              <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedClip.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDuration(selectedClip.startTime)} → {formatDuration(selectedClip.endTime)} · {formatDuration(selectedClip.duration)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-400">Engagement</span>
                    <span className="text-sm font-bold text-emerald-400">{selectedClip.engagementScore}/100</span>
                  </div>
                </div>
                {selectedClip.caption && (
                  <p className="mt-2 text-xs text-zinc-400">📝 {selectedClip.caption}</p>
                )}
                {selectedClip.hashtags && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selectedClip.hashtags.map((h) => (
                      <span key={h} className="text-[10px] text-violet-400">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Timeline
              duration={video?.duration ?? 0}
              currentTime={currentTime}
              clips={clips}
              selectedClip={selectedClip}
              onClipSelect={setSelectedClip}
            />
          </div>

          {/* Right panel */}
          <div className="w-80 shrink-0 border-l border-zinc-800 flex flex-col overflow-hidden">
            {/* Panel tabs */}
            <div className="flex border-b border-zinc-800">
              {(['clips', 'ai', 'edit'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePanel(p)}
                  className={`flex-1 py-3 text-xs font-medium capitalize transition-all ${
                    activePanel === p
                      ? 'text-white border-b-2 border-violet-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p === 'ai' ? 'AI Task' : p === 'edit' ? 'Edit' : `Clips (${clips.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {activePanel === 'clips' && (
                <div className="space-y-2">
                  {clips.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs text-zinc-500 mb-3">No clips yet.</p>
                      <Button size="sm" variant="secondary" onClick={() => setActivePanel('ai')}>
                        Run AI Analysis
                      </Button>
                    </div>
                  ) : (
                    clips.map((clip) => (
                      <ClipCard
                        key={clip.id}
                        clip={clip}
                        selected={selectedClips.has(clip.id)}
                        onSelect={() => toggleSelect(clip.id)}
                        onEdit={() => { setSelectedClip(clip); setActivePanel('edit'); }}
                        onExport={() => exportClip(clip)}
                      />
                    ))
                  )}
                </div>
              )}

              {activePanel === 'ai' && (
                <AITaskPanel
                  videoId={id}
                  onClipsGenerated={(newClips) => {
                    setClips((prev) => [...prev, ...newClips]);
                    setActivePanel('clips');
                  }}
                />
              )}

              {activePanel === 'edit' && selectedClip && (
                <EditPanel
                  clip={selectedClip}
                  onUpdate={(updated) => {
                    setSelectedClip(updated);
                    setClips((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                  }}
                  onExport={() => exportClip(selectedClip)}
                  exporting={exporting === selectedClip.id}
                />
              )}

              {activePanel === 'edit' && !selectedClip && (
                <div className="py-12 text-center">
                  <p className="text-xs text-zinc-500">Select a clip to edit it.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

function EditPanel({ clip, onUpdate, onExport, exporting }: {
  clip: Clip;
  onUpdate: (c: Clip) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const [title, setTitle] = useState(clip.title);
  const [caption, setCaption] = useState(clip.caption ?? '');
  const [start, setStart] = useState(clip.startTime);
  const [end, setEnd] = useState(clip.endTime);
  const [ratio, setRatio] = useState(clip.aspectRatio);

  function save() {
    onUpdate({
      ...clip,
      title,
      caption,
      startTime: start,
      endTime: end,
      duration: end - start,
      aspectRatio: ratio,
    });
    // In production: PATCH /api/clips
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Start (s)</label>
          <input
            type="number" min={0} step={0.1}
            value={start}
            onChange={(e) => setStart(parseFloat(e.target.value))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">End (s)</label>
          <input
            type="number" min={0} step={0.1}
            value={end}
            onChange={(e) => setEnd(parseFloat(e.target.value))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Aspect Ratio</label>
        <div className="flex gap-2">
          {(['9:16', '16:9', '1:1'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                ratio === r
                  ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
      </div>
      <Button variant="secondary" className="w-full" onClick={save}>Save Changes</Button>
      <Button
        className="w-full"
        onClick={onExport}
        loading={exporting}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        }
      >
        {exporting ? 'Exporting…' : 'Export Clip'}
      </Button>
    </div>
  );
}
