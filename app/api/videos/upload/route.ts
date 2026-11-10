import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createVideo, updateVideo, createProject, getProjects } from '@/lib/db';
import { generateId, extractYouTubeId, getThumbnailUrl, MAX_FILE_SIZE } from '@/lib/utils';

// Max 300s on Vercel Hobby plan
export const maxDuration = 300;

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(req: NextRequest) {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const youtubeUrl = formData.get('youtubeUrl') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const userId = req.headers.get('x-user-id') ?? 'demo-user-1';

    // ── Resolve or create project ──────────────────────────────────────────
    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const projects = getProjects(userId);
      if (projects.length === 0) {
        const now = new Date().toISOString();
        const p = createProject({
          id: generateId(),
          name: 'My First Project',
          userId,
          videoCount: 0,
          clipCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        resolvedProjectId = p.id;
      } else {
        resolvedProjectId = projects[projects.length - 1].id;
      }
    }

    const now = new Date().toISOString();

    // ── YouTube URL ────────────────────────────────────────────────────────
    if (youtubeUrl) {
      const ytId = extractYouTubeId(youtubeUrl);
      if (!ytId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      }

      const video = createVideo({
        id: generateId(),
        title: `YouTube Video – ${ytId}`,
        url: youtubeUrl,
        thumbnailUrl: getThumbnailUrl(ytId),
        duration: 0,
        status: 'processing',
        progress: 5,
        projectId: resolvedProjectId,
        createdAt: now,
        updatedAt: now,
      });

      // Fire-and-forget background processing
      void runProcessingBackground(video.id, null);

      return NextResponse.json({ video, message: 'Video queued for processing.' });
    }

    // ── File upload ────────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: 'No file or YouTube URL provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 2 GB limit.' }, { status: 413 });
    }

    // Create DB record immediately so the UI can show it
    const ext = path.extname(file.name) || '.mp4';
    const fileName = `${generateId()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const video = createVideo({
      id: generateId(),
      title: file.name.replace(ext, ''),
      url: `/uploads/${fileName}`,
      duration: 0,
      size: file.size,
      status: 'uploading',
      progress: 5,
      projectId: resolvedProjectId,
      createdAt: now,
      updatedAt: now,
    });

    // Stream progress updates while writing the file
    const buffer = Buffer.from(await file.arrayBuffer());
    updateVideo(video.id, { progress: 50, updatedAt: new Date().toISOString() });
    await writeFile(filePath, buffer);
    updateVideo(video.id, { status: 'processing', progress: 70, updatedAt: new Date().toISOString() });

    // Fire-and-forget: background processing continues after response is sent
    void runProcessingBackground(video.id, filePath);

    // Return immediately — client polls for status
    return NextResponse.json({
      video: { ...video, status: 'processing', progress: 70 },
      message: 'Video uploaded. Processing in background…',
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

/**
 * Runs in the background after the HTTP response is sent.
 * Simulates transcription + analysis stages with realistic timing.
 * In production: replace with a real job queue (BullMQ, Inngest, etc.)
 */
async function runProcessingBackground(videoId: string, _filePath: string | null) {
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  try {
    // Stage 1: Transcribing
    updateVideo(videoId, { status: 'transcribing', progress: 30, updatedAt: new Date().toISOString() });
    await sleep(4000);

    updateVideo(videoId, { status: 'transcribing', progress: 55, updatedAt: new Date().toISOString() });
    await sleep(4000);

    // Stage 2: Analyzing
    updateVideo(videoId, { status: 'analyzing', progress: 75, updatedAt: new Date().toISOString() });
    await sleep(3000);

    updateVideo(videoId, { status: 'analyzing', progress: 90, updatedAt: new Date().toISOString() });
    await sleep(2000);

    // Done
    updateVideo(videoId, {
      status: 'ready',
      progress: 100,
      duration: 847, // replaced by real FFprobe duration in production
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Background processing error:', err);
    updateVideo(videoId, {
      status: 'error' as any,
      progress: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}
