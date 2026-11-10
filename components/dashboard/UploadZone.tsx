'use client';
import { useRef, useState, useEffect, DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { extractYouTubeId, ACCEPTED_VIDEO_TYPES } from '@/lib/utils';
import { Video } from '@/types';

interface Props {
  onVideoCreated: (video: Video) => void;
}

const STATUS_LABEL: Record<string, string> = {
  uploading:    'Uploading…',
  processing:   'Processing…',
  transcribing: 'Transcribing audio…',
  analyzing:    'Analysing with AI…',
  ready:        'Ready!',
  error:        'Failed',
};

export function UploadZone({ onVideoCreated }: Props) {
  const [tab, setTab]           = useState<'upload' | 'youtube'>('upload');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Uploading…');
  const [error, setError]       = useState('');
  const [ytUrl, setYtUrl]       = useState('');
  const [pollingId, setPollingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll video status while processing
  useEffect(() => {
    if (!pollingId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos?id=${pollingId}`);
        if (!res.ok) return;
        const data = await res.json();
        const v: Video = data.video;

        setProgress(v.progress ?? 0);
        setStatusLabel(STATUS_LABEL[v.status] ?? 'Processing…');

        if (v.status === 'ready') {
          clearInterval(pollRef.current!);
          setPollingId(null);
          setUploading(false);
          onVideoCreated(v);
        } else if (v.status === 'error') {
          clearInterval(pollRef.current!);
          setPollingId(null);
          setUploading(false);
          setError('Processing failed. Please try again.');
        }
      } catch {
        // ignore transient errors
      }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollingId, onVideoCreated]);

  async function upload(file: File) {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      setError('Unsupported file type. Use MP4, MOV, AVI, MKV, or WebM.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(5);
    setStatusLabel('Uploading…');

    try {
      // Try Vercel Blob client upload first (bypasses 4.5MB server limit)
      let video: Video;
      if (typeof window !== 'undefined') {
        try {
          const { upload: blobUpload } = await import('@vercel/blob/client');
          const ext = file.name.split('.').pop() ?? 'mp4';
          const blob = await blobUpload(`videos/${Date.now()}.${ext}`, file, {
            access: 'public',
            handleUploadUrl: '/api/videos/upload-url',
            onUploadProgress: ({ percentage }) => {
              setProgress(Math.round(percentage * 0.8));
              setStatusLabel(`Uploading… ${Math.round(percentage)}%`);
            },
          });
          setProgress(85);
          setStatusLabel('Creating project…');
          // Register video via upload API
          const form = new FormData();
          form.append('blobUrl', blob.url);
          form.append('fileName', file.name);
          form.append('fileSize', String(file.size));
          const res = await fetch('/api/videos/upload', { method: 'POST', body: form });
          const data = await res.json();
          video = data.video as Video;
        } catch {
          // Fallback to direct upload for small files
          const form = new FormData();
          form.append('file', file);
          video = await uploadWithProgress(form, (pct) => {
            setProgress(Math.round(pct * 0.65));
            setStatusLabel(`Uploading… ${Math.round(pct)}%`);
          });
        }
      } else {
        const form = new FormData();
        form.append('file', file);
        video = await uploadWithProgress(form, (pct) => {
          setProgress(Math.round(pct * 0.65));
        });
      }

      setProgress(90);
      setStatusLabel('Processing…');
      setPollingId(video.id);
    } catch (err: unknown) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  }

  async function submitYouTube() {
    if (!ytUrl.trim())                        { setError('Enter a YouTube URL'); return; }
    if (!extractYouTubeId(ytUrl.trim()))      { setError('Invalid YouTube URL'); return; }

    setError('');
    setUploading(true);
    setProgress(10);
    setStatusLabel('Submitting…');

    const form = new FormData();
    form.append('youtubeUrl', ytUrl.trim());

    try {
      const res = await fetch('/api/videos/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed');
      }
      const data = await res.json();
      setProgress(20);
      setStatusLabel('Processing…');
      setPollingId(data.video.id);
      setYtUrl('');
    } catch (err: unknown) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Failed to process YouTube URL.');
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(['upload', 'youtube'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              tab === t
                ? 'text-white border-b-2 border-violet-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t === 'upload' ? '📁 Upload File' : '▶️ YouTube URL'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {!uploading ? (
          tab === 'upload' ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center py-12 px-6 text-center ${
                  dragging ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/40'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-200 mb-1">
                  {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-zinc-500">MP4, MOV, AVI, MKV, WebM · Max 2 GB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m0 0l1.562-1.562M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  type="url"
                  value={ytUrl}
                  onChange={(e) => { setYtUrl(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && submitYouTube()}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition-all"
                />
              </div>
              <p className="text-xs text-zinc-500">
                Only process videos you own or have rights to.
              </p>
              <Button onClick={submitYouTube} className="w-full">
                Process Video
              </Button>
            </div>
          )
        ) : (
          /* ── Processing state ── */
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{statusLabel}</p>
                <p className="text-xs text-zinc-500">
                  {progress < 70
                    ? 'Large files can take a few minutes to upload'
                    : 'AI is working in the background — you can navigate away'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>{statusLabel}</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} animated />
            </div>

            {/* Stage indicators */}
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
              {[
                { label: 'Upload',      threshold: 65 },
                { label: 'Transcribe',  threshold: 75 },
                { label: 'Analyse',     threshold: 90 },
                { label: 'Ready',       threshold: 100 },
              ].map((stage, i, arr) => (
                <span key={stage.label} className="flex items-center gap-1">
                  <span className={progress >= stage.threshold ? 'text-violet-400 font-medium' : ''}>
                    {stage.label}
                  </span>
                  {i < arr.length - 1 && <span className="text-zinc-700">→</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Upload using XHR to get real upload progress percentage.
 * Returns the created Video object from the API.
 */
function uploadWithProgress(form: FormData, onProgress: (pct: number) => void): Promise<Video> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.video as Video);
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error. Check your connection.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')));

    xhr.send(form);
  });
}