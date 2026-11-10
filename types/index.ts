// ─── Core domain types ────────────────────────────────────────────────────────

export type VideoStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'analyzing'
  | 'ready'
  | 'error';

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type Platform = 'tiktok' | 'instagram' | 'youtube_shorts' | 'facebook_reels';

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;         // storage URL or YouTube URL
  thumbnailUrl?: string;
  duration: number;    // seconds
  size?: number;       // bytes
  status: VideoStatus;
  progress?: number;   // 0-100
  transcription?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface Clip {
  id: string;
  videoId: string;
  projectId: string;
  title: string;
  description: string;
  startTime: number;   // seconds
  endTime: number;     // seconds
  duration: number;    // seconds
  engagementScore: number; // 0-100
  aspectRatio: AspectRatio;
  platform: Platform[];
  hook?: string;
  caption?: string;
  hashtags?: string[];
  subtitles?: Subtitle[];
  exportUrl?: string;
  thumbnail?: string;
  status: 'pending' | 'ready' | 'exporting' | 'exported';
  createdAt: string;
}

export interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  videoCount: number;
  clipCount: number;
  createdAt: string;
  updatedAt: string;
  videos?: Video[];
  clips?: Clip[];
}

export interface AITask {
  id: string;
  projectId: string;
  videoId: string;
  instruction: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: AITaskResult;
  createdAt: string;
}

export interface AITaskResult {
  plan: string;
  clips: Partial<Clip>[];
  summary?: string;
}

export interface ProcessingJob {
  id: string;
  videoId: string;
  type: 'transcribe' | 'analyze' | 'generate_clips' | 'export';
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ExportSettings {
  clipId: string;
  aspectRatio: AspectRatio;
  quality: '720p' | '1080p';
  includeSubtitles: boolean;
  includeMusic: boolean;
  musicTrack?: string;
  format: 'mp4' | 'mov';
}
