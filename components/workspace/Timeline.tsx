'use client';
import { useRef, useState, useCallback } from 'react';
import { Clip } from '@/types';
import { formatDuration, clamp } from '@/lib/utils';

interface Props {
  duration: number;
  currentTime: number;
  clips: Clip[];
  selectedClip?: Clip | null;
  onSeek?: (time: number) => void;
  onClipSelect?: (clip: Clip) => void;
  onClipTrim?: (clipId: string, start: number, end: number) => void;
}

const COLORS = [
  'bg-violet-500/60', 'bg-blue-500/60', 'bg-emerald-500/60',
  'bg-amber-500/60', 'bg-pink-500/60', 'bg-cyan-500/60',
];

export function Timeline({ duration, currentTime, clips, selectedClip, onSeek, onClipSelect, onClipTrim }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  function seekFromClick(e: React.MouseEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onSeek?.(ratio * duration);
  }

  const cursorLeft = duration ? `${(currentTime / duration) * 100}%` : '0%';

  // Generate time markers
  const markerCount = 10;
  const markerStep = duration / markerCount;

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 select-none">
      <p className="text-xs text-zinc-500 mb-2 font-medium">Timeline</p>

      {/* Time ruler */}
      <div className="flex justify-between mb-1 px-0">
        {Array.from({ length: markerCount + 1 }, (_, i) => (
          <span key={i} className="text-[10px] text-zinc-600 tabular-nums">
            {formatDuration(i * markerStep)}
          </span>
        ))}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-14 bg-zinc-900 rounded-lg cursor-pointer overflow-hidden border border-zinc-800"
        onClick={seekFromClick}
      >
        {/* Clip segments */}
        {clips.map((clip, i) => {
          const left = (clip.startTime / duration) * 100;
          const width = ((clip.endTime - clip.startTime) / duration) * 100;
          const isSelected = selectedClip?.id === clip.id;
          return (
            <button
              key={clip.id}
              onClick={(e) => { e.stopPropagation(); onClipSelect?.(clip); }}
              className={`absolute top-2 bottom-2 rounded transition-all border ${
                isSelected ? 'border-white/40 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
              } ${COLORS[i % COLORS.length]}`}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
              title={clip.title}
            >
              {width > 5 && (
                <span className="absolute inset-x-1 top-0.5 text-[9px] text-white/80 truncate leading-none">
                  {clip.title}
                </span>
              )}
            </button>
          );
        })}

        {/* Playhead */}
        <div
          className="timeline-cursor pointer-events-none"
          style={{ left: cursorLeft }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-violet-400 rotate-45" />
        </div>
      </div>

      {/* Legend */}
      {clips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {clips.map((clip, i) => (
            <button
              key={clip.id}
              onClick={() => onClipSelect?.(clip)}
              className={`flex items-center gap-1.5 text-[10px] rounded px-1.5 py-0.5 transition-all ${
                selectedClip?.id === clip.id
                  ? 'text-white bg-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length].replace('/60', '')}`} />
              {clip.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
