'use client';
import { useState } from 'react';
import { Clip } from '@/types';
import { formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Props {
  clip: Clip;
  selected?: boolean;
  onSelect?: () => void;
  onExport?: () => void;
  onEdit?: () => void;
}

const platformLabels: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Reels',
  youtube_shorts: 'YT Shorts',
  facebook_reels: 'FB Reels',
};

export function ClipCard({ clip, selected, onSelect, onExport, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    clip.engagementScore >= 85 ? 'text-emerald-400' :
    clip.engagementScore >= 70 ? 'text-amber-400' : 'text-zinc-400';

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-violet-500/60 bg-violet-500/5'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Select checkbox */}
          <button
            onClick={onSelect}
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
              selected ? 'bg-violet-600 border-violet-600' : 'border-zinc-600 hover:border-zinc-400'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-zinc-100 leading-snug">{clip.title}</h4>
              <span className={`text-sm font-bold shrink-0 ${scoreColor}`}>{clip.engagementScore}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                {formatDuration(clip.startTime)} – {formatDuration(clip.endTime)}
              </span>
              <span className="text-xs text-zinc-500">{formatDuration(clip.duration)}</span>
              <span className="text-xs text-zinc-500">{clip.aspectRatio}</span>
              {clip.platform?.map((p) => (
                <Badge key={p} variant="purple" className="text-[10px]">{platformLabels[p] ?? p}</Badge>
              ))}
            </div>

            {clip.hook && (
              <p className="mt-2 text-xs text-zinc-400 italic line-clamp-2">"{clip.hook}"</p>
            )}

            {expanded && (
              <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                {clip.description && (
                  <p className="text-xs text-zinc-400">{clip.description}</p>
                )}
                {clip.caption && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">Caption</p>
                    <p className="text-xs text-zinc-300">{clip.caption}</p>
                  </div>
                )}
                {clip.hashtags && clip.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {clip.hashtags.map((h) => (
                      <span key={h} className="text-[10px] text-violet-400">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/60">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Less' : 'Details'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
          <Button size="sm" onClick={onExport} className="ml-auto">Export</Button>
        </div>
      </div>
    </div>
  );
}
