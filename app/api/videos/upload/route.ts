import { NextRequest, NextResponse } from 'next/server';
import { createVideo, updateVideo, createProject, getProjects } from '@/lib/db';
import { generateId, extractYouTubeId, getThumbnailUrl, MAX_FILE_SIZE } from '@/lib/utils';

export const maxDuration = 300;

// Use Vercel Blob on production, local disk on dev
async function storeFile(file: File, fileName: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`videos/${fileName}`, file, { access: 'public' });
    return blob.url;
  }
  // Local dev fallback
  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);
  return `/uploads/${fileName}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file        = formData.get('file') as File | null;
    const youtubeUrl  = formData.get('youtubeUrl') as string | null;
    const projectId   = formData.get('projectId') as string | null;
    const userId      = req.headers.get('x-user-id') ?? 'demo-user-1';

    // Resolve or create project
    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const projects = getProjects(userId);
      if (projects.length === 0) {
        const now = new Date().toISOString();
        const p = createProject({
          id: generateId(), name: 'My First Project', userId,
          videoCount: 0, clipCount: 0, createdAt: now, updatedAt: now,
        });
        resolvedProjectId = p.id;
      } else {
        resolvedProjectId = projects[projects.length - 1].id;
      }
    }

    const now = new Date().toISOString();

    // YouTube URL
    if (youtubeUrl) {
      const ytId = extractYouTubeId(youtubeUrl);
      if (!ytId) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });

      const video = createVideo({
        id: generateId(), title: `YouTube Video – ${ytId}`,
        url: youtubeUrl, thumbnailUrl: getThumbnailUrl(ytId),
        duration: 0, status: 'processing', progress: 5,
        projectId: resolvedProjectId!, createdAt: now, updatedAt: now,
      });
      void runProcessingBackground(video.id);
      return NextResponse.json({ video });
    }

    // File upload
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File exceeds 2 GB limit.' }, { status: 413 });

    const path = await import('path');
    const ext      = path.extname(file.name) || '.mp4';
    const fileName = `${generateId()}${ext}`;

    const video = createVideo({
      id: generateId(), title: file.name.replace(ext, ''),
      url: '', duration: 0, size: file.size,
      status: 'uploading', progress: 10,
      projectId: resolvedProjectId!, createdAt: now, updatedAt: now,
    });

    updateVideo(video.id, { progress: 30, updatedAt: new Date().toISOString() });

    // Store file (Blob on Vercel, local on dev)
    const fileUrl = await storeFile(file, fileName);

    updateVideo(video.id, { url: fileUrl, status: 'processing', progress: 60, updatedAt: new Date().toISOString() });
    void runProcessingBackground(video.id);

    return NextResponse.json({
      video: { ...video, url: fileUrl, status: 'processing', progress: 60 },
      message: 'Video uploaded. Processing in background…',
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

async function runProcessingBackground(videoId: string) {
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  try {
    updateVideo(videoId, { status: 'transcribing', progress: 30, updatedAt: new Date().toISOString() });
    await sleep(4000);
    updateVideo(videoId, { status: 'transcribing', progress: 55, updatedAt: new Date().toISOString() });
    await sleep(4000);
    updateVideo(videoId, { status: 'analyzing', progress: 75, updatedAt: new Date().toISOString() });
    await sleep(3000);
    updateVideo(videoId, { status: 'analyzing', progress: 90, updatedAt: new Date().toISOString() });
    await sleep(2000);
    updateVideo(videoId, { status: 'ready', progress: 100, duration: 847, updatedAt: new Date().toISOString() });
  } catch {
    updateVideo(videoId, { status: 'error' as any, progress: 0, updatedAt: new Date().toISOString() });
  }
}
