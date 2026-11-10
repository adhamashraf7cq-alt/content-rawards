'use client';
import { useRef, useState, useEffect } from 'react';
import { formatDuration, clamp } from '@/lib/utils';

interface Props {
  src: string;
  onTimeUpdate?: (time: number) => void;
  startTime?: number;
  endTime?: number;
}

export function VideoPlayer({ src, onTimeUpdate, startTime = 0, endTime }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => setDuration(video.duration);
    const onTime = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      onTimeUpdate?.(t);
      // Loop within clip bounds
      if (endTime && t >= endTime) {
        video.currentTime = startTime;
        video.pause();
        setPlaying(false);
      }
    };
    const onEnded = () => setPlaying(false);

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
    };
  }, [onTimeUpdate, startTime, endTime]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (playing) { video.pause(); setPlaying(false); }
    else { video.play(); setPlaying(true); }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const target = startTime + ratio * (endTime ?? duration - startTime);
    video.currentTime = target;
  }

  function skip(sec: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = clamp(video.currentTime + sec, startTime, endTime ?? duration);
  }

  const progressRatio = duration
    ? (currentTime - startTime) / ((endTime ?? duration) - startTime)
    : 0;

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden">
      {isYouTube ? (
        <div className="aspect-video bg-zinc-900 flex items-center justify-center text-center p-6">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="text-zinc-300 text-sm font-medium mb-1">YouTube Video</p>
            <p className="text-zinc-500 text-xs">Processing in background. AI analysis will appear below.</p>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            className="w-full aspect-video bg-black"
            onClick={togglePlay}
            preload="metadata"
          />
          {/* Controls */}
          <div className="bg-zinc-900 px-4 py-3">
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="w-full h-1.5 bg-zinc-700 rounded-full cursor-pointer mb-3 relative"
              onClick={seek}
            >
              <div
                className="h-full bg-violet-500 rounded-full relative"
                style={{ width: `${clamp(progressRatio * 100, 0, 100)}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button onClick={() => skip(-5)} className="video-control-btn" title="Back 5s">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
              <button onClick={togglePlay} className="video-control-btn w-10 h-10" title={playing ? 'Pause' : 'Play'}>
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button onClick={() => skip(5)} className="video-control-btn" title="Forward 5s">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                </svg>
              </button>

              <span className="ml-2 text-xs text-zinc-400 tabular-nums">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>

              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setMuted(!muted)} className="video-control-btn">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {muted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    )}
                  </svg>
                </button>
                <input
                  type="range" min={0} max={1} step={0.1} value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                  }}
                  className="w-20 accent-violet-500"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
