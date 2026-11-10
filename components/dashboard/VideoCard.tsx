'use client';
import { useRouter } from 'next/navigation';
import { Video } from '@/types';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

const statusConfig = {
  pending:      { label: 'Pending',      color: 'gray'   as const },
  uploading:    { label: 'Uploading',    color: 'blue'   as const },
  processing:   { label: 'Processing',   color: 'blue'   as const },
  transcribing: { label: 'Transcribing', color: 'purple' as const },
  analyzing:    { label: 'Analyzing',    color: 'purple' as const },
  ready:        { label: 'Ready',        color: 'green'  as const },
  error:        { label: 'Error',        color: 'red'    as const },
};

interface Props {
  video: Video;
}

export function VideoCard({ video }: Props) {
  const router = useRouter();
  const cfg = statusConfig[video.status] ?? statusConfig.pending;
  const isProcessing = ['uploading', 'processing', 'transcribing', 'analyzing'].includes(video.status);

  return (
    <div
      onClick={() => video.status === 'ready' && router.push(`/workspace/${video.id}`)}
      className={`group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 ${
        video.status === 'ready' ? 'hover:border-zinc-700 hover:-translate-y-0.5 cursor-pointer' : ''
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-800 relative overflow-hidden">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
        )}
        {video.status === 'ready' && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/15 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">{video.title}</h3>
          <Badge variant={cfg.color} className="shrink-0">{cfg.label}</Badge>
        </div>
        <p className="text-xs text-zinc-500">{formatRelativeTime(video.createdAt)}</p>

        {isProcessing && (
          <div className="mt-3">
            <ProgressBar value={video.progress ?? 0} animated />
            <p className="mt-1 text-xs text-zinc-500">{cfg.label}…</p>
          </div>
        )}
      </div>
    </div>
  );
}
